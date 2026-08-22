# Skitii Trials — Product Story & Technical Specification  
**Version:** 1.0  
**Date:** July 2026  
**Author:** Swapnil Sagvekar  
**Customer:** Yenepoya Hospital  
**Scope:** React Native Tablet App + Trial Backend + Trial Admin Panel + Existing Auth Backend  

---

## 1. Overview

Skitii Trials is a **clinical research version** of the Skitii product, built for running music-therapy trials at hospitals. The first customer is **Yenepoya Hospital**.

- The trial app is **almost identical to the Skitii product** in session flow (Pre Therapy → Baseline → Live Session → Post Therapy).
- The key difference is that the trial collects **extra patient clinical data** (cancer staging, ECOG, weekly psychological assessments) before and during the study.
- After the trial concludes, the data and learnings will feed back into the product.

**Future:** Other hospitals will run similar trials with **different patient intake forms**. The architecture must support per-hospital configurable patient schemas.

---

## 2. Designed for Future Trials — Dynamic Architecture

The Skitii Trial platform is built from the ground up to support **multiple hospitals, multiple trials, and different clinical protocols** without requiring a new codebase for each.

### 2.1 What changes between trials

| Element | Yenepoya v1 (current) | Future trials |
|---------|----------------------|---------------|
| Hospital / Institute | Yenepoya Hospital | Any hospital |
| Patient intake fields | Cancer staging, ECOG, diagnosis, chemo | Custom fields per trial |
| Trial duration | **4 weeks** (trial config; same for all patients) | Configurable per trial (`trialDurationWeeks`) |
| Weekly assessment forms | Dynamic per even week; steps differ per week | Configurable via `weeklyFormDefinitions` (**independent** of duration — any number of even-week entries) |
| Which even weeks exist | Seed example: **0, 2, 4** (may configure more, e.g. 7 form weeks) | Defined only in `weeklyFormDefinitions` |
| Form interval | **14 days** between form weeks | Configurable (`weeklyFormIntervalDays`) |
| Group types | Adaptive / Control | Configurable per trial |
| Number of shifts per day | 3 | Configurable |
| Shift time windows | Shift 1: 4AM–12PM, Shift 2: 12PM–8PM, Shift 3: 8PM–3:59AM | Configurable per trial |

### 2.2 How we make it dynamic

**1. `institutionId` + `trialId` scoping**

Every record in the Trial DB is scoped to both `institutionId` and `trialId`. This means multiple hospitals can run different trials simultaneously on the same backend, with data fully isolated.

```json
{
  "institutionId":   "ObjectId(...)",
  "trialId":         "skitii-trial-v1",
  "registrationNo":  "SKITII-2026-001"
}
```

**2. Versioned patient intake schema**

The patient intake form fields are not hardcoded. Each trial has a `patientSchema` document in the DB that defines which fields are collected, their types, labels, and validation rules. The Trial Admin Panel allows configuring this schema per trial without code changes.

```json
{
  "trialId": "skitii-trial-v1",
  "patientSchema": [
    { "key": "diagnosisStage", "label": "Diagnosis Stage",         "type": "dropdown", "required": true,  "options": ["Stage 1", "Stage 2", "Stage 3", "Stage 4"] },
    { "key": "treatmentType",  "label": "Treatment Type",          "type": "dropdown", "required": true,  "options": ["Radiotherapy", "Chemotherapy", "Both"] },
    { "key": "cancerSite",     "label": "Cancer Site",             "type": "text",     "required": true },
    { "key": "ecogScore",      "label": "ECOG Performance Status", "type": "dropdown", "required": true,  "options": ["0", "1", "2", "3", "4"] },
    { "key": "surgicalType",   "label": "Surgical Type",           "type": "dropdown", "required": true,  "options": ["Pre-Operative", "Post-Operative"] },
    { "key": "languagePref",   "label": "Language Preference",     "type": "dropdown", "required": true,  "options": ["Kannada", "English", "Hindi", "Malayalam"] },
    { "key": "emergencyNumber","label": "Emergency Number",        "type": "phone",    "required": true }
  ]
}
```

The React Native app and Admin Panel dynamically render the patient enrollment form from this schema — no app update needed when a new hospital has different fields.

**3. Dynamic weekly form definitions (same pattern as patient schema)**

Weekly assessment steps are **not hardcoded**. Each trial defines which **even weeks** exist and which steps each week includes.

> **`trialDurationWeeks` and `weeklyFormDefinitions` are independent.**  
> - Duration (Yenepoya = **4**) → `completionDate` = enrollment + **(4 × 7 − 1) = 27** days; sessions allowed **through that day inclusive**, blocked from the next day.  
> - Form list = whatever is in `weeklyFormDefinitions` (e.g. **3** or **7** even-week entries). Forms may still be submitted **after** `completionDate` if that week’s window is open.

| Config | Controls |
|--------|----------|
| `trialDurationWeeks` | When sessions stop (`completionDate`) |
| `weeklyFormDefinitions` | Which even-week forms exist and their steps (any length) |

Yenepoya **seed example** (default forms — not a hard limit):

```json
{
  "trialId": "skitii-trial-v1",
  "trialDurationWeeks": 4,
  "weeklyFormIntervalDays": 14,
  "weeklyFormDefinitions": [
    { "week": 0, "label": "Week 0", "steps": ["vitals", "gad7_phq9", "hrv"] },
    { "week": 2, "label": "Week 2", "steps": ["vitals", "gad7_phq9", "nccn_distress", "hads", "qlq_c30", "qlq_hn35", "hrv"] },
    { "week": 4, "label": "Week 4", "steps": ["vitals", "gad7_phq9", "nccn_distress", "hads", "qlq_c30", "qlq_hn35", "treatment_adherence", "satisfaction_survey", "hrv"] }
  ]
}
```

> Step keys and field-level detail: see **Weekly Clinical Review Forms** doc. `satisfaction_survey` is **intervention-group only**. `treatment_adherence` on Week **4** in the seed example. Progress = **Step X of N** for that week’s configured steps.

**4. Completion date vs sessions vs weekly forms (important)**

| After `completionDate` (next calendar day onward) | Allowed? |
|--------------------------------------------------|----------|
| Start / restart a therapy **session** | **No** — `TRIAL_COMPLETED` |
| Submit a **weekly form** in `weeklyFormDefinitions` whose form window is still open (including weeks past duration, e.g. Week 6 / 8 if configured) | **Yes** |

