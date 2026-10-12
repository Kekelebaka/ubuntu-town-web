#!/usr/bin/env python3
"""
Phase 4 + Phase 6 validation for uto.learnings against the LOCAL STAGING database.

Simulates authenticated users via PostgREST JWT claims (request.jwt.claims + role) so RLS
is exercised at the DATA layer (not UI). Asserts:
  - schema/RLS present
  - author can INSERT within own town scope   -> PASS
  - cross-town INSERT                          -> DENIED
  - cross-town SELECT                          -> DENIED (0 rows)
  - unauthenticated SELECT                     -> DENIED (0 rows)
  - content UPDATE (immutability)              -> REJECTED
  - lifecycle UPDATE (status)                  -> ALLOWED
  - supersedes versioning                      -> PASS
  - cross-initiative insert (no scope)         -> DENIED
  - national (ops) read all                    -> PASS

Run: python3 learnings_validation.py   (uses psql on 127.0.0.1:54322)
"""
import subprocess, uuid, sys, re

PG = ["psql", "-h", "127.0.0.1", "-p", "54322", "-U", "postgres", "-d", "postgres", "-tA"]
ENV = {"PGPASSWORD": "postgres"}

# psql command tags to ignore when extracting data rows from combined -c output
_TAG = re.compile(r'^(BEGIN|SET|COMMIT|ROLLBACK|INSERT\s+\d|UPDATE\s+\d|DELETE\s+\d|SELECT\s+\d|CREATE\s+\w+|DROP\s+\w+|ALTER\s+\w+|COMMENT|DO|TRUNCATE)\b')

def _clean(out):
    rows = []
    for ln in (out or "").splitlines():
        s = ln.strip()
        if not s or _TAG.match(s):
            continue
        rows.append(s)
    return rows

def sql(query, role=None, sub=None):
    pre = ""
    if role:
        pre += f"set local role {role};"
    if sub:
        r = role or "authenticated"
        claims = '{"sub":"' + sub + '","role":"' + r + '"}'
        pre += "set local request.jwt.claims = '" + claims + "';"
        pre += "set local request.jwt.claim.sub = '" + sub + "';"
    full = f"begin; {pre} {query.rstrip().rstrip(';')}; commit;"
    r = subprocess.run(PG + ["-v", "ON_ERROR_STOP=1", "-c", full],
                       capture_output=True, text=True, env={**ENV})
    rows = _clean(r.stdout)
    return ("\n".join(rows)).strip(), (r.stderr or "").strip(), r.returncode

def scalar(q, **kw):
    o, e, c = sql(q, **kw)
    lines = o.splitlines()
    return lines[-1] if lines else ""

def raw_scalar(q):
    """Single SELECT without begin/commit wrapper — for setup lookups."""
    r = subprocess.run(PG + ["-c", q], capture_output=True, text=True, env=ENV)
    rows = _clean(r.stdout)
    return rows[-1] if rows else ""

def denied(o, c, expect_zero="0"):
    """A denial is either a clean 0-row result OR a permission/RLS error (fail-closed)."""
    return (c != 0) or (o.strip() == expect_zero)

def errmsg(e):
    """Extract the ERROR: line from psql stderr (not the caret line)."""
    for ln in (e or "").splitlines():
        if ln.strip().lower().startswith("error:"):
            return ln.strip()
    return ""

results = []
def check(name, ok, detail=""):
    results.append((name, "PASS" if ok else "FAIL", detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))

# resolve seeded actors
coord_a = raw_scalar("select p.id from uto.users u join uto.profiles p on p.id=u.id where p.display_name like '%Coordinator A%'")
coord_b = raw_scalar("select p.id from uto.users u join uto.profiles p on p.id=u.id where p.display_name like '%Coordinator B%'")
town_a  = raw_scalar(f"select town_id from uto.profiles where id='{coord_a}'") if coord_a else ""
town_b  = raw_scalar(f"select town_id from uto.profiles where id='{coord_b}'") if coord_b else ""
ops_user = raw_scalar("select ra.user_id from uto.role_assignments ra where ra.role_key='ops' limit 1") or coord_a
print(f"Actors: A={coord_a} town={town_a} | B={coord_b} town={town_b} | ops={ops_user}\n")

# --- 1. author INSERT within own town (authenticated) ---
ev = '["ev-test-1"]'
o,e,c = sql(f"insert into uto.learnings(statement,truth_class,author_id,scope_level,town_id,evidence_refs,source) values ('A learned X','VERIFIED','{coord_a}','town','{town_a}','{ev}','validation') returning id;", role="authenticated", sub=coord_a)
check("INSERT within own town scope", c==0 and o, errmsg(e) or ("row id="+o if c==0 else "unexpectedly denied"))

