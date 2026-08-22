# Skitii Trial — Database Design  
**Version:** 1.0  
**Date:** July 2026  
**Author:** Swapnil Sagvekar  
**Customer:** Yenepoya Hospital  
**Scope:** Existing Skitii Product DB changes + New Trial DB (MongoDB)

---

## 1. Overview

Trial data is **not stored in the product DB**. The system uses three databases:

| Database | Ownership | Purpose |
|----------|-----------|---------|
| **Existing Auth / Product DB** | Skitii Backend (shared) | Auth, institutions, music assets, device allowlist |
| **New Trial DB** | Trial Backend (new) | Patients, sessions, weekly forms, trial config, compliance |
| **Device Keychain** | Tablet only | Device PIN (never stored on server) |

```
┌─────────────────────┐     JWT      ┌─────────────────────┐
│ Existing Auth DB    │◄────────────►│ Trial Backend       │
│ (institutions,      │              │                     │
│  users, music)      │   reads      │                     │
└─────────────────────┘              │                     │
                                     │         writes      │
┌─────────────────────┐              │                     │
│ Existing Product DB │◄── music ────┤                     │
│ (music_assets only  │   flag       │                     │
│  change needed)     │              ▼                     │
└─────────────────────┘     ┌─────────────────────┐        │
                            │ New Trial DB        │◄───────┘
                            │ (all trial domain)  │
                            └─────────────────────┘
```

**Scoping rule:** Every Trial DB record is scoped by both `institutionId` and `trialId`.

---

## 2. Changes to Existing Skitii Product / Auth DB

These are the **only** changes required in the existing backend databases.

### 2.1 `institutions` — already supports trial product type

| Field | Change | Notes |
|-------|--------|-------|
| `productType` | **Update enum value** | Use `SKITII_TRIAL`. Yenepoya must be created/updated with `productType: "SKITII_TRIAL"`. |

### 2.2 `music_assets` — NEW field

| Field | Type | Default | Required | Description |
|-------|------|---------|----------|-------------|
| `controlPatientMusic` | Boolean | `false` | Yes | When `true`, track is part of the control-patient music pool |

**Index to add:**
```
{ controlPatientMusic: 1, isActive: 1 }
```

**Used by:** `GET /music/control` (Trial Backend / product music API) — returns only assets where `controlPatientMusic: true` and `isActive: true`.

**Admin UI:** Skitii Admin Frontend adds a toggle/flag on music asset management.

### 2.3 No other product DB changes

| Area | Decision |
|------|----------|
| Device allowlist (`physical_devices`) | Reuse existing product logic — **no Trial DB copy** |
| Auth / OTP / JWT | Reuse existing Auth Backend — **no Trial DB copy** |
| Product `patients` / `sessions` | **Not used** for trial — trial has its own collections |

---

## 3. New Trial DB — Collection Summary

| # | Collection | Purpose |
|---|------------|---------|
| 1 | `trials` | Trial definition (duration, shifts, schema, reminders) |
| 2 | `trialConfigurations` | Per-institute assignment of a trial + active config snapshot |
| 3 | `patients` | Trial patient enrollment |
| 4 | `sessions` | Therapy session records (start → stop/complete) |
| 5 | `preTherapy` | Pre-therapy form per session (**separate** collection, 1:1 with session) |
| 6 | `postTherapy` | Post-therapy form per session (**separate** collection, 1:1 with session) |
| 7 | `sessionReadings` | Per-phase HR readings uploaded during live session |
| 8 | `weeklyForms` | Weekly assessment for even weeks (dynamic steps + optional 5-min HRV) |
| 9 | `weeklyFormPins` | Hashed weekly form PIN + lockout state |
| 10 | `missedSessionLogs` | Daily missed-session snapshot for email reports |

> **`trialStatistics`:** Not a v1 collection. KPIs are **compute-on-read** from `sessions` / `weeklyForms` / `patients`. Add a cache collection later only if queries are slow.

---

## 4. Collection Schemas