Example: duration **3** weeks → completion = enrollment + **20** days; duration **4** (Yenepoya) → + **27** days. If `weeklyFormDefinitions` has **7** form weeks, the patient can still fill those after completion while each window is open — sessions stay blocked.

**5. Configurable trial parameters**

Trial-level configuration (stored per `trialId`) controls all protocol parameters:

| Parameter | Description |
|-----------|-------------|
| `trialDurationWeeks` | Session-period length for **all patients** (Yenepoya = **4**). Does **not** limit how many form weeks may be configured |
| `shiftsPerDay` | Number of session shifts per day (currently 3 for Yenepoya) |
| `shiftWindows` | Start/end times for each shift — **differs per trial** |
| `weeklyFormDefinitions` | Even-week form list + steps per week — **any number** of entries (independent of `trialDurationWeeks`) |
| `weeklyFormIntervalDays` | Gap between form week numbers (Yenepoya = **14** — Week 0, 2, 4…) |
| `groupTypes` | List of patient groups (e.g. Adaptive, Control) |
| `formReminderDaysBeforeExpiry` | Days before `windowEnd` to send form reminder (Yenepoya = **1**). Skip if form already Done. No Week 0 reminder |

**6. Trial Admin Panel as the control plane**

The Trial Admin Panel is the central place where Skitii team configures each new trial. To onboard a new hospital:

1. Create an `Institution` record in Auth Backend.
2. Create a `Trial` record with all parameters, `patientSchema`, and `weeklyFormDefinitions`.
3. Assign the institution to the trial.
4. The mobile app and admin panel automatically work for that institution — no code deployment needed.

### 2.3 What stays the same across all trials

- Session flow: Pre Therapy → Baseline → Live Therapy → Post Therapy
- BLE integration with any compatible heart rate device
- HRV computation (RMSSD, SDNN, pNN50) on-device (weekly HRV = **5 minutes** when configured)
- Clinical day boundary concept (configurable start time, e.g. 4 AM – 3:59 AM)
- Weekly form model: Week 0 mandatory (submit before or on enrollment date; only Week 0 + enrollment date gate sessions); even weeks; **7-day** form windows on a 14-day week-number cadence; forms may continue after completion while sessions do not
- Auth mechanism (existing Auth Backend + JWT)
- Device PIN mechanism
---

## 3. Architecture

### 2.1 Systems involved

| System | Role |
|--------|------|
| **Existing Skitii Auth Backend** | Email OTP login, JWT tokens, Institution identity |
| **New Trial Backend** | All trial domain data (patients, sessions, weekly reports, compliance) |
| **New Trial DB (MongoDB)** | Separate from product DB |
| **New Trial Admin Panel** | Admin interface for managing trial data, patients, and reports |
| **Existing Skitii Admin Frontend** | Admin adds `controlPatientMusic` flag to music assets |
| **Trial React Native App** | Tablet-only (landscape), Yenepoya institute |
| **BLE Heart Rate Device** | Any compatible BLE HR monitor used during sessions and weekly HRV |

### 2.2 Auth flow

1. Trial app calls **Existing Auth Backend** → email OTP → JWT.
2. JWT is passed to **Trial Backend** for all domain API calls.
3. Trial Backend validates JWT and extracts `institutionId` to scope all data.
4. Yenepoya is registered as an Institution with `product: "skitii-trial"` in the Auth DB.

### 2.3 Multi-device

- One institute (Yenepoya) logs in on **multiple tablets**.
- PIN is **device-local** (stored in device Keychain/Keystore only).
- Each tablet creates its own PIN after OTP login.
- Trial Backend must support concurrent writes from multiple tablets under the same `institutionId`.
- Device restrictions follow the **same mechanism as the Skitii product** — no separate implementation for the Trial app.

---

## 4. Trial Structure

### 3.1 Trial duration

- Duration is set once on the **trial configuration** (`trialDurationWeeks`) — **same for every patient**. Not chosen at enrollment.
- Formula: `completionDate` = `enrollmentDate + (trialDurationWeeks × 7 − 1)` days.  
  - Yenepoya = **4** → **+ 27 days** (e.g. 17 Jul → **13 Aug**).  
  - Example: **3** weeks → **+ 20 days**.
- Sessions are allowed **through `completionDate` inclusive**; blocked from the **next calendar day** (`TRIAL_COMPLETED`).
- Enrollment spanning month boundaries uses normal date arithmetic — no special handling.
- After the session period ends:
  - **Sessions:** cannot start. Backend returns `TRIAL_COMPLETED`; Start button disabled.
  - **Weekly forms:** still allowed for **any** week in `weeklyFormDefinitions` whose form window is open (may be more form weeks than duration weeks).
- There is **no restriction on the number of sessions** within the trial period (through `completionDate`).

### 3.2 Weekly form calendar

- Forms exist only for **even study weeks** listed in `weeklyFormDefinitions` (any count — e.g. 3 or 7 entries).
- Week numbers advance by **14** (`weeklyFormIntervalDays: 14`).
- Each even-week form (Week 2+) has a fixed **7-day** window:
  - `windowStart` = `enrollmentDate + (studyWeek × 7)` days  
  - `windowEnd` = `windowStart + 6` days (inclusive)
- Steps per week are **dynamic**.
- **Independent of duration:** configuring Week 6 / 8 / … does not require raising `trialDurationWeeks`; those forms open later (often with **no sessions**) and remain submittable while their windows are open.

**Week 0 (special):**
- May be submitted **before or on** the enrollment date. On enrollment day, must be done **before Shift 1 is within the 30-minute expiry rule** (if not already submitted earlier).
- Once Week 0 is submitted → patient is **view-only** (including enrollment date and group type). Set the correct enrollment date **before** an early Week 0 submit.
- **Sessions** require: Week 0 submitted **and** clinical date ≥ `enrollmentDate` (no sessions before enrollment day) **and** through `completionDate` inclusive.
- If Week 0 is still missing when Shift 1 hits the 30-min rule on enrollment day → institute **manually edits** enrollment date to the next day. Backend does **not** auto-change it. Sessions stay blocked until Week 0 is submitted.
- After Week 0: sessions continue through `completionDate` even if later weekly forms are pending or missed.
- **No form-reminder email** for Week 0.