# --- 2. cross-town INSERT -> DENIED ---
o,e,c = sql(f"insert into uto.learnings(statement,truth_class,author_id,scope_level,town_id,evidence_refs) values ('cross town','VERIFIED','{coord_a}','town','{town_b}','{ev}');", role="authenticated", sub=coord_a)
check("cross-town INSERT denied", c!=0, errmsg(e) if e else "unexpectedly allowed")

# --- 3. unauthenticated SELECT -> 0 rows or denied ---
o,e,c = sql("select count(*) from uto.learnings;", role="anon")
check("unauthenticated SELECT denied", denied(o,c), f"count={o!r} rc={c}")

# --- 4. cross-town SELECT -> B sees 0 of A's town rows ---
o,e,c = sql(f"select count(*) from uto.learnings where town_id='{town_a}';", role="authenticated", sub=coord_b)
check("cross-town SELECT denied (B sees A's rows)", denied(o,c), f"count={o!r} rc={c}")

# --- 5. own-town SELECT -> A sees own rows ---
o,e,c = sql(f"select count(*) from uto.learnings where town_id='{town_a}';", role="authenticated", sub=coord_a)
check("own-town SELECT allowed (A sees own rows)", c==0 and int(o or 0)>=1, f"count={o}")

# --- 6. content UPDATE (immutability) -> REJECTED ---
lid = scalar(f"select id from uto.learnings where town_id='{town_a}' and author_id='{coord_a}' limit 1")
o,e,c = sql(f"update uto.learnings set statement='TAMPERED' where id='{lid}';", role="authenticated", sub=coord_a)
check("content UPDATE rejected (immutable)", c!=0, errmsg(e) if e else "unexpectedly allowed")

# --- 7. lifecycle UPDATE (status) -> ALLOWED ---
o,e,c = sql(f"update uto.learnings set status='refuted' where id='{lid}';", role="authenticated", sub=coord_a)
check("lifecycle UPDATE allowed (status)", c==0, errmsg(e) if c else "status updated")

# --- 8. supersedes versioning -> PASS ---
o,e,c = sql(f"insert into uto.learnings(statement,truth_class,author_id,scope_level,town_id,evidence_refs,supersedes) values ('A corrected','VERIFIED','{coord_a}','town','{town_a}','{ev}','{lid}') returning version;", role="authenticated", sub=coord_a)
check("supersedes versioning insert", c==0 and o, f"new row version={o}")

# --- 9. cross-initiative INSERT (no initiative scope, null town) -> DENIED ---
o,e,c = sql(f"insert into uto.learnings(statement,truth_class,author_id,scope_level,initiative_key,evidence_refs) values ('init leak','VERIFIED','{coord_a}','initiative','kasibuy','{ev}');", role="authenticated", sub=coord_a)
check("cross-initiative INSERT denied (no scope)", c!=0, errmsg(e) if e else "unexpectedly allowed")

# --- 10. national scope ---
# 10a: a plain coordinator is NOT national (reinforces cross-town isolation)
o,e,c = sql("select app.is_national();", role="authenticated", sub=coord_b)
check("coordinator is_national() = false", c==0 and o.strip() in ("false","f","0"), f"is_national={o!r}")

# 10b: elevate coord_b to national ('ops', town_id NULL) in a ROLLBACK transaction so the
# elevation does not persist (keeps the suite idempotent), then cross-town read works.
claims = '{"sub":"' + coord_b + '","role":"authenticated"}'
nat_sql = ("begin;"
           "insert into uto.role_assignments(user_id,role_key,town_id) values ('" + coord_b + "','ops',null);"
           "set local role authenticated;"
           "set local request.jwt.claims = '" + claims + "';"
           "set local request.jwt.claim.sub = '" + coord_b + "';"
           "select count(distinct town_id) from uto.learnings;"
           "rollback;")
r = subprocess.run(PG + ["-v", "ON_ERROR_STOP=1", "-c", nat_sql], capture_output=True, text=True, env=ENV)
nat_rows = _clean(r.stdout)
vis = nat_rows[-1] if nat_rows else ""
check("national (ops) SELECT across towns", r.returncode==0 and int(vis or 0)>=1, f"distinct towns visible={vis!r}")

# --- summary ---
fails = [r for r in results if r[1]=="FAIL"]
print(f"\n=== RESULT: {len(results)-len(fails)}/{len(results)} PASS ===")
if fails:
    print("FAILURES:")
    for n,s,d in fails: print(f"  - {n}: {d}")
sys.exit(1 if fails else 0)
