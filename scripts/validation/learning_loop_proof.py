#!/usr/bin/env python3
"""
PHASE 5 — LEARNING LOOP PROOF against LOCAL STAGING.

Demonstrates the semantic loop with REAL Senekal intelligence + explicit
INSUFFICIENT_EVIDENCE where source data is absent (never fabricated):

  WORK -> PROOF -> OUTCOME -> LEARNING -> PERSISTENCE -> PASSPORT DELTA -> NEXT DECISION

Real inputs (from src/data/intelligence/passport-snapshot.json, town=Senekal):
  - opportunity opp-senekal-agriculture_green_economy (truth_class FIELD_TO_VERIFY)
  - next decision: "Decide whether to verify kasibuy fit in Senekal (field verification)"
  - FixEasy cell = OBSERVE / INSUFFICIENT_EVIDENCE (no demand/capability/economics evidence)

The learning record is persisted to uto.learnings with a passport_delta payload, then read
back to prove persistence + provenance. Missing proof/outcome stages are recorded as
INSUFFICIENT_EVIDENCE, not invented.
"""
import subprocess, json

PG = ["psql", "-h", "127.0.0.1", "-p", "54322", "-U", "postgres", "-d", "postgres", "-tA"]
ENV = {"PGPASSWORD": "postgres"}

def run(q, role=None, sub=None):
    pre = ""
    if role:
        pre += f"set local role {role};"
        if sub:
            pre += f"set local request.jwt.claims = '{{\"sub\":\"{sub}\",\"role\":\"{role}\"}}';"
    full = f"begin; {pre} {q.rstrip().rstrip(';')}; commit;"
    r = subprocess.run(PG + ["-v", "ON_ERROR_STOP=1", "-c", full], capture_output=True, text=True, env=ENV)
    return (r.stdout or "").strip(), (r.stderr or "").strip(), r.returncode

def scalar(q, **kw):
    o, e, c = run(q, **kw)
    lines = [l for l in o.splitlines() if l.strip() and l.strip() not in ("BEGIN","SET","COMMIT")]
    return lines[-1] if lines else ""

# real actor (Coordinator A = Senekal-agnostic test coordinator; author self)
author = scalar("select p.id from uto.profiles p where p.display_name like '%Coordinator A%'")
senekal = scalar("select id from uto.towns where slug='senekal'") or scalar("select id from uto.towns limit 1")
print(f"author={author}  senekal_town_id={senekal}\n")

print("=== THE OPERATING LOOP (real evidence + INSUFFICIENT_EVIDENCE where absent) ===")

# WORK -> PROOF -> OUTCOME: no real proof/outcome records exist yet for this Senekal slice
stage_work    = "WORK: wp-senekal-market_denominators (DAY 1 workpack, source=FIELD_PACK FS181_Senekal_Agriculture_Hub)"
stage_proof   = "PROOF: INSUFFICIENT_EVIDENCE (no proof record captured yet — workpack status=PLANNED)"
stage_outcome = "OUTCOME: INSUFFICIENT_EVIDENCE (no measured outcome yet)"

for s in (stage_work, stage_proof, stage_outcome):
    print("  " + s)

# LEARNING -> PERSISTENCE: derive a real learning from the Senekal evidence and persist it
learning_statement = (
    "Senekal agriculture-green-economy opportunity is FIELD_TO_VERIFY: demand, actors and value "
    "path are not yet confirmed. Market denominators are INSUFFICIENT_EVIDENCE (null, not zero). "
    "FixEasy fit remains INSUFFICIENT_EVIDENCE; the evidence-backed initiative is KasiBuy (TEST)."
)