### 4.1 `trials`

Master trial definition. Supports future multi-hospital / multi-trial.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | |
| `trialId` | String | Yes | Unique key, e.g. `skitii-trial-v1` |
| `name` | String | Yes | Display name |
| `status` | String enum | Yes | `draft` \| `active` \| `completed` \| `archived` |
| `trialDurationWeeks` | Number | Yes | Same for all patients. Yenepoya = `4`. Sets `completionDate` / session stop only — **does not** limit form-week count |
| `shiftsPerDay` | Number | Yes | Yenepoya = `3` |
| `shiftWindows` | Array | Yes | See structure below |
| `patientSchema` | Array | Yes | Dynamic intake field definitions |
| `weeklyFormDefinitions` | Array | Yes | Per even-week step config — **any length**; independent of `trialDurationWeeks` |
| `weeklyFormIntervalDays` | Number | Yes | Yenepoya = `14` (even week numbers) |
| `groupTypes` | String[] | Yes | e.g. `["adaptive","control"]` |
| `formReminderDaysBeforeExpiry` | Number | Yes | Yenepoya = `1` — reminder on `windowEnd − 1` day; skip if Done; no Week 0 reminder |
| `clinicalDayStartHour` | Number | Yes | Yenepoya = `4` (4:00 AM) |
| `createdAt` / `updatedAt` | Date | Yes | |

**`shiftWindows` item:**
```json
{
  "shift": 1,
  "label": "Morning",
  "startTime": "04:00",
  "endTime": "12:00",
  "crossesMidnight": false
}
```

**`weeklyFormDefinitions` item (dynamic steps per even week):**

> **Even weeks only.** Array length is **independent** of `trialDurationWeeks` (e.g. duration `4` with **3** or **7** form entries both valid).  
> Yenepoya **seed example:** Week **0, 2, 4** (not a hard limit).  
> **Form windows (Week 2+):** `windowStart` = enrollment + (`week` × 7); `windowEnd` = start + 6 (7-day inclusive).  
> **Week 0:** may submit from patient create **through** enrollment date (on enrollment day: before Shift 1 30-min rule if not done earlier).  
> **Sessions:** require Week 0 submitted **and** clinical date ≥ `enrollmentDate` through `completionDate` inclusive.  
> **Step keys:** `vitals` · `gad7_phq9` · `nccn_distress` · `hads` · `qlq_c30` · `qlq_hn35` · `treatment_adherence` · `satisfaction_survey` · `hrv`  
> **HRV** = 5 minutes. **`satisfaction_survey`** = intervention only. **`treatment_adherence`** = Week **4** in seed.  
> **After completion:** sessions blocked from the day after `completionDate`; **any** configured weekly form still submittable while its window is open (`completionDate` = enrollment + `trialDurationWeeks` × 7 − 1 days; Yenepoya +27).

```json
[
  { "week": 0, "label": "Week 0", "steps": ["vitals", "gad7_phq9", "hrv"] },
  { "week": 2, "label": "Week 2", "steps": ["vitals", "gad7_phq9", "nccn_distress", "hads", "qlq_c30", "qlq_hn35", "hrv"] },
  { "week": 4, "label": "Week 4", "steps": ["vitals", "gad7_phq9", "nccn_distress", "hads", "qlq_c30", "qlq_hn35", "treatment_adherence", "satisfaction_survey", "hrv"] }
]
```

**`patientSchema` item (Yenepoya v1 — options from enrollment UI):**

> Core enrollment fields (`firstName`, `lastName`, `age`, `gender`, `enrollmentDate`, `groupType`, optional `registrationNo`) are fixed on `patients`, not in `patientSchema`. UI may label `registrationNo` as **Patient ID**. Duration comes from trial `trialDurationWeeks` (Yenepoya **4**) — not collected per patient. `groupTypes` on trial: `["adaptive","control"]` → UI Adaptive / Control.

