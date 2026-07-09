// Trust tiers that gate which parcels (by declared value) a driver may carry.
// Stored as a materialized smallint on driver_profiles and recomputed whenever
// a driver's KYC, guarantor or partner-company link changes.
export enum TrustLevel {
  NONE = 0, // not yet KYC-approved
  KYC_SIMPLE = 1, // KYC approved — low-value parcels
  REFERENCED = 2, // vouched for by a verified individual guarantor
  ENTERPRISE = 3, // member of an active partner company — any value
}