**Week 2 / 4 / 6…:**
- Open on `enrollmentDate + (week × 7)`; close 7 days later (inclusive).
- Form windows often begin **after** `completionDate` (e.g. Week 4+) — forms can be submitted; sessions cannot.
- Missed = window expired without `fully_completed`; next configured even week still opens on its schedule.

---

#### Example — Yenepoya 4-week trial

Patient enrolled **Friday 17 Jul 2026**, `completionDate` = **13 Aug 2026** (enrollment + 27 days).  
Illustrative form list Week **0, 2, 4, 6, 8** (seed may be 0/2/4 only — more weeks optional).

| Study week | Sessions | Weekly form window |
|------------|----------|-------------------|
| Week 0 | From create through enrollment day | **Before or on 17 Jul (Fri) 2026**; on that day before Shift 1 30-min rule if not done earlier |
| Week 2 | 24 Jul (Fri) – 30 Jul (Thu) 2026 | **31 Jul (Fri) – 6 Aug (Thu) 2026** |
| Week 4 | 7 Aug (Fri) – 13 Aug (Thu) 2026 | **14 Aug (Fri) – 20 Aug (Thu) 2026** |
| Week 6 | No Sessions | **28 Aug (Fri) – 3 Sep (Thu) 2026** |
| Week 8 | No Sessions | **11 Sep (Fri) – 17 Sep (Thu) 2026** |

> Sessions allowed through **13 Aug** inclusive; blocked from **14 Aug** (`TRIAL_COMPLETED`). Week 4 / 6 / 8 forms open after that — submit OK while each window is open. Reminder for Week 2 = **5 Aug** only (day before expiry), and only if not already Done.

**If enrolled Tuesday 21 Jul 2026 (4-week, `completionDate` = 17 Aug 2026):**
- Week 0: may submit **before or on 21 Jul (Tue)**; sessions only from **21 Jul** (Shift 1 30-min rule if submitting that day).
- Week 2 form: **4 Aug (Tue) – 10 Aug (Mon)** (reminder **9 Aug** if still pending).
- Week 4 form: **18 Aug (Tue) – 24 Aug (Mon)** (after sessions end).

---

**Backend → frontend (per patient):**

1. **Dashboard button label** — e.g. `Week 0`, `Week 2`, `Week 4`
2. **Steps to render** — from `weeklyFormDefinitions` for that week
3. **Form list** — `availableWeeks` = weeks from `weeklyFormDefinitions` (seed example `[0, 2, 4]`; not derived from `trialDurationWeeks`)

Example labels: Patient A → Week 0 · Patient B → Week 2 · Patient C → Week 4.

### 3.3 Cron jobs & Email notifications

Three independent cron jobs run on the Trial Backend:

**Cron 1 — Daily missed session report (runs at 4:00 AM every day)**

Runs immediately after Shift 3 window closes (3:59 AM). If any sessions were missed for that clinical day, an email is sent to **both Skitii admin and the institute's login email**.

Email content:
- Total missed session count for the day
- Detailed list per patient: patient name + which shift(s) were missed

> No email is sent if there are zero missed sessions for that day.

**Cron 2 — Weekly form reminder (day before window expiry)**

For each open even-week form window (Week 2+ only — **not Week 0**):

- Send reminder on **`windowEnd − formReminderDaysBeforeExpiry`** (Yenepoya = **1** → the calendar day before expiry).
- Example — Week 2 window **31 Jul – 6 Aug**: reminder on **5 Aug only**.
- **Skip** patients whose form for that week is already **Done** (`fully_completed`).
- Do **not** send on other days of the window (not daily; not Thu/Fri/Sat sets).

Email goes to the **institute's login email** and lists patients with a pending form for that week whose reminder day is today.

**Cron 3 — Weekly Form PIN rotation (every 14 days)**

Generates a new 6-digit PIN every **14 days** (same cadence as `weeklyFormIntervalDays`). Old PIN is deactivated; admin informs institute by SMS/call.

---

## 5. Session Shifts

### 4.1 Three daily shifts

Every patient must complete **3 sessions per day**, one per shift.

> **Shift time windows are configurable per trial** and set in the Trial Admin Panel. The windows below apply to **Yenepoya v1** only.

| Shift | Window (Yenepoya v1) | Day attribution |
|-------|----------------------|----------------|
| Shift 1 | 4:00 AM → 12:00 PM | Same calendar day |
| Shift 2 | 12:00 PM → 8:00 PM | Same calendar day |
| Shift 3 | 8:00 PM → 3:59 AM (next day) | The day Shift 3 **started** (e.g. session at 2AM on July 18 = Shift 3 of July 17) |

> A clinical "day" runs from the **shift 1 start time to shift 1 start time** of the next calendar day (for Yenepoya: 4:00 AM to 3:59 AM).

### 4.2 Shift ordering rules

1. Shifts must be completed in **strict order**: Shift 1 → Shift 2 → Shift 3.
2. **Exception:** If Shift 1 is missed (window closed), Shift 2 is still **allowed**.
3. A session that was **missed** in its shift **cannot be started in a later shift**.
4. Backend enforces all shift ordering and time-window validation.

### 4.3 Missed session

- A session is **missed** if:
  - Its shift window has closed, AND
  - No completed Post Therapy form was submitted for that shift.
- Missed sessions count toward **compliance statistics**.

### 4.4 Session status & termination (same as Skitii product)

Trial sessions use the **same status / terminationReason model** as the Skitii product:

| Action | `status` | `terminationReason` |
|--------|----------|---------------------|
| Session in progress | `ACTIVE` | — |
| Stop button | `INCOMPLETE` | `USER_ENDED` |
| Auto-end (~20 min timer) | `COMPLETED` | `SESSION_MAX_REACHED` |
| Backend timeout (30-min safety job) | `AUTO_TERMINATED` | `TIMEOUT` |
| New session started on same device | `AUTO_TERMINATED` | `AUTO_TERMINATED_ON_NEW_SESSION` |

- Sessions **auto-end after ~20 minutes** → `COMPLETED` / `SESSION_MAX_REACHED`.
- A background job runs every **30 minutes** as a safety net — if the session is still `ACTIVE` past expiry, it is set to `AUTO_TERMINATED` / `TIMEOUT`.

> **Why shift window expiry during a live session is not possible:** The 30-minute minimum check (at Start + safety-net after Pre Therapy form) ensures ≥ 30 min remain before Baseline begins. Since a session auto-ends in ≤ 20 min, the shift window mathematically cannot close during an active session.