```json
[
  { "key": "diagnosisStage", "label": "Diagnosis Stage",         "type": "dropdown", "required": true,  "options": ["Stage 1", "Stage 2", "Stage 3", "Stage 4"] },
  { "key": "treatmentType",  "label": "Treatment Type",          "type": "dropdown", "required": true,  "options": ["Radiotherapy", "Chemotherapy", "Both"] },
  { "key": "cancerSite",     "label": "Cancer Site",             "type": "text",     "required": true },
  { "key": "ecogScore",      "label": "ECOG Performance Status", "type": "dropdown", "required": true,  "options": ["0", "1", "2", "3", "4"] },
  { "key": "surgicalType",   "label": "Surgical Type",           "type": "dropdown", "required": true,  "options": ["Pre-Operative", "Post-Operative"] },
  { "key": "languagePref",   "label": "Language Preference",     "type": "dropdown", "required": true,  "options": ["Kannada", "English", "Hindi", "Malayalam"] },
  { "key": "emergencyNumber","label": "Emergency Number",        "type": "phone",    "required": true }
]
```

**Indexes:**
- Unique: `{ trialId: 1 }`

---

### 4.2 `trialConfigurations`

Links an institution (from Auth DB) to an active trial.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | |
| `institutionId` | ObjectId | Yes | From Auth DB `institutions._id` |
| `trialId` | String | Yes | Ref to `trials.trialId` |
| `isActive` | Boolean | Yes | Default `true` |
| `adminEmail` | String | Yes | Skitii internal email for missed-session reports |
| `instituteEmail` | String | Yes | Institute login email for reminders + missed reports |
| `createdAt` / `updatedAt` | Date | Yes | |

**Indexes:**
- Unique: `{ institutionId: 1, trialId: 1 }`
- `{ institutionId: 1, isActive: 1 }`

---

### 4.3 `patients`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | |
| `institutionId` | ObjectId | Yes | |
| `trialId` | String | Yes | |
| `registrationNo` | String | No | Optional patient registration number — same field name and rules as Skitii product (`registrationNo`, not required) |
| `firstName` | String | Yes | |
| `lastName` | String | Yes | |
| `age` | Number | Yes | |
| `gender` | String enum | Yes | `male` \| `female` \| `other` |
| `emergencyNumber` | String | Yes | +91 |
| `languagePreference` | String | Yes | |
| `enrollmentDate` | Date | Yes | Day 1 of trial |
| `completionDate` | Date | Yes | Computed: `enrollmentDate + (trial.trialDurationWeeks × 7 − 1)` days (Yenepoya = +27). Sessions through this day inclusive; not tied to form-week count |
| `groupType` | String enum | Yes | `adaptive` \| `control` |
| `clinicalData` | Object | Yes | Dynamic fields from `patientSchema` (e.g. diagnosisStage, cancerSite, ecogScore…) |
| `week0Submitted` | Boolean | Yes | Default `false`. Lock for edits when `true` |
| `isEditable` | Boolean | Yes | `true` until Week 0 submitted; then view-only (incl. enrollment date) |
| `status` | String enum | Yes | `active` \| `completed` \| `withdrawn` |
| `createdAt` / `updatedAt` | Date | Yes | |

**Indexes:**
- Unique sparse: `{ institutionId: 1, trialId: 1, registrationNo: 1 }` — only when `registrationNo` is set (same pattern as product)
- `{ institutionId: 1, trialId: 1, enrollmentDate: -1 }`
- `{ institutionId: 1, trialId: 1, completionDate: 1 }`
- `{ institutionId: 1, trialId: 1, groupType: 1 }`

---

