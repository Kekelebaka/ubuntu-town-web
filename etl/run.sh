#!/usr/bin/env bash
#
# run.sh — orchestrate the full Ubuntu Town OS D1 -> Supabase migration
# pipeline end to end:
#
#     1. d1_inventory.py     baseline: what does D1 currently hold?
#     2. export_d1.py        freeze every D1 table to exports/*.jsonl
#     3. import_applicants.py load the xlsx applicant pack -> staging/*.jsonl
#     4. transform.py         (sanity check only — see NOTE below; the real
#                              D1-export -> staging/*.jsonl transform driver
#                              is a documented TODO in load_supabase.py, since
#                              this toolkit ships against an ASSUMED D1 schema)
#     5. load_supabase.py     load staging/*.jsonl into Supabase (DRY RUN by
#                              default — see --commit below)
#     6. verify.py            reconcile row counts, dedupe, and integrity
#
# DEFAULT MODE: everything above runs in DRY RUN. No row is ever written to
# Supabase unless you explicitly pass --commit to this script AND have real,
# working credentials in etl/.env (see README.md). Steps 1-2 require
# CF_API_TOKEN/CF_ACCOUNT_ID; steps 3-4 need no credentials at all (they only
# touch the local xlsx + local files); steps 5-6 need SUPABASE_DB_URL only
# once --commit (or `verify.py --live`) is used.
#
# Usage:
#   ./run.sh                     # full dry-run pipeline (no creds required
#                                 #   for steps 3-6; steps 1-2 need CF creds
#                                 #   and are SKIPPED with a clear notice if
#                                 #   those are not set)
#   ./run.sh --commit             # step 5 performs REAL writes to Supabase
#                                 #   (requires SUPABASE_DB_URL; steps 1-2/6
#                                 #   still need their own creds to do more
#                                 #   than skip/dry-run)
#   ./run.sh --skip-d1            # skip steps 1-2 outright (e.g. you already
#                                 #   have exports/ from a previous run and
#                                 #   just want to redo 3-6)
#   ./run.sh --only-xlsx          # alias for: run steps 3, 5, 6 only (the
#                                 #   xlsx-applicant-pack half of the
#                                 #   pipeline, which needs zero D1 access)
#   ./run.sh --pgdump             # forwarded to load_supabase.py --commit
#                                 #   (only meaningful together with --commit)
#
# Exit code is non-zero if any REQUIRED step fails. Steps that are skipped
# because credentials are missing print a clear notice but do NOT fail the
# overall run (this script is meant to be runnable, and informative, even
# with zero configuration — exactly what a first-time operator needs to see
# what's missing before doing anything real).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PYTHON="${PYTHON:-python3}"

COMMIT=false
SKIP_D1=false
ONLY_XLSX=false
PGDUMP=false
VERIFY_LIVE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --commit)
      COMMIT=true
      shift
      ;;
    --skip-d1)
      SKIP_D1=true
      shift
      ;;
    --only-xlsx)
      ONLY_XLSX=true
      SKIP_D1=true
      shift
      ;;
    --pgdump)
      PGDUMP=true
      shift
      ;;
    --verify-live)
      VERIFY_LIVE=true
      shift
      ;;
    -h|--help)
      # Print only the header comment block (from the shebang up to the
      # first blank-after-comments / code line), NOT every '#'-prefixed
      # line in the whole script — the pipeline body below also contains
      # '# STEP N:' section dividers and inline comments that are not part
      # of the usage text and would otherwise leak into --help output.
      awk '/^#!/{next} /^#/{sub(/^# ?/,""); print; next} {exit}' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Run with --help for usage." >&2
      exit 2
      ;;
  esac
done

STEPS_RUN=0
FAILED_STEPS=()
SKIPPED_STEPS=()