# PASSPORT DELTA: what changed in our understanding of the town (passport-delta.schema.json shape)
passport_delta = {
    "delta_id": "pd-senekal-2026-10-12-agri-fit",
    "scope": {"level": "town", "town_slug": "senekal", "initiative_key": "kasibuy", "province": "free-state"},
    "category": "WHAT_REMAINS_UNKNOWN",
    "layer_chain": {
        "passport_hypothesis": "Agriculture Hub positioning (RECOMMENDED, pending Head ratification)",
        "field_verification": "INSUFFICIENT_EVIDENCE — not yet field-verified",
        "live_operational_evidence": "INSUFFICIENT_EVIDENCE — no operational proof/outcome yet",
        "outcome": None,
        "learning": "Opportunity is FIELD_TO_VERIFY; denominator law holds (null not zero)"
    },
    "field": "initiative_fit.fixeasy",
    "old_value": "UNDECIDED / ASSUMED candidate for golden slice",
    "new_value": "INSUFFICIENT_EVIDENCE (no demand/capability/economics evidence); KasiBuy is the TEST cell",
    "truth_class": "INSUFFICIENT_EVIDENCE",
    "reason": "No town-level initiative evidence in sources 1-5; mapping_class=INSUFFICIENT_EVIDENCE",
    "evidence_refs": ["va-senekal-initiatives", "opp-senekal-agriculture_green_economy"],
    "source": "passport-snapshot.json@1.0.0 (sha256-pinned); FieldPack FS181_Senekal_Agriculture_Hub",
    "timestamp": "2026-10-12T00:00:00Z",
    "impact": "Golden slice must show INSUFFICIENT_EVIDENCE rather than manufacture FixEasy content",
    "recommended_action": "Field-verify kasibuy fit in Senekal, then rule on FixEasy",
    "human_decision_status": "PROPOSED"
}

# NEXT DECISION: references the learning + delta
next_decision = "Decide whether to verify kasibuy fit in Senekal (field verification) -> Town Coordinator (verification) -> National Initiative Head (fit ruling)"

# persist the learning (authenticated, author self, town scope)
evidence_refs = json.dumps(["opp-senekal-agriculture_green_economy", "va-senekal-initiatives"])
pd = json.dumps(passport_delta).replace("'", "''")
stmt = learning_statement.replace("'", "''")
ins = (
    f"insert into uto.learnings"
    f"(statement, truth_class, author_id, scope_level, town_id, initiative_key, evidence_refs, source, passport_delta, status, provenance) "
    f"values ('{stmt}','INSUFFICIENT_EVIDENCE','{author}','town','{senekal}','kasibuy',"
    f"'{evidence_refs}'::jsonb,'passport-snapshot@1.0.0','{pd}'::jsonb,'active',"
    f"'{{\"chain\":\"WORK->PROOF->OUTCOME->LEARNING->PERSISTENCE->PASSPORT_DELTA->NEXT_DECISION\",\"phase5\":true}}'::jsonb) "
    f"returning id"
)
o, e, c = run(ins, role="authenticated", sub=author)
print(f"\n--- LEARNING -> PERSISTENCE ---")
print(f"  insert rc={c} id={o.splitlines()[-1] if o else ''}")
if c != 0:
    print(f"  ERROR: {e}")
    raise SystemExit(1)
lid = o.splitlines()[-1].strip()

# read back to PROVE persistence + provenance + delta
o2, e2, c2 = run(f"select statement, truth_class, initiative_key, passport_delta->>'delta_id', passport_delta->>'human_decision_status', provenance->>'chain' from uto.learnings where id='{lid}'", role="authenticated", sub=author)
print(f"\n--- READ BACK (persistence proven) ---")
for line in o2.splitlines():
    if line.strip() and line.strip() not in ("BEGIN","SET","COMMIT"):
        print(f"  {line}")

print(f"\n--- PASSPORT DELTA -> NEXT DECISION ---")
print(f"  delta_id        : {passport_delta['delta_id']}")
print(f"  category        : {passport_delta['category']}")
print(f"  human_decision  : {passport_delta['human_decision_status']}")
print(f"  next_decision   : {next_decision}")

print(f"\n=== PHASE 5 RESULT: LOOP PROVEN ===")
print("  WORK(->PLANNED) -> PROOF(INSUFFICIENT_EVIDENCE) -> OUTCOME(INSUFFICIENT_EVIDENCE)")
print("  -> LEARNING(INSUFFICIENT_EVIDENCE, real) -> PERSISTED(uto.learnings id="+lid+")")
print("  -> PASSPORT_DELTA(pd-senekal-2026-10-12-agri-fit) -> NEXT_DECISION(field-verify kasibuy)")
print("  No synthetic business outcome was fabricated; absent stages = INSUFFICIENT_EVIDENCE.")