---

## 6. Session Flow

Each session follows a linear 3-step flow with a stepper (Pre Therapy → Therapy Session → Post Therapy):

```
Dashboard (tap Action chip)
    ↓
POST /sessions/start — validates: duplicate session + 30-min minimum check [Point 1]
    ↓ (on success)
Pre Therapy Form
    ↓
POST /sessions/validate — re-validates: 30-min minimum check [Point 2 — safety net]
    ↓ (on success)
Baseline Measurement (live HR from BLE heart rate device)
    ↓
Live Therapy Session (BLE + music)
    ↓
Post Therapy Form
    ↓
Dashboard (Action chip → Done / Restart / Resume)
```

### 5.1 Pre Therapy Form

Collected before every session:

**Vital Signs**
- Blood Pressure Systolic* (mmHg)
- Blood Pressure Diastolic* (mmHg)
- Baseline Heart Rate (auto-filled from live Polar reading, read-only)

**Patient Assessment**
- Current Pain Level* (slider 0–10)
- Energy Level* (Good / Fair / Poor)
- Comorbidities Alert (optional text)
- Medication Changes since last session (optional text)

**Session Setup**
- Headphone Type* (Over-Ear / In-Ear)
- Posture* (Seated / Supine)
- Quiet Room Verified* (Yes / No)
- Session Environment Observations (optional text)

CTA: **Start Session** (disabled until required fields valid + Polar HR available)

### 5.2 Baseline Measurement

- Countdown timer — default **30 seconds**; **frontend-configurable** (same as Skitii product). Backend stores the recorded `durationSec`.
- Live HR + SD of HR from BLE heart rate device displayed.
- Heart rate waveform shown.
- "Please remain still and relaxed" instruction.
- Auto-advances to Live Session when timer completes.
- Stores: `startedAt`, `endedAt`, `durationSec`, `readings[{hr, timestamp}]`, `meanHr`, `sdHr`.

### 5.3 Live Therapy Session

**For Adaptive patients** — same as Skitii product:
- Music selected by HRV/HR-tier algorithm.
- Music ranking updated per shift based on RMSSD change.
- Shifts cycle with HRV rolling window.

**For Control patients** — different:
- Music pool = tracks flagged as `controlPatientMusic: true` in Skitii Admin.
- On session start: one random track from the pool plays continuously until session end.
- If patient changes music: another random track from the pool plays continuously until session end.
- Patient can change music anytime (unlimited changes).
- **Ranking is NOT updated** for control patients.
- Session readings store **multiple tracks per shift** (one entry per music change):
  `[{ trackId, startedAt, endedAt }, ...]` per shift.

**Live metrics displayed:**
- Device HR (bpm), HRV RMSSD, SD HR, AVG RR (150s), PNN50, SDNN, Artifact %
- Shift number, HRV tier, time remaining, session timer, REC indicator
- Patient name, LIVE badge, Polar battery

**STOP button:** Marks session as `INCOMPLETE` with `terminationReason: USER_ENDED`. Backend and frontend handle resume/restart logic (see Section 8).

### 5.4 Post Therapy Form

Collected after every session (or after Stop):

**Vital Signs**
- Blood Pressure Systolic* / Diastolic* (mmHg)
- Baseline Heart Rate (from pre-session/baseline, read-only display)

**Patient Assessment**
- Current Pain Level* (slider 0–10)
- Energy Level* (Good / Fair / Poor)

**Observations**
- Adverse Events* (toggle No/Yes + notes text if Yes)
- Technical Issues* (toggle No/Yes + notes text if Yes)

**Data Summary**
- RMSSD Change* (auto-filled from session, not manually editable)
- Average RMSSD* (auto-filled from session, not manually editable)
- Session Notes (optional text)

CTA: **Complete Session** (disabled until required fields valid)

---

## 7. Weekly Assessment Flow (Dynamic Steps)

Triggered from Dashboard **Weekly → [Week N]** (button label comes from backend).

Steps are **not fixed**. The backend returns which steps to show for the current even week (from trial `weeklyFormDefinitions`). Yenepoya catalogue (illustrative — field detail in Weekly Forms doc):

| Study week | Example steps |
|------------|---------------|
| Week 0 | Vitals → GAD-7 & PHQ-9 → 5-min HRV |
| Week 2 | Vitals → GAD-7 & PHQ-9 → NCCN → HADS → QLQ-C30 → QLQ-H&N35 → 5-min HRV |
| Week 4 | … + Treatment Adherence + Satisfaction Survey (intervention only) → HRV |

```
Dashboard (tap Weekly button — label from backend, e.g. "Week 2")
    ↓
PIN entry → verify-pin → short-lived token
    ↓
Render only the steps configured for that week (Step X of N)
    ↓
Non-HRV steps submitted together (when present)
    ↓
HRV step (if configured) — 5-Minute Resting HRV, submitted separately
    ↓
Dashboard Weekly chip → Done
```

### 6.1 Available step types (configured per week)

When a step is included in that week’s definition, fields apply as documented in **Weekly Clinical Review Forms**. Current Yenepoya step keys:

| Step key | Display name | Notes |
|----------|--------------|-------|
| `vitals` | Vital Signs | Weekly Clinical Review: BP, SpO₂, ECOG + past history + meds + investigations — **no** SpO₂/BP min–max ranges |
| `gad7_phq9` | GAD-7 & PHQ-9 | Combined step; totals on device + backend |
| `nccn_distress` | NCCN Distress Thermometer | Thermometer + problem checklist |
| `hads` | HADS-A & HADS-D | Validated option order |
| `qlq_c30` | QLQ-C30 | EORTC v3 items 1–30 |
| `qlq_hn35` | QLQ-H&N35 | Module items 1–35 |
| `treatment_adherence` | Treatment Adherence | Yenepoya: Week **4**; face-to-face |
| `satisfaction_survey` | Satisfaction Survey | Intervention group only (Week 4) |
| `hrv` | 5-Minute Resting HRV | Separate API submit when configured |

Non-HRV steps that are active for the week are submitted together in a single API call.

### 6.2 5-Minute Resting HRV (when configured for that week)