### 4.4 `sessions`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | |
| `institutionId` | ObjectId | Yes | |
| `trialId` | String | Yes | |
| `patientId` | ObjectId | Yes | Ref `patients` |
| `sessionDate` | Date / String (YYYY-MM-DD) | Yes | Clinical day attribution (Shift 3 overnight → previous calendar day) |
| `shift` | Number | Yes | `1` \| `2` \| `3` |
| `deviceId` | String | Yes | Tablet device identifier |
| `status` | String enum | Yes | Same as product: `ACTIVE` \| `INCOMPLETE` \| `COMPLETED` \| `AUTO_TERMINATED` |
| `terminationReason` | String enum | No | Same as product: `USER_ENDED` \| `SESSION_MAX_REACHED` \| `TIMEOUT` \| `AUTO_TERMINATED_ON_NEW_SESSION` |
| `startedAt` | Date | Yes | |
| `endedAt` | Date | No | |
| `expiresAt` | Date | Yes | startedAt + ~20 min (client auto-end → `COMPLETED` / `SESSION_MAX_REACHED`) |
| `baseline` | Object | No | `{ startedAt, endedAt, durationSec, meanHr, sdHr, readings[] }`. Default duration **30s** (frontend-configurable, same as product). |
| `preTherapyId` | ObjectId | No | Ref `preTherapy` |
| `postTherapyId` | ObjectId | No | Ref `postTherapy` |
| `postFormStatus` | String enum | Yes | `not_submitted` \| `submitted` |
| `createdAt` / `updatedAt` | Date | Yes | |

**Indexes:**
- `{ patientId: 1, sessionDate: 1, shift: 1 }`
- Partial unique for active conflict: `{ patientId: 1, sessionDate: 1, shift: 1 }` where `status: "ACTIVE"`
- `{ institutionId: 1, trialId: 1, sessionDate: 1 }`
- `{ status: 1, expiresAt: 1 }` — for 30-min safety job (`AUTO_TERMINATED` / `TIMEOUT`)

**Status / termination mapping (same as Skitii product):**

| Action | `status` | `terminationReason` |
|--------|----------|---------------------|
| Session in progress | `ACTIVE` | — |
| Stop button | `INCOMPLETE` | `USER_ENDED` |
| Auto-end (~20 min) | `COMPLETED` | `SESSION_MAX_REACHED` |
| Backend timeout | `AUTO_TERMINATED` | `TIMEOUT` |
| New session on device | `AUTO_TERMINATED` | `AUTO_TERMINATED_ON_NEW_SESSION` |

---

### 4.5 `preTherapy`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | |
| `institutionId` | ObjectId | Yes | |
| `trialId` | String | Yes | |
| `patientId` | ObjectId | Yes | |
| `sessionId` | ObjectId | Yes | Unique per session |
| `bpSystolic` | Number | Yes | |
| `bpDiastolic` | Number | Yes | |
| `baselineHeartRate` | Number | No | Auto from BLE, read-only |
| `painLevel` | Number | Yes | 0–10 |
| `energyLevel` | String enum | Yes | `good` \| `fair` \| `poor` |
| `comorbiditiesAlert` | String | No | |
| `medicationChanges` | String | No | |
| `headphoneType` | String enum | Yes | `over_ear` \| `in_ear` |
| `posture` | String enum | Yes | `seated` \| `supine` |
| `quietRoomVerified` | Boolean | Yes | |
| `environmentObservations` | String | No | |
| `submittedAt` | Date | Yes | |
| `createdAt` / `updatedAt` | Date | Yes | |

**Indexes:**
- Unique: `{ sessionId: 1 }`
- `{ patientId: 1, submittedAt: -1 }`

---

### 4.6 `postTherapy`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | |
| `institutionId` | ObjectId | Yes | |
| `trialId` | String | Yes | |
| `patientId` | ObjectId | Yes | |
| `sessionId` | ObjectId | Yes | Unique per session |
| `bpSystolic` | Number | Yes | |
| `bpDiastolic` | Number | Yes | |
| `baselineHeartRate` | Number | No | From pre/baseline, read-only |
| `painLevel` | Number | Yes | 0–10 |
| `energyLevel` | String enum | Yes | `good` \| `fair` \| `poor` |
| `adverseEvents` | Boolean | Yes | |
| `adverseEventsNotes` | String | No | Required if adverseEvents = true |
| `technicalIssues` | Boolean | Yes | |
| `technicalIssuesNotes` | String | No | Required if technicalIssues = true |
| `rmssdChange` | Number | Yes | Auto from session |
| `averageRmssd` | Number | Yes | Auto from session |
| `sessionNotes` | String | No | |
| `submittedAt` | Date | Yes | |
| `createdAt` / `updatedAt` | Date | Yes | |

