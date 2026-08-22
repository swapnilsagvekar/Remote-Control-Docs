# Skitii Trial — Project Timeline

**Total Duration:** 36 Working Days  
**Customer:** Yenepoya Hospital  
**Scope:** Trial Backend + Trial Admin Panel + Skitii Admin Panel Update  
**Note:** React Native Mobile App is handled separately (not included in this timeline).

---

## Summary

| Phase | Work | Days | Duration |
|-------|------|------|----------|
| 1 | Database Schema | 1 – 3 | 3 days |
| 2 | Backend APIs (Mobile App) | 3 – 12 | 9 days |
| 3 | Backend APIs (Trial Admin Panel) | 8 – 17 | 10 days |
| 4 | Trial Admin Panel Frontend | 15 – 22 | 7 days |
| 5 | Skitii Admin Panel Update | 15 – 17 | 2 days |
| 6 | Deployment (UAT + Prod) | 23 – 27 | 4 days |
| 7 | Testing & Bug Fixes | 26 – 36 | 9 days |

> Phases 2, 3, 4, and 5 run in parallel where possible. Phase 3 (Admin APIs) is expanded to cover full modules: Trials, Patients, Sessions, Weekly Forms, Statistics, Institutes, PIN view, Export.

---

## Phase 1 — Database Schema Design
**Days 1 – 3 (3 days)**

Define and implement all MongoDB collections for the Trial Backend:

- `trials` — trial definition (duration, shifts, patient schema, group types, reminders)
- `trialConfigurations` — institute ↔ trial assignment
- `patients` — enrollment data with dynamic intake fields per trial
- `preTherapy` — pre-therapy form responses per session
- `sessions` — session records (status/terminationReason same as product: ACTIVE / INCOMPLETE / COMPLETED / AUTO_TERMINATED)
- `postTherapy` — post-therapy form responses per session
- `sessionReadings` — per-phase HR readings
- `weeklyForms` — even-week assessments; dynamic steps from `weeklyFormDefinitions`; 5-min HRV when configured
- `weeklyFormPins` — hashed PIN, attempt counter, lockout state
- `missedSessionLogs` — daily missed session records for email reporting
- Statistics — **compute-on-read** (no `trialStatistics` collection in v1)
- Update product `music_assets` — add `controlPatientMusic` flag

---

## Phase 2 — Backend APIs (Skitii Trial Mobile App)
**Days 3 – 12 (9 days)**

APIs consumed by the React Native tablet app:

- Device PIN — create, verify, forgot PIN / OTP reset
- `trialConfiguration` — fetch institute-wise config (read-only for mobile)
- `patients` — enroll, list, view, update (blocked after Week 0 submitted)
- `preTherapy` — submit pre-therapy form
- `sessions/start` — shift window, shift ordering, duplicate session, 30-min minimum
- `sessions/validate` — safety-net 30-min re-check after Pre Therapy
- `sessions` — stop (`INCOMPLETE`/`USER_ENDED`), complete (`COMPLETED`/`SESSION_MAX_REACHED`), readings upload; 20-min auto-end + 30-min timeout job (`AUTO_TERMINATED`/`TIMEOUT`)
- Concurrent device start → previous session `AUTO_TERMINATED` / `AUTO_TERMINATED_ON_NEW_SESSION`
- `postTherapy` — submit post-therapy form
- `weeklyForm/verify-pin` — 6-digit PIN, 1-hour token, lockout after 10 attempts
- `weeklyForm` — submit configured steps for even week (0/2/4…); 5-min HRV when configured; Week 0 lock + sequential even-week ordering
- Patient list returns weekly payload: `buttonLabel`, `steps`, `availableWeeks`
- Cron jobs — 14-day PIN rotation; 4 AM missed session email; form reminder on **last** Thu/Fri/Sat before window expiry
- `trialStatistics` — KPI aggregates with mandatory date range filter (**compute-on-read**; no cache collection in v1)
- `TRIAL_COMPLETED` enforcement; duplicate `registrationNo` validation (when provided)

---

## Phase 3 — Backend APIs (Trial Admin Panel)
**Days 8 – 17 (10 days)**
*(Runs in parallel with Phase 2; continues after Mobile APIs finish)*

Admin-only APIs for the Trial Admin Panel, organised by module:

### 3.1 Trials module
- Create / update / list / archive trials (`trials`)
- Configure trial parameters: `shiftsPerDay`, `shiftWindows`, `trialDurationWeeks` (Yenepoya = 4; session stop only), `groupTypes`, `reminderDays`, `clinicalDayStartHour`, `weeklyFormIntervalDays` (14)
- Versioned `patientSchema` CRUD (dynamic intake fields per trial)
- **`weeklyFormDefinitions` CRUD** — any number of even-week step lists (independent of `trialDurationWeeks`; seed example Week 0 / 2 / 4)
- Activate / deactivate trial

### 3.2 Trial configuration / institute assignment
- Assign institution → trial (`trialConfigurations`)
- Update institute emails (admin + institute recipients for cron emails)
- List active configurations per institute

### 3.3 Patients module (Admin)
- Paginated patient list with filters (group type, enrollment date, status, search by name / registrationNo)
- Patient detail view (full clinical data + compliance summary)
- View-only enforcement after Week 0 (admin can view; edit rules same as product story)
- Patient export (CSV / PDF)