- Triggered after non-HRV steps are submitted (if any), or as a standalone step if it is the only remaining step.
- **5-minute** recording; patient must remain still with BLE heart rate device connected.
- Live UI same pattern as session **baseline** (HR + SD of HR + waveform).
- Payload shape = **baseline fields** + HRV metrics (no separate `heartRate` — use `readings` + `meanHr`):
  - Like baseline: `startedAt`, `endedAt`, `durationSec` (**300**), `meanHr`, `sdHr`, `readings[{ hr, timestamp }]`
  - Plus: `rmssd` (ms), `sdnn` (ms), `pnn50` (%)
- When the timer hits **5:00**, the frontend **automatically** posts to `POST /weekly-assessments/:id/hrv` (no manual Submit).
- On success → **Weekly Form Submitted Successfully!** screen → **Return to Dashboard**.
- Weekly assessment is `fully_completed` only after that HRV auto-post succeeds.
- Dashboard Weekly chip turns **Done** only when the week is fully completed.

### 6.3 Week 0 rules

- Week 0 may be submitted **before or on** the enrollment date. On enrollment day (if not already done), finish **before Shift 1 hits the 30-minute expiry rule**.
- If Week 0 is still missing when that enrollment-day deadline passes → institute **manually edits enrollment date** to the next day; sessions stay blocked until Week 0 is submitted.
- Week 0 steps come from `weeklyFormDefinitions` for week `0` (may be fewer steps than later weeks).
- Week 0 is the **lock point** for patient edits — after submit, all patient fields (including enrollment date and Group Type) are **view-only**. Correct enrollment date must be set **before** early Week 0 submit.
- Sessions cannot start before `enrollmentDate`, even if Week 0 was submitted early.

### 6.4 Weekly form ordering rules

- Forms only for **even weeks** listed in `weeklyFormDefinitions` (`0, 2, 4, 6, 8…` as configured — count is independent of `trialDurationWeeks`).
- Cannot submit Week N while the previous even week (N−2) is still **open and not submitted**.
- If the previous even week’s window has **expired (missed)**, the next even week in config is unblocked automatically.
- Institute cannot skip backwards (cannot submit Week 2 after Week 4 is already submitted).
- Once a weekly form is fully completed, it **cannot be edited** from the mobile app. View-only access is available from the Trial Admin Panel.

### 6.8 Weekly Form PIN (access control)

To prevent unauthorised weekly form submissions, a **6-digit numeric PIN** is required before the form can be opened.

**How it works:**

```
Institute staff taps "Weekly → Start" on Dashboard
    ↓
PIN entry screen shown
    ↓
POST /weekly-assessments/verify-pin  { pin, institutionId }
    ↓ (valid PIN)
Backend returns short-lived token (valid 1 hour)
    ↓
Weekly form Steps (configured for that week) → Submit non-HRV steps (token in request header)
    ↓
HRV step if configured (5-Minute Resting HRV) → Submit (token in request header)
```

**PIN lifecycle:**

| Detail | Value |
|--------|-------|
| Format | 6-digit numeric |
| Scope | One active PIN per institute at a time |
| Generated by | Cron job — every **14 days** (aligned with `weeklyFormIntervalDays`) |
| Stored in | Trial DB — hashed, one active PIN per institute at a time |
| Communicated to institute | Manually by Skitii admin via SMS / call |
| Token validity after verify | **1 hour** |
| Wrong PIN lockout | After **10 attempts** (configurable via env variable) |
| Lockout reset | **Automatically after 30 minutes** |
| PIN issue resolution | Institute contacts Skitii admin directly (phone/SMS) — no admin panel action needed |

**Verification logic:**
- Backend checks if the submitted PIN matches the **current active PIN** for that institute — no `weekNumber` validation in the API.
- PIN rotates every **14 days** purely for security so it cannot be reused indefinitely.

**Week 0 PIN:**
- Week 0 form also requires a valid PIN. The first PIN is generated before or at enrollment start for that institute (then rotates every 14 days).

---

## 8. Dashboard — Action Button State Machine

The backend returns session/form state params per shift per patient. The frontend renders buttons accordingly:

| Session status | `terminationReason` | Post Therapy form | Shift window | Trial status | Button(s) shown |
|---------------|---------------------|------------------|--------------|--------------|-----------------|
| Not started | — | — | Open | Active | **Start** |
| Not started | — | — | Closed | Active | **Missed** (no action) |
| Not started | — | — | Open | Completed (after `completionDate`) | **—** (no button) |
| `INCOMPLETE` | `USER_ENDED` | Not submitted | Open | Active | **Restart** + **Resume** |
| `COMPLETED` | `SESSION_MAX_REACHED` | Not submitted | Open | Active | **Resume** |
| `AUTO_TERMINATED` | `TIMEOUT` or `AUTO_TERMINATED_ON_NEW_SESSION` | Not submitted | Open | Active | **Restart** + **Resume** |
| `INCOMPLETE` | `USER_ENDED` | Submitted | Open | Active | **Restart** |
| `COMPLETED` | `SESSION_MAX_REACHED` | Submitted | Open | Active | **Done** |
| `AUTO_TERMINATED` | `TIMEOUT` or `AUTO_TERMINATED_ON_NEW_SESSION` | Submitted | Open | Active | **Restart** |

**Restart:** Creates a **new session** for that shift within the open window. Previous session data is **kept** in DB.

**Resume:** Opens the Post Therapy form for the existing session.

**Backend response params** (per shift, per patient in list API):
```json
{
  "shift": "shift1 | shift2 | shift3",
  "shiftStatus": "upcoming | active | missed",
  "sessionStatus": "not_started | ACTIVE | INCOMPLETE | COMPLETED | AUTO_TERMINATED",
  "terminationReason": "USER_ENDED | SESSION_MAX_REACHED | TIMEOUT | AUTO_TERMINATED_ON_NEW_SESSION | null",
  "postFormStatus": "not_submitted | submitted",
  "trialStatus": "active | completed",
  "actionButtons": ["start" | "restart" | "resume" | "done" | "missed"],
  "weekly": {
    "buttonLabel": "Week 0 | Week 2 | Week 4",
    "currentStudyWeek": 0,
    "status": "pending | done | missed",
    "weeklyFormId": "optional form id when steps already submitted"
  }
}
```

> `weekly.buttonLabel` drives the Dashboard Weekly chip text. Form steps come from `getInstitutionTrial.weeklyFormDefinitions` matched by `currentStudyWeek` — not from the dashboard chip.

---

## 9. Dashboard — Patient List

### 8.1 Sort order

