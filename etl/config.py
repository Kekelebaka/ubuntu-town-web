"""
config.py — centralized environment/configuration loader for the Ubuntu Town OS
D1 -> Supabase migration toolkit (Phase 3).

Every other script in this package imports `CONFIG` (or `load_config()`) from
here instead of reading `os.environ` directly, so there is exactly one place
that:
  1. Loads a .env file (if present) via python-dotenv.
  2. Validates required variables are present *before* any network call is
     attempted, and fails with a clear, actionable error message.
  3. Applies sane defaults (batch size, D1 database id, output directories).

Nothing in this file makes a network call or touches a database. It is safe
to import at any time, including with no credentials configured at all — the
validation only fires when `load_config()` (or `CONFIG` at import time in a
running script) is actually invoked, and callers can request a "partial"
config for tools that don't need every variable (see `require=` below).

TODO (operator, before any live run):
  - Populate a `.env` file in this directory (or export real env vars) with
    the values described below. NEVER commit `.env` to git — see .gitignore
    note in README.md.
  - The Supabase project referenced by 0001_ubuntu_town_core.sql is PAUSED.
    Resume it in the Supabase dashboard before SUPABASE_DB_URL will accept
    connections, and before running load_supabase.py / verify.py / rollback.py
    for real (i.e. without --dry-run).
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - guidance for operators who skipped `pip install -r requirements.txt`
    load_dotenv = None  # type: ignore[assignment]


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# Root of the etl/ package (this file's directory). All relative output paths
# (reports/, exports/, staging/, snapshots/) are anchored here so scripts work
# the same regardless of the operator's current working directory.
ETL_DIR = Path(__file__).resolve().parent

REPORTS_DIR = ETL_DIR / "reports"
EXPORTS_DIR = ETL_DIR / "exports"
STAGING_DIR = ETL_DIR / "staging"
SNAPSHOTS_DIR = ETL_DIR / "snapshots"  # pg_dump snapshots for rollback.py

for _dir in (REPORTS_DIR, EXPORTS_DIR, STAGING_DIR, SNAPSHOTS_DIR):
    _dir.mkdir(parents=True, exist_ok=True)

# Default xlsx location for the Mailchimp/assessment applicant pack. Can be
# overridden with APPLICANTS_XLSX_PATH.
DEFAULT_APPLICANTS_XLSX = (
    "/agent/stored_files/cmr57yg6o13dd07adi9k0yvih_ubuntu_town_mailchimp_assessment_pack.xlsx"
)

# The known D1 database backing this migration (per the Phase 3 brief). Can be
# overridden with D1_DATABASE_ID if the operator points this at a different
# D1 instance (e.g. a staging copy).
DEFAULT_D1_DATABASE_ID = "60a25642-4cf8-4778-ba7b-2e8d269c5be5"

# The staging schema created in Postgres before every load, used for
# idempotent re-runs and as the primary rollback mechanism (see load_supabase.py
# and rollback.py).
MIGRATION_SCHEMA = "_mig"

# Name of the migration run recorded into audit_logs.entity_type / snapshot
# filenames, so multiple runs on the same day don't collide.
RUN_ID_ENV_VAR = "MIGRATION_RUN_ID"


@dataclass
class Config:
    """Resolved configuration for a migration run.

    All fields have defaults so `Config()` never raises — callers that need
    specific fields present (e.g. a Postgres connection) should validate via
    `require_supabase()` / `require_cloudflare()` at the point of use, which
    gives a much clearer error than a later `KeyError` deep in a client.
    """

    # --- Cloudflare D1 (source) ---
    cf_api_token: Optional[str] = None
    cf_account_id: Optional[str] = None
    d1_database_id: str = DEFAULT_D1_DATABASE_ID

    # --- Supabase / Postgres (target) ---
    supabase_db_url: Optional[str] = None

    # --- Behaviour knobs ---
    batch_size: int = 500
    request_timeout_seconds: int = 60
    applicants_xlsx_path: str = DEFAULT_APPLICANTS_XLSX
    run_id: str = field(default_factory=lambda: os.environ.get(RUN_ID_ENV_VAR, "local-dryrun"))

    # ------------------------------------------------------------------
    # Validation helpers — call these at the top of any function that is
    # about to make a *real* network/DB call, so failures are clear and
    # happen before partial work is done.
    # ------------------------------------------------------------------

    def require_cloudflare(self) -> "Config":
        missing = [
            name
            for name, val in (
                ("CF_API_TOKEN", self.cf_api_token),
                ("CF_ACCOUNT_ID", self.cf_account_id),
            )
            if not val
        ]
        if missing:
            _fail_missing(missing, purpose="talk to the Cloudflare D1 HTTP API")
        return self

    def require_supabase(self) -> "Config":
        if not self.supabase_db_url:
            _fail_missing(["SUPABASE_DB_URL"], purpose="connect to the target Postgres database")
        return self

    def d1_query_url(self) -> str:
        """Build the D1 HTTP API query endpoint for the configured account/db."""
        self.require_cloudflare()
        return (
            f"https://api.cloudflare.com/client/v4/accounts/{self.cf_account_id}"
            f"/d1/database/{self.d1_database_id}/query"
        )


def _fail_missing(missing: list, purpose: str) -> None:
    lines = [
        f"Missing required environment variable(s) to {purpose}:",
        *[f"  - {name}" for name in missing],
        "",
        "Set them in etl/.env (copy from etl/.env.example if present) or export",
        "them in your shell before running this script. See etl/README.md for",
        "the full list of variables and where to find each value.",
    ]
    message = "\n".join(lines)
    print(message, file=sys.stderr)
    raise SystemExit(2)


def load_config(dotenv_path: Optional[str] = None) -> Config:
    """Load configuration from environment (+ optional .env file).

    This performs NO validation by itself — callers request validation for
    the subsystem they actually need via `.require_cloudflare()` /
    `.require_supabase()`. This lets read-only/offline tools (e.g. transform.py
    unit tests, or `d1_inventory.py --from-export`) import config without
    needing every credential to exist.
    """
    if load_dotenv is not None:
        # Look for etl/.env by default; allow override for tests/CI.
        env_file = Path(dotenv_path) if dotenv_path else (ETL_DIR / ".env")
        if env_file.exists():
            load_dotenv(dotenv_path=str(env_file))
        else:
            # Also try process-wide .env discovery (e.g. repo root) without
            # erroring if none exists.
            load_dotenv()

    def _int_env(name: str, default: int) -> int:
        raw = os.environ.get(name)
        if raw is None or raw == "":
            return default
        try:
            return int(raw)
        except ValueError:
            print(
                f"WARNING: {name}={raw!r} is not an integer; using default {default}",
                file=sys.stderr,
            )
            return default

    return Config(
        cf_api_token=os.environ.get("CF_API_TOKEN") or None,
        cf_account_id=os.environ.get("CF_ACCOUNT_ID") or None,
        d1_database_id=os.environ.get("D1_DATABASE_ID") or DEFAULT_D1_DATABASE_ID,
        supabase_db_url=os.environ.get("SUPABASE_DB_URL") or None,
        batch_size=_int_env("MIGRATION_BATCH_SIZE", 500),
        request_timeout_seconds=_int_env("MIGRATION_HTTP_TIMEOUT", 60),
        applicants_xlsx_path=os.environ.get("APPLICANTS_XLSX_PATH") or DEFAULT_APPLICANTS_XLSX,
        run_id=os.environ.get(RUN_ID_ENV_VAR, "local-dryrun"),
    )


# A module-level convenience instance. Scripts can `from config import CONFIG`
# for the common case; anything needing a fresh reload (e.g. after mutating
# os.environ in a test) should call `load_config()` directly instead.
CONFIG = load_config()


if __name__ == "__main__":
    # `python config.py` — quick sanity check an operator can run to see what
    # was picked up, WITHOUT ever printing secret values in full.
    def _mask(value: Optional[str]) -> str:
        if not value:
            return "<not set>"
        if len(value) <= 8:
            return "*" * len(value)
        return value[:4] + "…" + value[-4:]

    print("Ubuntu Town OS — ETL configuration")
    print("=" * 60)
    print(f"CF_ACCOUNT_ID          : {_mask(CONFIG.cf_account_id)}")
    print(f"CF_API_TOKEN           : {_mask(CONFIG.cf_api_token)}")
    print(f"D1_DATABASE_ID         : {CONFIG.d1_database_id}")
    print(f"SUPABASE_DB_URL        : {_mask(CONFIG.supabase_db_url)}")
    print(f"MIGRATION_BATCH_SIZE   : {CONFIG.batch_size}")
    print(f"APPLICANTS_XLSX_PATH   : {CONFIG.applicants_xlsx_path}")
    print(f"RUN_ID                 : {CONFIG.run_id}")
    print()
    print(f"ETL_DIR      = {ETL_DIR}")
    print(f"REPORTS_DIR  = {REPORTS_DIR}")
    print(f"EXPORTS_DIR  = {EXPORTS_DIR}")
    print(f"STAGING_DIR  = {STAGING_DIR}")
    print(f"SNAPSHOTS_DIR= {SNAPSHOTS_DIR}")