banner() {
  # banner <fixed step number 1-6> <description>
  # Takes an explicit step number (matching the 6 documented pipeline
  # stages in the header comment) rather than auto-incrementing, so the
  # printed "STEP N" always matches the pipeline diagram above regardless
  # of which earlier steps were skipped for missing credentials.
  STEPS_RUN=$((STEPS_RUN + 1))
  echo ""
  echo "========================================================================"
  echo " STEP $1: $2"
  echo "========================================================================"
}

run_step() {
  # run_step <step name> <command...>
  # Runs the command; on non-zero exit, records the failure but lets the
  # pipeline continue to later steps that don't strictly depend on this one
  # (e.g. a failed D1 export shouldn't prevent the xlsx half from running),
  # while still causing the OVERALL script to exit non-zero at the end.
  local name="$1"
  shift
  echo "+ $*"
  if "$@"; then
    return 0
  else
    local rc=$?
    echo "!! STEP FAILED: ${name} (exit ${rc})" >&2
    FAILED_STEPS+=("${name}")
    return "$rc"
  fi
}

skip_step() {
  local name="$1"
  local reason="$2"
  echo ""
  echo "-- SKIPPING: ${name}"
  echo "   Reason: ${reason}"
  SKIPPED_STEPS+=("${name}: ${reason}")
}

have_cloudflare_creds() {
  [[ -n "${CF_API_TOKEN:-}" ]] && [[ -n "${CF_ACCOUNT_ID:-}" ]]
}

have_supabase_creds() {
  [[ -n "${SUPABASE_DB_URL:-}" ]]
}

