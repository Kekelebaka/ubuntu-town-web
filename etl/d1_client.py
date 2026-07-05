"""
d1_client.py — thin HTTP client for the Cloudflare D1 Query API.

D1 has no direct TCP/SQL-wire protocol for external callers; all access goes
through the Cloudflare REST API:

    POST https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}/query
    Headers: Authorization: Bearer {CF_API_TOKEN}
    Body:    {"sql": "SELECT ...", "params": [...]}

Docs: https://developers.cloudflare.com/api/operations/cloudflare-d1-query-database

This module wraps that single endpoint with:
  - `D1Client.query(sql, params)`      -> list[dict] of result rows
  - `D1Client.list_tables()`           -> list[str] of user table names (via sqlite_master)
  - `D1Client.table_columns(table)`    -> list[str] of column names (via PRAGMA table_info)
  - `D1Client.count_rows(table)`       -> int
  - `D1Client.fetch_page(table, ...)`  -> paginated rows for export

No caching, no retries-with-backoff beyond a small number of transient-error
retries — this is a migration utility run interactively/by a human operator,
not a long-lived service. Every network call is isolated so `export_d1.py`
and `d1_inventory.py` can be unit-tested by monkeypatching `D1Client.query`.

TODO (operator): this module makes REAL network calls once CF_API_TOKEN /
CF_ACCOUNT_ID are set. It is not invoked at import time by anything in this
package — d1_inventory.py / export_d1.py call it explicitly, and both accept
--dry-run style guards documented in their own docstrings/README.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence

import requests

from config import Config, CONFIG

# Cloudflare's D1 HTTP API caps result sets; we page defensively even though
# most Ubuntu Town OS D1 tables are small. 1000 matches the practical ceiling
# Cloudflare documents for a single `/query` call before you should paginate
# with LIMIT/OFFSET yourself.
DEFAULT_PAGE_SIZE = 1000

# Retry a handful of times on 5xx / network hiccups. D1's control plane can
# occasionally return 522/524 under load; application-level (4xx) errors are
# never retried since retrying a bad SQL statement will just fail again.
MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = 2.0


class D1ClientError(RuntimeError):
    """Raised for any non-2xx or `success: false` response from the D1 API."""


@dataclass
class D1QueryResult:
    """Normalized shape of one statement's result from the D1 /query endpoint."""

    rows: List[Dict[str, Any]]
    columns: List[str]
    rows_read: int
    rows_written: int
    raw: Dict[str, Any]