**Indexes:**
- Unique: `{ sessionId: 1 }`
- `{ patientId: 1, submittedAt: -1 }`

---

### 4.7 `sessionReadings`

Per-phase HR / RR uploads during live therapy (product-aligned measure phases).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | |
| `institutionId` | ObjectId | Yes | |
| `trialId` | String | Yes | |
| `sessionId` | ObjectId | Yes | |
| `patientId` | ObjectId | Yes | |
| `phase` | Number | Yes | Measure phase (≥ 1). Unique with `sessionId` |
| `shift` | Number | Yes | |
| `trackIds` | String[] | No | Track ids used in this phase |
| `baseline` | Object | No | Usually on phase 1 |
| `measure` | Object | No | Full measure phase payload |
| `readings` | Mixed | Yes | Beat array (same as `measure.readings` when set) |
| `summary` | Object | No | Phase aggregates |
| `uploadedAt` | Date | Yes | |
| `createdAt` / `updatedAt` | Date | Yes | |

**Indexes:**
- Unique: `{ sessionId: 1, phase: 1 }`
- `{ patientId: 1, sessionId: 1 }`

---

### 4.8 `weeklyForms`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | |
| `institutionId` | ObjectId | Yes | |
| `trialId` | String | Yes | |
| `patientId` | ObjectId | Yes | |
| `studyWeek` | Number | Yes | Even weeks only (Yenepoya: `0`, `2`, `4`) |
| `stepsConfigured` | String[] | Yes | Snapshot of steps for this week from `weeklyFormDefinitions` |
| `status` | String enum | Yes | `steps_submitted` \| `fully_completed` |
| `windowStart` | Date | Yes | Week 0: from patient create (early submit OK). Week 2+: `enrollmentDate + (studyWeek × 7)` |
| `windowEnd` | Date | Yes | Week 0: enrollment date (on that day, before Shift 1 30-min rule if not submitted earlier). Week 2+: `windowStart + 6` |
| **Dynamic step payloads** (if configured) | | | Present only if step included in `stepsConfigured` |
| `vitals.*` | Mixed | Conditional | Weekly Clinical Review: BP/SpO₂/ECOG, `pastHistory`, `currentMedications[]`, `investigations` (optional `photoUrl` from Product docs upload) — no SpO₂/BP min–max validation; nested shape client-defined |
| `gad7_phq9.*` | Mixed | Conditional | |
| `nccn_distress.*` | Mixed | Conditional | |
| `hads.*` | Mixed | Conditional | |
| `qlq_c30.*` | Mixed | Conditional | |
| `qlq_hn35.*` | Mixed | Conditional | |
| `treatment_adherence.*` | Mixed | Conditional | Yenepoya: Week 4 |
| `satisfaction_survey.*` | Mixed | Conditional | Intervention group only |
| `stepsSubmittedAt` | Date | No | After non-HRV steps submitted |
| **HRV** (if configured) | | | 5-minute resting HRV — same shape as session `baseline`, plus HRV metrics |
| `hrv.startedAt` | Date | No | |
| `hrv.endedAt` | Date | No | |
| `hrv.durationSec` | Number | No | Expected `300` (5 minutes) |
| `hrv.meanHr` | Number | No | Average HR (bpm) — same role as baseline `meanHr` |
| `hrv.sdHr` | Number | No | SD of HR — same role as baseline `sdHr` |
| `hrv.rmssd` | Number | No | ms |
| `hrv.sdnn` | Number | No | ms |
| `hrv.pnn50` | Number | No | % |
| `hrv.readings` | Array | No | `[{ hr, timestamp }]` — live samples; no separate `heartRate` field |
| `hrv.submittedAt` | Date | No | |
| `createdAt` / `updatedAt` | Date | Yes | |

