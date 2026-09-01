# Living Town — Golden Path contract
1 September 2026 · Build 01 · Proposed design, not applied schema

## Source of truth and evidence boundary
Baseline: Kekelebaka/ubuntu-town-web, main 947f78b745f9e4c5cdecaf32e9e1f7442335423f. Phase 0 receipt plus Build 01 read-only column inspection inform this contract. No DDL or production data mutations have run. Validate policy/function definitions and migration drift in isolated staging before implementation.

| Step | Classification | Contract |
|---|---|---|
| Today | EXISTING NEEDS ADAPTER | New /living-town composes authenticated, explicitly scoped reads; V1 retained. |
| Mission | EXISTING REUSABLE | uto.missions definition; nullable work_type, cadence, active, optional town. Build 01 shows visible active local definitions plus global definitions. Display is not an eligibility or acceptance grant. |
| Accept | MISSING NEEDS IMPLEMENTATION | Atomic, idempotent acceptance associating mission, participant, occurrence and work. |
| Active work | EXISTING NEEDS ADAPTER | community_work + typed detail; stop partial creation and retry duplication. |
| Proof | EXISTING NEEDS ADAPTER | proofs and media_assets; real private file upload missing from existing EvidencePanel. |
| Submit | EXISTING NEEDS ADAPTER | Preserve work state guard; enforce required evidence and consent at transaction boundary. |
| Review | EXISTING NEEDS ADAPTER | Existing review queue, work_approvals, audit_logs; independent proof review guard required. |
| Verified | MISSING NEEDS IMPLEMENTATION | Authoritative proof decision, immutable attribution and reviewer audit. Work publication is not proof verification. |
| Capability | MISSING NEEDS IMPLEMENTATION | Versioned requirements, evidence associations, award/revocation. |
| Next move | EXISTING NEEDS ADAPTER | Deterministic unfinished work then local mission; eligibility/capability recommendations follow verified contracts. |
| Opportunity | BLOCKED NEEDS DECISION | Validate public.opportunities/partner_offers eligibility, freshness and access. opportunity_points are local activation nodes, not offers. |

## Gap 1 — Durable mission acceptance
Reuse community_work as the work record and work_assignments as participant assignment. Do not create a second parallel task system. A proposed additive mission-participation association is justified because a recurring mission occurrence and its acceptance cannot be represented by the existing assignment alone. Existing assignment links only work_id to assignee_id, with free-text status; no mission or occurrence link exists.

Proposed `mission_participations`: id, mission_id FK, participant_id FK to uto.users, town_id FK, occurrence_key, work_id FK, assignment_id FK, accepted_at, started_at, submitted_at, completed_at, returned_at, version. Unique(mission_id, participant_id, town_id, occurrence_key). All attribution and occurrence identity immutable after acceptance. Occurrence key comes from server cadence rules, not arbitrary client text. Define week/timezone boundaries as Africa/Johannesburg; mission owner configures recurrence before acceptance opens. Do not enforce one participation for all time for recurring missions.

Atomic acceptance operation: validate authenticated user and mission active/eligible in selected town, insert participation using uniqueness, create draft parent work plus assignment, then link records in one transaction. A repeated request returns the existing participation and work; retries cannot create orphan work. A request id is scoped to participant and operation; collision with different payload fails. Lock mission/participation as needed; do not let two taps claim two work records.

Presentation transitions:
AVAILABLE → ACCEPTED → IN PROGRESS → SUBMITTED → REVIEW → COMPLETED / RETURNED.
RETURNED → IN PROGRESS → SUBMITTED is explicit. AVAILABLE is an eligible definition with no participation, not a persisted universal mission state. ACCEPTED is accepted_at with no start. Draft alone never proves acceptance or progress. Existing work statuses remain the work truth: do not silently change their enum. Map draft/submitted/in_review/rejected/published through an adapter; COMPLETED requires required evidence verified, never merely published. Accepted/start events are participant events, submitted/review/completed derive from guarded domain transitions.

Authorization: participant accepts for self; an operator assigning someone does not falsely record their acceptance. Scope is parent town and assignment; assignment read/write gaps identified in Phase 0 must be solved narrowly for authorised participants. Prevent participant changes to mission, town, assignee, reviewer, accepted timestamp, or completed status. Authorised steward can cancel/reassign through audited operations, preserving original history. No broad update grants or RLS relaxation.

Audit every transition with actor, subject, town, participation/work IDs, old/new state, timestamp, operation id and reason where applicable. Insert audit and state update in one transaction. Log operational event metadata, not contact details or photo payloads.

## Gap 2 — Real private photo/file proof
Existing private proofs bucket is reusable. Phase 0: 25 MiB limit, JPEG/PNG/WebP/HEIC/PDF; owner-only object policies do not provide reviewer access. Do not turn the bucket public.

Proposed object path: `town_uuid/work_uuid/participant_uuid/upload_uuid.ext`. Server validates UUID relationships and owns extension/MIME mapping; original filenames are metadata only. Path strings alone do not grant authority. Policy checks bucket, authenticated uploader, parent work access, editability and upload reservation. Reviewer SELECT requires current review authority over the parent town/work. No wildcard broad authenticated SELECT.

Reserve upload: create an upload-intent row with work, uploader, expected size/type, expiry and unique id under guarded parent access. Upload with upsert=false; immutable object identifiers avoid overwrite races. Finalize verifies stored object, byte size, permitted decoded content type, uploader and parent, then transactionally creates media_assets and proofs association. A pending upload is not a proof. Retry finalize is idempotent. Do not allow the browser to set review status or reviewer fields. Do not trust MIME or filename alone; scan/reject unsupported or malicious documents before review access.