- **Default sort:** Patients with pending sessions first (Shift 1 → Shift 2 → Shift 3), then completed, then missed last.
- **Optional sorts:** Compliance (low → high), Enrollment Date.

### 8.2 Columns

| Column | Source |
|--------|--------|
| Name & Registration No. | Patient record (`registrationNo` — optional, same as Skitii product) |
| Age | Patient record |
| Action (shift chips) | Backend shift state per patient |
| Group Type | Patient record (Adaptive / Control) |
| Weekly (button label / Done) | Backend `weekly.buttonLabel` + status (even weeks only) |
| Enrollment Date | Patient record |
| Treatment Duration | From trial config (`trialDurationWeeks` — Yenepoya **4 Weeks**) |
| Compliance Status | Computed: completedSessions / expectedSessions |
| Emergency Number | Patient record |
| Last Session | Last completed Post Therapy `completedAt` |

### 8.3 Filters

- **Date filter** — defaults to today; can select a specific date to view that day's session status.
- **Shift chips:** `All` | `Shift 1` | `Shift 2` | `Shift 3` — filters by session status for the selected shift on the selected date.
- **Session status chips:** `All` | `Pending` | `Completed` | `Missed` — filters by session status for the selected date + shift.
- **Weekly form chip:** `Weekly Pending` | `Weekly Submitted` — filters by current week's form status.
- **Search** — by patient name only.
- **Pagination** — server-side.

---

## 10. Add Patient (Enrollment)

### 9.1 Form sections

**Personal Information**
- First Name*, Last Name*
- Patient ID / Registration No. (`registrationNo` — optional)
- Emergency Number* (India +91)
- Language Preference* — Kannada | English | Hindi | Malayalam
- Age* (years, integer)
- Gender* — Male | Female | Other

**Clinical Data** *(Yenepoya v1 — will differ per future hospital)*
- Diagnosis Stage* — Stage 1 | Stage 2 | Stage 3 | Stage 4
- Treatment Type* — Radiotherapy | Chemotherapy | Both
- Cancer Site* (text — specific Head & Neck location)
- ECOG Performance Status* — 0 | 1 | 2 | 3 | 4

**Study Enrollment**
- Enrollment Date* (date picker, dd/mm/yyyy)
- Surgical Type* — Pre-Operative | Post-Operative
- Group Type* — Adaptive | Control

> **Expected Duration** is **not** on this form. It is set on trial config (`trialDurationWeeks` = **4** for Yenepoya) and applies to all patients.

CTA: **Enrol Patient** (disabled until all fields valid)

### 9.2 Rules

- Patient is **editable** until Week 0 form is submitted (including **enrollment date** and group type). If Week 0 will be submitted early, set enrollment date first.
- After Week 0 submission → **view only** (no edits from the mobile app). View-only access is available from the Trial Admin Panel.
- **Group type (Adaptive / Control)** can be changed only **until Week 0 is submitted**. Blocked after that.
- **Registration No.** (`registrationNo`) — optional at enrollment, same field as the Skitii product. If provided and duplicate within the institute, the backend rejects it with a validation error (same logic as the existing Skitii product backend).
- Enrollment spanning a month boundary uses normal date arithmetic — no special handling required.
- Future hospitals: patient intake form will differ; backend must support per-institution schema versioning.

---

## 11. Statistics

Shown per institute (Yenepoya). **Date range filter is mandatory** — options:

| Option | Description |
|--------|-------------|
| Today | Default |
| Last 3 Days | |
| Last 7 Days | |
| Last 2 Weeks | |
| Custom Date Range | User picks start and end date |

4 KPI blocks displayed on the Statistics screen (all respect the date range filter):

| Block | Label | Definition |
|-------|-------|-----------|
| 1 | **Total Sessions** | Expected patient × shift slots in range (Week 0 submitted, within enrollment–completion), broken down by Shift 1 / 2 / 3 |
| 2 | **Total Completed Sessions** | Slots with Post Therapy submitted, broken down by Shift 1 / 2 / 3 |
| 3 | **Total Missed Sessions** | Slots where the shift window closed with no Post Therapy submitted, broken down by Shift 1 / 2 / 3 |
| 4 | **Registered Patients** | Patients whose `createdAt` falls in the selected clinical date range |

> **Completed session = Post Therapy form submitted.**
> **Missed session = shift window closed + no Post Therapy submitted for that shift.**
> On a fully closed day: Total Sessions = Completed + Missed. Open/upcoming shifts today count in Total only.

---

## 12. Auth & PIN

### 11.1 Login flow

```
Login screen (email input)
    ↓ sendOtp (Existing Auth Backend)
OTP screen
    ↓ verifyOtp → JWT
Create PIN (if not set on this device)
    OR
Enter PIN (if already set)
    ↓
Dashboard
```

- PIN is **4 digits**, stored in device Keychain/Keystore only (not on any server).
- PIN is **per-device** — each tablet has its own PIN for the same institute account.
- No Administrator role in the trial app — all logged-in institute users have equal access.

### 11.2 Forgot PIN

1. User taps **Forgot PIN?** on Enter PIN screen.
2. Trial Backend sends OTP to **institute's login email** (device-specific reset request).
3. User enters OTP on tablet.
4. On verify → PIN cleared on that device only → user is taken to **Create PIN** screen.
5. This resets the PIN **for that device only**. Other tablets are unaffected.

---

## 13. Control Music — Admin Setup

1. In **Skitii Admin Frontend**, admin adds a flag `controlPatientMusic: true` to music assets.
2. These flagged tracks form the **control music pool**.
3. The `GET /music` API for control patients returns only flagged tracks.
4. On session start for a control patient: frontend picks one **random track** from the pool and plays it continuously.
5. If the patient changes music: another random track from the pool is selected and plays continuously.
6. Music **ranking is not updated** for control patients.
7. Session readings store the full music history per shift: `[{ trackId, startedAt, endedAt }]`.

---

## 14. Trial Admin Panel

A new dedicated web admin panel built for managing the Skitii Trial. Separate from the existing Skitii Admin Frontend.

### 13.1 Responsibilities