**Indexes:**
- Unique: `{ patientId: 1, studyWeek: 1 }`
- `{ institutionId: 1, trialId: 1, studyWeek: 1 }`
- `{ patientId: 1, status: 1 }`

**Rules stored as data flags (enforced in API):**
- Only even `studyWeek` values allowed
- Week 0 may be submitted before or on `enrollmentDate` (on enrollment day: before Shift 1 30-min rule if still pending)
- Sessions require Week 0 submitted **and** clinical date ≥ `enrollmentDate` (no sessions before enrollment); allowed through `completionDate` inclusive. Start errors: `WEEK0_REQUIRED`, `BEFORE_ENROLLMENT`, `TRIAL_COMPLETED`
- Later even-week forms (2, 4, 6…) do **not** block sessions
- After Week 0 submit: patient `isEditable` = false (including enrollment date / group type)
- Step payload must match `stepsConfigured` / trial `weeklyFormDefinitions`
- `satisfaction_survey` rejected for control-group patients
- From the day after `completionDate`: sessions blocked; weekly form submit still allowed if week is in `weeklyFormDefinitions` and window is open (form count may exceed duration weeks)
- Reminder email: only on `windowEnd − formReminderDaysBeforeExpiry` (default 1); skip if already `fully_completed`; never for Week 0
- Form is immutable after fully completed (no update API from mobile)
- Partial: non-HRV may leave status `steps_submitted` until HRV posted when configured

---

### 4.9 `weeklyFormPins`

One **active** PIN per institute at a time (rotated every **14 days** for security).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | |
| `institutionId` | ObjectId | Yes | |
| `trialId` | String | Yes | |
| `pinHash` | String | Yes | Hashed 6-digit PIN (never plaintext) |
| `generatedAt` | Date | Yes | Set by 14-day rotation cron |
| `isActive` | Boolean | Yes | Only one active per institute |
| `failedAttempts` | Number | Yes | Default `0` |
| `lockedUntil` | Date | No | Set after 10 failures; clear after 30 min |
| `activeTokens` | Array | No | `[{ tokenHash, deviceId?, expiresAt }]` — 1-hour short-lived tokens |
| `createdAt` / `updatedAt` | Date | Yes | |

**Indexes:**
- Unique partial: `{ institutionId: 1, trialId: 1 }` where `isActive: true`
- `{ lockedUntil: 1 }`

**Env-configurable:**
- Max attempts (default `10`)
- Lockout duration minutes (default `30`)
- Token TTL minutes (default `60`)

---

### 4.10 `missedSessionLogs`

Written by the 4:00 AM daily cron for email reporting.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | |
| `institutionId` | ObjectId | Yes | |
| `trialId` | String | Yes | |
| `clinicalDate` | Date / String (YYYY-MM-DD) | Yes | The day that just closed |
| `totalMissed` | Number | Yes | |
| `items` | Array | Yes | `[{ patientId, patientName, registrationNo, missedShifts: [1,2,3] }]` |
| `emailSentAt` | Date | No | |
| `emailRecipients` | String[] | No | Admin + institute emails |
| `createdAt` / `updatedAt` | Date | Yes | |

**Indexes:**
- Unique: `{ institutionId: 1, trialId: 1, clinicalDate: 1 }`

> If `totalMissed === 0`, either skip creating the log or create it without sending email (prefer: **no email** when zero).

---

### 4.11 Statistics (compute-on-read — no collection in v1)

KPIs (`institutionStatistics` / admin statistics) are aggregated at request time from `patients` and `sessions` with a **mandatory** date-range filter (`today` | `last3` | `last7` | `last14` | `custom`).

