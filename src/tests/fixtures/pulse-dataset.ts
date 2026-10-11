// src/tests/fixtures/pulse-dataset.ts — EVIDENCE FIXTURES for the Pulse engine tests.
// Deterministic rows shaped like canonical uto rows (ids are synthetic test ids).
// NOW is pinned so stale-work thresholds are deterministic.

import type { PulseDataset } from "../../lib/pulse/types";

export const NOW = new Date("2026-10-11T00:00:00Z").getTime();

export const towns = [
  { id: "t1", name: "Senekal", province: "Free State", is_founding: true },
  { id: "t2", name: "Ladybrand", province: "Free State", is_founding: true },
  { id: "t3", name: "Soweto", province: "Gauteng", is_founding: false },
];

export const initiatives = [
  { id: "i-food", name: "Food Garden", town_id: "t1" },
  { id: "i-digital", name: "Digital Skills", town_id: "t2" },
  { id: "i-national", name: "Ubuntu Passport", town_id: null },
];

export const fixtureDataset: PulseDataset = {
  signals: [
    { id: "sig-1", town_id: "t1", initiative: "i-food", created_by: "u-alice", created_at: "2026-10-01T00:00:00Z", status: "open" },
    { id: "sig-2", town_id: "t1", initiative: "i-food", created_by: "u-bob", created_at: "2026-10-02T00:00:00Z", status: "triaged" },
    { id: "sig-3", town_id: "t2", initiative: "i-digital", created_by: "u-cara", created_at: "2026-10-03T00:00:00Z", status: "open" },
    { id: "sig-4", town_id: "t3", initiative: null, created_by: null, created_at: "2026-10-04T00:00:00Z", status: "open" },
  ],
  works: [
    // Senekal / Food Garden: 2 published, 1 fresh open, 1 STALE open
    { id: "w-1", town_id: "t1", initiative: "i-food", created_by: "u-alice", created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-10T00:00:00Z", status: "published" },
    { id: "w-2", town_id: "t1", initiative: "i-food", created_by: "u-alice", created_at: "2026-09-05T00:00:00Z", updated_at: "2026-09-15T00:00:00Z", status: "published" },
    { id: "w-3", town_id: "t1", initiative: "i-food", created_by: "u-bob", created_at: "2026-10-09T00:00:00Z", updated_at: "2026-10-10T00:00:00Z", status: "submitted" },
    { id: "w-4", town_id: "t1", initiative: "i-food", created_by: "u-bob", created_at: "2026-08-01T00:00:00Z", updated_at: "2026-08-20T00:00:00Z", status: "draft" }, // STALE
    // Ladybrand / Digital Skills: 1 published (no proof -> capture gap), 1 fresh open
    { id: "w-5", town_id: "t2", initiative: "i-digital", created_by: "u-cara", created_at: "2026-09-20T00:00:00Z", updated_at: "2026-09-25T00:00:00Z", status: "published" },
    { id: "w-6", town_id: "t2", initiative: "i-digital", created_by: "u-cara", created_at: "2026-10-08T00:00:00Z", updated_at: "2026-10-09T00:00:00Z", status: "draft" },
    // Soweto: 1 stale open (provincial capacity gap signal)
    { id: "w-7", town_id: "t3", initiative: null, created_by: "u-dan", created_at: "2026-08-10T00:00:00Z", updated_at: "2026-08-25T00:00:00Z", status: "submitted" }, // STALE
  ],
  proofs: [
    { id: "p-1", town_id: "t1", initiative: "i-food", work_id: "w-1", created_at: "2026-09-11T00:00:00Z", state: "verified" },
    { id: "p-2", town_id: "t1", initiative: "i-food", work_id: "w-2", created_at: "2026-09-16T00:00:00Z", state: "captured" },
    // w-5 (published) deliberately has NO proof -> capture gap in Ladybrand
  ],
  learnings: [
    { id: "l-1", town_id: "t1", initiative: "i-food", source_proof_id: "p-1", created_at: "2026-09-12T00:00:00Z", text: "Raised beds survive frost better." },
    { id: "l-2", town_id: "t1", initiative: "i-food", source_proof_id: "p-2", created_at: "2026-09-17T00:00:00Z", text: "Weekly watering roster keeps members active." },
  ],
  opportunities: [
    { id: "o-1", town_id: "t1", initiative: "i-food", status: "open", created_at: "2026-09-20T00:00:00Z" },
    { id: "o-2", town_id: "t2", initiative: "i-digital", status: "matched", created_at: "2026-09-21T00:00:00Z" },
  ],
  memories: [
    { id: "m-1", town_id: "t1", initiative: "i-food", created_at: "2026-09-13T00:00:00Z", text: "Food Garden launched with 12 members." },
  ],
};