# Load .env (if present) the same way config.py does via python-dotenv, so a
# credential set in etl/.env is visible to this script's have_*_creds()
# checks too, not just to the Python processes it launches.
if [[ -f "${SCRIPT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/.env"
  set +a
fi

echo "Ubuntu Town OS — D1 -> Supabase migration pipeline"
echo "Mode: $([[ "$COMMIT" == true ]] && echo 'COMMIT (real writes)' || echo 'DRY RUN (no writes)')"
echo "Working directory: ${SCRIPT_DIR}"

# ---------------------------------------------------------------------------
# STEP 1: D1 inventory (baseline)
# ---------------------------------------------------------------------------
if [[ "$SKIP_D1" == true ]]; then
  skip_step "d1_inventory.py" "--skip-d1/--only-xlsx passed"
elif ! have_cloudflare_creds; then
  skip_step "d1_inventory.py" "CF_API_TOKEN and/or CF_ACCOUNT_ID not set (see etl/README.md)"
else
  banner 1 "D1 inventory (baseline row counts)"
  run_step "d1_inventory.py" "$PYTHON" d1_inventory.py
fi

# ---------------------------------------------------------------------------
# STEP 2: D1 export (freeze source data to exports/*.jsonl)
# ---------------------------------------------------------------------------
if [[ "$SKIP_D1" == true ]]; then
  skip_step "export_d1.py" "--skip-d1/--only-xlsx passed"
elif ! have_cloudflare_creds; then
  skip_step "export_d1.py" "CF_API_TOKEN and/or CF_ACCOUNT_ID not set (see etl/README.md)"
else
  banner 2 "D1 export (freeze source tables to exports/*.jsonl)"
  run_step "export_d1.py" "$PYTHON" export_d1.py
fi

# ---------------------------------------------------------------------------
# STEP 3: import xlsx applicant pack -> staging/*.jsonl
# ---------------------------------------------------------------------------
banner 3 "Import xlsx applicant pack (staging/applications.jsonl, staging/towns_from_xlsx.jsonl)"
run_step "import_applicants.py" "$PYTHON" import_applicants.py

# ---------------------------------------------------------------------------
# STEP 4: transform.py sanity check
# ---------------------------------------------------------------------------
# NOTE: transform.py's functions are a pure library (no CLI pipeline of their
# own) meant to be called per-row by a driver over exports/*.jsonl once real,
# confirmed D1 table/column names exist (see the TODO in
# load_supabase.py::_load_staged_inputs and transform.py's module docstring
# for why this scaffold does not assume exact D1 column names). Until that
# driver is written for your real D1 schema, this step is a self-test: it
# imports transform.py and dumps its MAPPING table so an operator can see,
# at a glance, every D1 table this toolkit knows how to map and exactly
# which target table(s)/natural key/fields it expects — the fastest way to
# spot a column-name mismatch against your real D1 schema before wiring up
# the real driver.
banner 4 "transform.py sanity check (print MAPPING; confirms the module imports and every mapping is well-formed)"
run_step "transform.py --self-check" "$PYTHON" -c "
import json
from transform import MAPPING
print(f'{len(MAPPING)} source-table mapping(s) defined:')
for source, spec in MAPPING.items():
    targets = ', '.join(spec['target_tables'])
    print(f'  - {source:<35} -> {targets:<30} natural_key={spec[\"natural_key\"]}')
"

# ---------------------------------------------------------------------------
# STEP 5: load into Supabase
# ---------------------------------------------------------------------------
banner 5 "Load staged data into Supabase ($([[ "$COMMIT" == true ]] && echo 'COMMIT' || echo 'DRY RUN'))"
LOAD_ARGS=()
if [[ "$COMMIT" == true ]]; then
  if ! have_supabase_creds; then
    skip_step "load_supabase.py --commit" "SUPABASE_DB_URL not set — cannot commit. Falling back to --dry-run so the rest of the pipeline still produces useful output."
    LOAD_ARGS+=(--dry-run)
  else
    LOAD_ARGS+=(--commit)
    if [[ "$PGDUMP" == true ]]; then
      LOAD_ARGS+=(--pgdump)
    fi
  fi
else
  LOAD_ARGS+=(--dry-run)
fi
run_step "load_supabase.py" "$PYTHON" load_supabase.py "${LOAD_ARGS[@]}"

# ---------------------------------------------------------------------------
# STEP 6: verify
# ---------------------------------------------------------------------------
banner 6 "Verify (row-count reconciliation, duplicate detection, integrity checks)"
VERIFY_ARGS=()
if [[ "$VERIFY_LIVE" == true ]]; then
  if have_supabase_creds; then
    VERIFY_ARGS+=(--live)
  else
    echo "-- --verify-live requested but SUPABASE_DB_URL is not set; running verify.py without --live"
  fi
fi
run_step "verify.py" "$PYTHON" verify.py "${VERIFY_ARGS[@]}"
VERIFY_RC=$?

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "========================================================================"
echo " PIPELINE SUMMARY"
echo "========================================================================"
echo "Steps run       : ${STEPS_RUN} of 6"
echo "Steps failed    : ${#FAILED_STEPS[@]}"
for s in "${FAILED_STEPS[@]:-}"; do
  [[ -n "$s" ]] && echo "  - FAILED: $s"
done
echo "Steps skipped   : ${#SKIPPED_STEPS[@]}"
for s in "${SKIPPED_STEPS[@]:-}"; do
  [[ -n "$s" ]] && echo "  - SKIPPED: $s"
done
echo ""
echo "Reports written to : ${SCRIPT_DIR}/reports/"
echo "  - d1_inventory.json           (step 1, if it ran)"
echo "  - applicants_import_summary.json, applicants_dupes.json (step 3)"
echo "  - load_dryrun_summary.json  or  load_commit_summary.json (step 5)"
echo "  - verify.md                    (step 6 — START HERE for pass/fail)"
echo ""

if [[ "$COMMIT" != true ]]; then
  echo "This was a DRY RUN. No data was written to Supabase."
  echo "Once the plan above looks correct, re-run with: ./run.sh --commit"
  echo "(requires SUPABASE_DB_URL to point at a RESUMED, reachable Postgres instance)"
fi

if [[ ${#FAILED_STEPS[@]} -gt 0 ]] || [[ $VERIFY_RC -ne 0 ]]; then
  echo ""
  echo "RESULT: FAILED — see failed steps above and reports/verify.md for details."
  exit 1
fi

echo "RESULT: OK"
exit 0