| Field | Source | Date filter |
|-------|--------|-------------|
| `totalSessions` | Expected patient × shift slots (Week 0 submitted, enrollment–completion inclusive) | Clinical dates in range |
| `totalCompletedSessions` | Sessions with `postFormStatus: submitted` | Same |
| `totalMissedSessions` | Closed shift window + no Post Therapy | Same |
| `registeredPatients` | `patients` count | `createdAt` within clinical range (`clinicalDayStartHour` aligned) |

Each of the three session metrics returns `{ total, byShift: { shift1, shift2, shift3 } }`.

Do **not** create a `trialStatistics` collection for Yenepoya v1. Introduce a cache collection later only if list/KPI latency requires it.

---

## 5. Relationship Diagram

```
trials
  └── trialConfigurations (institutionId + trialId)
        │
        ├── patients
        │     ├── sessions
        │     │     ├── preTherapy      (1:1, separate collection)
        │     │     ├── postTherapy     (1:1, separate collection)
        │     │     └── sessionReadings (1:N)
        │     └── weeklyForms           (1:N by studyWeek)
        │
        ├── weeklyFormPins              (1 active per institute)
        └── missedSessionLogs           (1 per clinical day)
```

Auth DB `institutions._id` is referenced as `institutionId` (ObjectId — same type as product; no foreign-key join across DBs).

Product DB `music_assets._id` is referenced as `trackId` in session readings.

> Statistics: compute-on-read (no `trialStatistics` collection in v1).

---

## 6. Data That Stays Outside Trial DB

| Data | Where it lives | Why |
|------|----------------|-----|
| Device PIN | Tablet Keychain / Keystore | Device-local only |
| Weekly Form PIN (plaintext) | Nowhere — only hash in Trial DB | Security |
| OTP / JWT | Auth Backend | Reuse existing auth |
| Physical device allowlist | Product `physical_devices` | Same as Skitii product |
| Music file binaries | Existing product storage | Only flag changes on `music_assets` |
| Control music pool | Product `music_assets` where `controlPatientMusic: true` | Queried by Trial Backend |

---

## 7. Migration / Seed Checklist

**Required for Yenepoya go-live (confirmed):**

### Existing DB
- [ ] Yenepoya institution with `productType: SKITII_TRIAL`
- [ ] Add `controlPatientMusic: Boolean` (default `false`) to `music_assets`
- [ ] Add index `{ controlPatientMusic: 1, isActive: 1 }`
- [ ] Flag initial control music tracks via Admin UI (`controlPatientMusic: true`)

### New Trial DB
- [ ] Create MongoDB database (e.g. `skitii_trial`)
- [ ] Create all collections listed in Section 3 (no `trialStatistics` in v1)
- [ ] Apply indexes from Section 4
- [ ] Seed `trials` for Yenepoya v1 (`skitii-trial-v1`, `trialDurationWeeks: 4`, seed `weeklyFormDefinitions` Week 0/2/4 — form list independent of duration)
- [ ] Seed `trialConfigurations` linking Yenepoya `institutionId` → `skitii-trial-v1`
- [ ] Generate **first weekly form PIN** (hashed) for the institute — then rotate every 14 days

---

## 8. Quick Reference — Indexes Only

| Collection | Indexes |
|------------|---------|
| `trials` | unique `trialId` |
| `trialConfigurations` | unique `(institutionId, trialId)`; `(institutionId, isActive)` |
| `patients` | unique sparse `(institutionId, trialId, registrationNo)`; enrollment / completion / groupType |
| `sessions` | `(patientId, sessionDate, shift)`; partial unique `ACTIVE`; `(status, expiresAt)` |
| `preTherapy` | unique `sessionId` |
| `postTherapy` | unique `sessionId` |
| `sessionReadings` | unique `(sessionId, phase)` |
| `weeklyForms` | unique `(patientId, studyWeek)` |
| `weeklyFormPins` | unique active `(institutionId, trialId)` |
| `missedSessionLogs` | unique `(institutionId, trialId, clinicalDate)` |
| Product `music_assets` | `(controlPatientMusic, isActive)` |