class D1Client:
    """Minimal client for the Cloudflare D1 HTTP Query API.

    Usage:
        client = D1Client(CONFIG)
        tables = client.list_tables()
        rows = client.query("SELECT * FROM coordinators LIMIT 10")
    """

    def __init__(self, config: Optional[Config] = None, session: Optional[requests.Session] = None):
        self.config = config or CONFIG
        self.session = session or requests.Session()

    # ------------------------------------------------------------------
    # Core query execution
    # ------------------------------------------------------------------

    def query(self, sql: str, params: Optional[Sequence[Any]] = None) -> D1QueryResult:
        """Execute a single SQL statement against D1 and return its result.

        Raises D1ClientError on any failure (HTTP error, D1-reported error,
        or a malformed response body) so callers don't have to remember to
        check `success` themselves.
        """
        self.config.require_cloudflare()
        url = self.config.d1_query_url()
        headers = {
            "Authorization": f"Bearer {self.config.cf_api_token}",
            "Content-Type": "application/json",
        }
        body: Dict[str, Any] = {"sql": sql}
        if params:
            body["params"] = list(params)

        last_error: Optional[Exception] = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = self.session.post(
                    url,
                    headers=headers,
                    data=json.dumps(body),
                    timeout=self.config.request_timeout_seconds,
                )
            except requests.RequestException as exc:  # network-level failure
                last_error = exc
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_BACKOFF_SECONDS * attempt)
                    continue
                raise D1ClientError(f"Network error calling D1 API after {MAX_RETRIES} attempts: {exc}") from exc

            if resp.status_code >= 500 and attempt < MAX_RETRIES:
                # Transient server-side failure — retry.
                time.sleep(RETRY_BACKOFF_SECONDS * attempt)
                continue

            return self._parse_response(resp, sql)

        # Should not be reachable, but keeps type-checkers happy.
        raise D1ClientError(f"D1 query failed with no response: {last_error}")

    @staticmethod
    def _parse_response(resp: requests.Response, sql: str) -> D1QueryResult:
        try:
            payload = resp.json()
        except ValueError as exc:
            raise D1ClientError(
                f"D1 API returned non-JSON response (status={resp.status_code}) for SQL: {sql!r}\n"
                f"Body: {resp.text[:2000]}"
            ) from exc

        if resp.status_code != 200 or not payload.get("success", False):
            errors = payload.get("errors") or [{"message": resp.text[:2000]}]
            msg = "; ".join(e.get("message", str(e)) for e in errors)
            raise D1ClientError(f"D1 API error (status={resp.status_code}) for SQL {sql!r}: {msg}")

        # D1's /query response wraps results in a list (one entry per
        # statement in a multi-statement request); we only ever send one
        # statement per call, so take the first result set.
        result_list = payload.get("result") or []
        if not result_list:
            return D1QueryResult(rows=[], columns=[], rows_read=0, rows_written=0, raw=payload)

        first = result_list[0]
        rows = first.get("results") or []
        meta = first.get("meta") or {}
        columns = list(rows[0].keys()) if rows else list(meta.get("columns") or [])
        return D1QueryResult(
            rows=rows,
            columns=columns,
            rows_read=meta.get("rows_read", len(rows)),
            rows_written=meta.get("rows_written", 0),
            raw=payload,
        )

    # ------------------------------------------------------------------
    # Convenience helpers built on top of query()
    # ------------------------------------------------------------------

    def list_tables(self, include_internal: bool = False) -> List[str]:
        """List user table names via sqlite_master.

        By default excludes SQLite/D1 internal bookkeeping tables
        (sqlite_sequence, _cf_KV, d1_migrations, etc.) so downstream tools
        iterate only over real Ubuntu Town OS data tables.
        """
        sql = (
            "SELECT name FROM sqlite_master "
            "WHERE type = 'table' "
            "ORDER BY name"
        )
        result = self.query(sql)
        names = [row["name"] for row in result.rows]
        if include_internal:
            return names
        return [n for n in names if not _is_internal_table(n)]

    def table_columns(self, table: str) -> List[str]:
        """Return column names for `table` via PRAGMA table_info.

        Table name is validated against sqlite_master-derived identifiers
        upstream (see export_d1.py / d1_inventory.py) before being
        interpolated here; PRAGMA does not support bound parameters for the
        table name, so callers MUST NOT pass raw user input to this method.
        """
        _assert_safe_identifier(table)
        result = self.query(f"PRAGMA table_info({table})")
        # PRAGMA table_info rows look like: {cid, name, type, notnull, dflt_value, pk}
        return [row["name"] for row in result.rows]

    def count_rows(self, table: str) -> int:
        _assert_safe_identifier(table)
        result = self.query(f"SELECT COUNT(*) AS n FROM {table}")
        if not result.rows:
            return 0
        return int(result.rows[0]["n"])

    def fetch_page(
        self,
        table: str,
        limit: int = DEFAULT_PAGE_SIZE,
        offset: int = 0,
        order_by: str = "rowid",
    ) -> List[Dict[str, Any]]:
        """Fetch one LIMIT/OFFSET page of `table`, ordered by `order_by`.

        `rowid` is SQLite's implicit primary key and exists on every D1 table
        that is not declared WITHOUT ROWID, which covers every table in this
        migration's source schema. If a table turns out to be WITHOUT ROWID,
        pass its real primary key column as `order_by`.
        """
        _assert_safe_identifier(table)
        _assert_safe_identifier(order_by)
        sql = f"SELECT * FROM {table} ORDER BY {order_by} LIMIT ? OFFSET ?"
        result = self.query(sql, params=[limit, offset])
        return result.rows

    def iter_all_rows(self, table: str, page_size: int = DEFAULT_PAGE_SIZE, order_by: str = "rowid"):
        """Generator yielding every row of `table`, paginated transparently.

        Used by export_d1.py so the whole table never needs to fit in a
        single D1 API response.
        """
        offset = 0
        while True:
            page = self.fetch_page(table, limit=page_size, offset=offset, order_by=order_by)
            if not page:
                return
            for row in page:
                yield row
            if len(page) < page_size:
                return
            offset += page_size


# ---------------------------------------------------------------------------
# Small internal guards — D1's PRAGMA/DDL-adjacent calls can't use bound
# parameters for identifiers, so we whitelist-validate any table/column name
# that gets string-interpolated into SQL we build ourselves.
# ---------------------------------------------------------------------------

_INTERNAL_TABLE_PREFIXES = ("sqlite_", "_cf_", "d1_")


def _is_internal_table(name: str) -> bool:
    lname = name.lower()
    return any(lname.startswith(p) for p in _INTERNAL_TABLE_PREFIXES)


def _assert_safe_identifier(identifier: str) -> None:
    """Guard against SQL injection via table/column names built from prior
    query results (sqlite_master / PRAGMA), which are trusted D1 metadata but
    are still validated defensively here since they get string-interpolated.
    """
    if not identifier or not all(c.isalnum() or c == "_" for c in identifier):
        raise D1ClientError(f"Refusing to interpolate unsafe SQL identifier: {identifier!r}")


if __name__ == "__main__":
    # `python d1_client.py` — smoke test that lists tables and row counts.
    # Requires CF_API_TOKEN / CF_ACCOUNT_ID to be set; will raise a clear
    # SystemExit(2) via config.require_cloudflare() otherwise.
    client = D1Client()
    print(f"Listing tables in D1 database {CONFIG.d1_database_id} ...")
    for t in client.list_tables():
        print(f"  {t:<40} rows={client.count_rows(t)}")