| Module | Description |
|--------|-------------|
| **Patient Management** | View all enrolled patients, their details, group type (Adaptive / Control), enrollment date, and status |
| **Session Data** | View per-patient session history — Pre Therapy, Baseline, Live Session, Post Therapy data per shift per day |
| **Weekly Assessments** | View submitted weekly form responses (dynamic steps per even week; 5-min HRV when present) |
| **Statistics Dashboard** | Admin-level overview of all KPIs across the trial (sessions, missed sessions, compliance, weekly reports) |
| **Data Export** | Export trial data (patients, sessions, assessments) as CSV or PDF for clinical analysis |
| **Institute Management** | Add and manage hospital institutes and their trial assignments (supports future multi-hospital trials) |
| **Trial Configuration** | Configure trial parameters per institute (duration, patient intake schema, email reminders) |

### 13.2 Access

- Accessible by Skitii internal team only (not the institute/hospital).
- Authenticated via existing Auth Backend (separate admin role).

---

## 15. Trial Backend — API Summary

> The Trial Backend serves both the **React Native Mobile App** (tablet) and the **Trial Admin Panel**. APIs listed here are for the mobile app; the Admin Panel will have additional endpoints for data management and exports.

| API | Description |
|-----|-------------|
| `POST /auth/forgot-pin/send-otp` | Send OTP to institute email for PIN reset (device-specific) |
| `POST /auth/forgot-pin/verify-otp` | Verify OTP, clear PIN for that device |
| `POST /patients` | Enroll new patient |
| `GET /patients` | List patients with shift state, weekly payload (`buttonLabel`, `steps`, `availableWeeks`), compliance |
| `GET /patients/:id` | View patient detail |
| `PATCH /patients/:id` | Update patient (blocked after Week 0 submitted; enrollment date editable until Week 0 submitted) |
| `POST /sessions/start` | Start session — validates: clinical date ≥ `enrollmentDate` (`BEFORE_ENROLLMENT`), Week 0 submitted (`WEEK0_REQUIRED`), shift window, shift ordering, duplicate session, 30-min minimum; later weekly forms do not gate sessions; allowed through `completionDate` inclusive (`TRIAL_COMPLETED` after) |
| `POST /sessions/validate` | Safety-net check after Pre Therapy form — re-validates 30-min minimum before proceeding to Baseline |
| `POST /sessions/:id/stop` | Mark session as `INCOMPLETE` / `USER_ENDED` |
| `POST /sessions/:id/complete` | Mark session as `COMPLETED` / `SESSION_MAX_REACHED` (20-min auto-end from client) |
| `POST /sessions/:id/readings` | Upload gzip readings chunk (Adaptive: per shift; Control: per music segment) |
| `POST /sessions/:id/post-therapy` | Submit Post Therapy form |
| `POST /weekly-assessments/verify-pin` | Verify weekly form PIN — returns short-lived token (1 hr) on success; lockout after 10 wrong attempts |
| `POST /weekly-assessments` | Submit non-HRV steps for the active even week (batched) — requires PIN token; steps validated against `weeklyFormDefinitions` |
| `POST /weekly-assessments/:id/hrv` | Submit 5-minute HRV step when configured — requires PIN token |
| `GET /statistics` | Fetch all KPI aggregates (filter: dateRange) |
| `GET /music/control` | Fetch control patient music pool |

---

## 16. Edge Cases & Error Handling

### 16.1 Enrollment

| Scenario | Behaviour |
|----------|-----------|
| Patient enrolled on last day of month (e.g. Jul 31) | `completionDate` = enrollment + (`trialDurationWeeks` × 7 − 1) days (Yenepoya +27); spans months normally |
| Duplicate `registrationNo` entered for two patients (when provided) | Same validation logic as existing Skitii product backend — rejected with error |
| Group type change after enrollment | Allowed **until Week 0 form is submitted**. Blocked after that. |
| Week 0 submitted early (before enrollment date) | Allowed; patient locked view-only. Fix enrollment date **before** this submit |
| Sessions before `enrollmentDate` | Not allowed — `BEFORE_ENROLLMENT` (even if Week 0 already submitted) |

### 16.2 Session start — two-point validation

When the user taps **Start** on the Dashboard, `POST /sessions/start` validates both conditions in a single API call:

| Check | Error code | Frontend action |
|-------|------------|-----------------|
| Clinical date before `enrollmentDate` | `BEFORE_ENROLLMENT` | Start disabled — sessions only from enrollment day |
| Week 0 not submitted | `WEEK0_REQUIRED` | Start disabled until Week 0 done |
| Trial past `completionDate` (next calendar day+) | `TRIAL_COMPLETED` | Start disabled; sessions blocked (weekly forms still allowed if window open) |
| Duplicate session (same device, same shift) | `SESSION_ALREADY_ACTIVE` | Same redirect/popup as Skitii product |
| Duplicate session (different device, same shift) | `SESSION_ACTIVE_OTHER_DEVICE` | Show confirmation popup — user must confirm to proceed |
| Less than 30 minutes remain in shift window | `SHIFT_WINDOW_EXPIRING` | Show error, block start |
| Shift window already closed | `SHIFT_WINDOW_CLOSED` | Start button already disabled; backend returns error as safety net |

**Second check (safety net) — after Pre Therapy form submit:**

Frontend calls the API again after the Pre Therapy form is filled to re-validate the 30-minute minimum. This catches cases where the shift window was fine at Start but the user spent too long filling the form.

| Check | Error code | Frontend action |
|-------|------------|-----------------|
| Less than 30 minutes remain now | `SHIFT_WINDOW_EXPIRING` | Show error, cannot proceed to Baseline |

### 16.3 Mid-session events

| Scenario | Behaviour |
|----------|-----------|
| BLE device disconnects mid-session | Same popup/redirect behaviour as Skitii product frontend |
| App crashes mid-readings upload | Same recovery mechanism as Skitii product |
| Session runs past ~20 minutes | Client auto-end → `COMPLETED` / `SESSION_MAX_REACHED`. Backend 30-min job → `AUTO_TERMINATED` / `TIMEOUT` if still `ACTIVE`. |
| New session started on same device while one is `ACTIVE` | Previous session → `AUTO_TERMINATED` / `AUTO_TERMINATED_ON_NEW_SESSION` (same as Skitii product) |

### 16.4 Weekly forms