Proposed UI limit: images compressed toward 1600px long edge and ~1.5 MiB with orientation retained and EXIF GPS stripped by default; hard cap remains 25 MiB until separately reviewed. Keep explicit optional location consent; never infer verified GPS from coordinates. HEIC conversion may fail: explain and offer another image rather than silently uploading no file. PDFs retain original bytes and go through validation; no attempted image compression. No migration applied to bucket limits in Build 01.

Private viewing: authenticated downloads or short-lived signed URLs (proposed 60 seconds), minted only after current parent/reviewer authorization. Never getPublicUrl. URLs stay out of logs, notifications and public page metadata. Revoked access cannot revoke a URL already issued until expiry; choose short expiry accordingly. Review interface must recheck permission before each signing operation.

Mobile: camera capture or file selection, local preview, explicit Upload, byte progress, cancel and retry. Show selected / uploading / received / attached separately. Interrupted uploads retain no false submitted state. Defer durable offline file queue until encrypted/account-isolated storage and logout purge are proven; initial version requires connectivity and allows reselect/retry. Standard upload for compressed files; evaluate resumable upload for larger files in staging.

Deletion: uploader may discard unattached draft uploads; linked or submitted evidence requires a retention/tombstone policy. Never delete approved proof to undo a review. Expired orphan uploads are garbage-collected by a scoped job after checking there is no association. Retention period is a governance decision before production, not an invented implementation default.

## Gap 3 — Independent proof verification
Doer identity is creator plus participants/assignees, not only one coordinator column. Any required independent reviewer must be outside that set. Uploader, work creator and assignees cannot approve their own evidence even when holding national/admin roles. No emergency bypass in the initial contract; handle genuine conflicts through another authorised reviewer.

Review queue filters submitted/in-review work, required proof and reviewer town authority. Reviewer decision operation validates current identity, role and scope, parent state, proof parent and version; uses a row lock or compare-and-set to prevent two conflicting decisions. Only this guarded operation can change proof review fields. Contributor writes may update permitted notes/draft content, not status, reviewed_by, reviewed_at or ownership. Protect the direct REST update route too; UI checks are not security.

Decision: approve or return with a meaningful reason. Store reviewer id, server timestamp, previous/new state, evidence version, reason, idempotency key and audit event atomically. Approve means proof verified against the requirement, not work published. Existing approved→published rewrite and publish_outbox side effects must remain outside proof approval. Separate publication consent and operation, with staging delivery disabled.

Returned evidence is revised as a new evidence version; previous decision remains append-only. Resubmission places the new version back in pending review. Revocation includes reason and invalidates downstream requirement satisfaction; it never erases historical decisions.

Required tests: self-review via UI/RPC/direct UPDATE, cross-town ID substitution, forged reviewer/timestamp, revoked reviewer, conflicting reviews, invalid parent, duplicate request, returned revision, successful unrelated authorised reviewer. No production account impersonation or mutation to test these.

## Gap 4 — Explainable capability progression
Proposed minimal entities: capability definitions; versioned requirement sets; requirement records; evidence-to-requirement links; capability awards and revocation events. Reuse proofs and proof-review history; do not copy evidence content into a points table.

Requirement fields: capability, level, version, description, evidence type, minimum distinct examples and reviewer rule. Define whether one proof may satisfy multiple requirements explicitly; default distinct evidence per example. Requirement changes do not silently reinterpret an earlier award.

Example, explicitly illustrative: Photography L1 requires verified consent-aware portrait evidence A, verified local-place image evidence B, and verified caption/context evidence C, each assessed against an agreed rubric. This example is not an existing live curriculum or credential.

Progress = verified, current, non-revoked requirement satisfactions / required satisfactions. Every count expands into the requirements, linked proof/version and decision. Missing rules produce “requirements not defined”, not 0% failure. Submission, publication and raw activity never award capability. No opaque AI score or earnings promise.

Award operation verifies the complete versioned requirement set transactionally and issues one unique award per participant/capability/level/version. Independent reviewer conflict rules apply. Revocation/correction updates effective status via append-only events and retains the original award. Opportunity eligibility can use the effective capability claim only after opportunity rules are validated.

## Operator readiness — “Who needs what next?”
| Question | Evidence source / limitation |
|---|---|
| Entered | Auth/app identity creation; define programme entry separately from login. |
| Activated | First durable acceptance; missing until Gap 1. |
| Acted | started_at + actual work event, not page view. |
| Proved | Attached proof then submission, reported separately from verification. |
| Progressed | Requirement satisfaction and capability award event. |
| Stopped | Last meaningful event plus agreed inactivity interval, never infer from no accessible rows. |
| Needs help | Returned evidence reason, explicit help request, incomplete assignment; no automatic diagnosis. |
| Capability missing | Agreed local mission demand versus verified available capability with permission-aware aggregates. |
| Next | Rule-driven human-reviewable suggestion, source event and reason shown. |

No Head of People dashboard or new universal role model is built. Builder is the participant vocabulary; existing operational roles stay intact.

## Documentation consulted
Supabase getUser: https://supabase.com/docs/reference/javascript/auth-getuser
Storage policy model: https://supabase.com/docs/guides/storage/security/access-control
Changelog fetch was attempted; markdown endpoint was unavailable to the web fetcher and terminal request timed out. No new Supabase API or dependency upgrade was introduced.