### 3.4 Sessions module (Admin)
- Session history list per patient / per date / per shift
- Session detail — status, terminationReason, baseline, readings (including trackIds / music)
- Pre Therapy + Post Therapy view per session
- Session readings view / download
- Filter by status (`ACTIVE` / `INCOMPLETE` / `COMPLETED` / `AUTO_TERMINATED`)

### 3.5 Weekly forms module (Admin)
- List weekly assessments per patient / even study week
- View configured steps only (dynamic) — read-only; 5-min HRV when present
- Filter by status (`steps_submitted` / `fully_completed` / missed)
- Weekly Form PIN view (current active PIN per institute — read-only)

### 3.6 Statistics & missed sessions
- Admin / institution statistics APIs — date-range KPIs:
  - `totalSessions` / `totalCompletedSessions` / `totalMissedSessions` (each with Shift 1–3)
  - `registeredPatients` (patients with `createdAt` in the clinical date range)
- Missed session log list / detail (from `missedSessionLogs`)
- Detailed analytics export (CSV / PDF)

### 3.7 Institute & music
- Institute management APIs (link Auth DB institutions to trials)
- Music assets — flag / unflag `controlPatientMusic` (product DB); verify control pool API

### 3.8 Admin auth / access
- Admin-role JWT validation (Skitii internal team only)
- Ensure institute users cannot call admin endpoints

---

## Phase 4 — Trial Admin Panel Frontend
**Days 15 – 22 (7 days)**
*(Starts once core Admin APIs are ready; overlaps with Phase 3 finish)*

Web-based admin panel for Skitii internal team:

- **Trials** — create / edit trial, patient schema builder, **weeklyFormDefinitions** (any even-week count; independent of duration), shift windows, reminders
- **Institute assignment** — link hospital to trial
- **Patient Management** — list, detail, export
- **Session Data** — per-patient session history, readings, Pre / Post Therapy
- **Weekly Assessments** — configured steps per even week (dynamic; form list independent of `trialDurationWeeks`)
- **Weekly PIN View** — current active PIN (read-only)
- **Statistics Dashboard** — KPIs + missed session reports
- **Data Export** — CSV / PDF
- **Institute Management** — hospitals and trial assignments

---

## Phase 5 — Skitii Admin Panel Update
**Days 15 – 17 (2 days)**
*(Runs in parallel with Phase 4)*

Update existing Skitii product admin panel:

- Add `controlPatientMusic` flag to music asset management UI
- Backend API to flag/unflag music assets for control patients
- Verify `GET /music/control` returns only flagged tracks

---

## Phase 6 — Deployment (UAT + Production)
**Days 23 – 27 (4 days)**

- Deploy Trial Backend to UAT
- Deploy Trial Admin Panel to UAT
- End-to-end smoke test on UAT (mobile APIs + admin modules)
- Fix critical UAT issues
- Deploy to Production
- Verify production deployment

---

## Phase 7 — Testing & Bug Fixes
**Days 26 – 36 (9 days)**
*(Overlaps with deployment)*

- Functional testing — Mobile App APIs + Admin Panel APIs (all modules)
- Trials module — schema config, shift windows, institute assignment
- Patients / Sessions / Weekly Forms admin list-detail-export tests
- Shift window and ordering validation tests
- 30-min minimum check + session status/terminationReason tests
- Multi-tablet conflict + `TRIAL_COMPLETED` tests
- Weekly Form PIN + cron email tests
- Admin panel CRUD, filters, and export tests
- Performance testing — patient / session lists with large datasets
- Bug fixes and regression testing

---

## Parallel Work View (Timeline Chart)

```
Day:   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36
       ├──────────┤
DB     [Phase 1: DB Schema    ]

API         ────────────────────────────────────────────┤
Mobile      [Phase 2: Backend — Mobile App APIs              ]

API                      ──────────────────────────────────────────────┤
Admin                    [Phase 3: Backend — Admin Panel APIs (modules)     ]

Panel                                        ────────────────────────────┤
Admin                                        [Phase 4: Admin Panel Frontend   ]

Skitii                                       ──────────┤
Admin                                        [P5       ]

Deploy                                                                  ──────────────────┤
                                                                        [Phase 6: Deploy  ]

Test                                                                             ──────────────────────────────────────────┤
                                                                                 [Phase 7: Testing & Bug Fixes             ]
```

---

## Risk & Buffer

| Risk | Mitigation |
|------|-----------|
| Dynamic patient schema complexity | Finalize schema config format before Phase 2 starts |
| Multi-tablet conflict edge cases | Backend unit tests in Phase 2 before mobile integration |
| Admin panel API / module scope | Phase 3 explicitly scoped by module (Trials, Patients, Sessions, etc.) |
| Admin frontend blocked on APIs | Frontend starts Day 15 after Trials + Patients + Sessions APIs land |
| UAT issues delaying production | Overlap buffer between deployment and testing |

**Buffer:** +4 days added vs the previous 32-day plan (mainly Phase 3 Admin APIs). Overlapping phases still absorb 1–2 day slips without missing the 36-day deadline.