| Scenario | Behaviour |
|----------|-----------|
| Week 0 never submitted | All sessions blocked — `WEEK0_REQUIRED` until Week 0 is submitted |
| Week 0 submitted before `enrollmentDate` | Allowed. Patient becomes view-only. Sessions still blocked until enrollment day (`BEFORE_ENROLLMENT` if Start tapped early) |
| Attempt to start session before `enrollmentDate` | `BEFORE_ENROLLMENT` — Start disabled; sessions only from enrollment date onward |
| Week 2 / 4 / 6… pending or missed | Sessions still allowed (from enrollment through `completionDate` inclusive). Only Week 0 + enrollment date gate sessions |
| Week 0 still missing when Shift 1 30-min rule hits on enrollment day | Institute manually edits enrollment date to the next day (no backend auto-change); retry Week 0; sessions stay blocked until Week 0 is submitted |
| Enrollment date edited before Week 0 submitted | Allowed; `completionDate` and even-week form windows recalculated. Blocked after Week 0 submitted (set date before early Week 0) |
| Even-week form window (Week 2+) | `windowStart` = enrollment + (week × 7); `windowEnd` = start + 6 days (7-day inclusive window). e.g. enroll 17 Jul → Week 2 = **31 Jul – 6 Aug** |
| Form weeks after `completionDate` (e.g. Week 4 / 6 / 8) | No sessions for those slices after completion; forms still open on schedule and submittable while window open |
| Previous even week missed (window expired, not submitted) | Next even week in `weeklyFormDefinitions` becomes available on its scheduled window |
| Submit Week N while previous even week (N−2) is still open and not submitted | Rejected — must submit or miss previous even week first |
| Submit Week N after a later even week already submitted | Rejected — cannot skip backwards |
| Odd week requested (1, 3, 5…) | Rejected — forms only for even weeks in config |
| Week not in `weeklyFormDefinitions` | Not shown on dashboard; submit rejected (duration does **not** decide this) |
| Form window not open yet / already expired | Submit rejected; dashboard shows pending / missed accordingly |
| Weekly form after `completionDate` | **Allowed** if week is in `weeklyFormDefinitions` and form window is still open. Sessions remain blocked from the day after completion |
| More form weeks than `trialDurationWeeks` (e.g. duration 4, **7** form entries) | Valid. Sessions through completion (+27 for Yenepoya); remaining form weeks fillable while windows open |
| Duration 3 weeks (`completionDate` = enrollment + 20) with forms after that | Sessions blocked from day after completion; configured forms still OK if window open |
| Form reminder day (`windowEnd − 1`) | Email only that day; **skip** if form already Done; **no** Week 0 reminder |
| Form reminder on other days of the window | No email (not daily; not Thu/Fri/Sat) |
| Step not in that week’s configured `steps` | Rejected — payload must match `weeklyFormDefinitions` / `stepsConfigured` |
| Progress UI | Show **Step X of N** where N = steps configured for that week only (not full catalogue size) |
| `treatment_adherence` outside weeks where configured (Yenepoya: Week 4) | Step not rendered; submit rejected if sent |
| `satisfaction_survey` for control patient, or outside configured intervention week | Step hidden / rejected — intervention (Adaptive) group only |
| Non-HRV steps submitted, HRV still pending | Status `steps_submitted`; week not Done until HRV posted when `hrv` is configured |
| HRV submit with expired PIN token | `WEEKLY_PIN_TOKEN_EXPIRED`; re-verify PIN, then resubmit HRV |
| SpO₂ / BP out of “clinical” range | Accepted — **no min/max range validation** (fields still required) |
| Form edited after submission | Not allowed from mobile. View-only from Trial Admin Panel |
| Wrong PIN entered | Attempt counter incremented; error shown |
| Wrong PIN 10 times (configurable) | Locked 30 minutes; `WEEKLY_PIN_LOCKED` |
| PIN token expires (1 hour) | Submission rejected with `WEEKLY_PIN_TOKEN_EXPIRED`; re-verify PIN |
| PIN entered on tablet B while tablet A has active token | Both tokens valid independently |
| PIN rotation every 14 days (not Sunday night) | Old PIN deactivated; institute must use new PIN (admin informs via SMS/call) |
| Institute not informed of new PIN | Institute contacts Skitii admin by phone/SMS — no system action |

### 16.5 Calendar edge cases

| Scenario | Behaviour |
|----------|-----------|
| Patient enrolled on a Sunday | Week 0 due by that day (may submit earlier); Shift 1 30-min rule if submitting Sunday |
| Form window weekday | Follows enrollment weekday + (week × 7); always **7 days** inclusive (not forced Mon–Sun) |
| Enrollment spans month boundary | No special handling — date arithmetic applies normally (`enrollment + trialDurationWeeks × 7 − 1`) |
| Enrollment date manually moved forward (before Week 0 submitted) | `completionDate` and form windows recalculated from new enrollment date |
| Form weeks configured beyond duration calendar | Form windows from enrollment + (week × 7); session stop date unchanged |

### 16.6 After completion date

| Scenario | Behaviour |
|----------|-----------|
| Patient tries to start session on `completionDate` | **Allowed** (sessions through completion day inclusive) |
| Patient tries to start session from the next calendar day | Backend returns `TRIAL_COMPLETED`; Start button disabled |
| Weekly form submitted after completion date | **Allowed** if week is in `weeklyFormDefinitions` and form window is still open |
| Yenepoya: enroll 17 Jul, completion **13 Aug**, Week 4 form **14–20 Aug** | Sessions through 13 Aug; Week 4 form OK after; reminder **19 Aug** if still pending |
| Yenepoya duration 4 with form weeks 6 / 8… | Sessions through +27 days; later form weeks remain fillable while each window is open |

---

## 17. Key Technical Constraints

1. **Tablet-only** (landscape, **Android**). No phone layout.
2. **Any compatible BLE heart rate device** — not locked to a specific model. Tablet reads RR intervals; HRV computed on-device.
3. **On-device compute** — RMSSD, SDNN, pNN50 computed on tablet, uploaded to Trial Backend (same as product pattern).
4. **Always online** — tablets have internet. All Trial APIs (sessions, weekly forms, dashboard) require network. No offline queue.
5. **Concurrent multi-tablet** — Trial Backend must block a second session for the same `patientId` + `shift` + `date` if one is already `ACTIVE`.
6. **Shift 3 date attribution** — a session starting at 2AM July 18 is stored as Shift 3 of July 17 (`sessionDate: 2026-07-17`, `shift: 3`).
7. **Future multi-hospital** — patient intake schema must be versioned per `institutionId` / `trialId` to support different fields for other hospitals.
8. **Weekly Form PIN** — PIN is hashed in DB, never stored in plaintext. Rotates every **14 days**. Lockout counter and token are stored server-side (not on device).
