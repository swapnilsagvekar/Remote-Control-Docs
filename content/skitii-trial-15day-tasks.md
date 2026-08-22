# Skitii Trial — 18-Day Task List  
**Version:** 1.1  
**Date:** July 2026  
**Author:** Swapnil Sagvekar  
**Customer:** Yenepoya Hospital  
**Scope:** Trial Backend (Mobile App APIs + Trial Admin Panel APIs) + Database Schema  
**Note:** React Native Mobile App is handled separately. Full project duration is **36 working days**. This document covers Days 1–18 (schema + all backend APIs).

---

## Goal for Day 18

By end of Day 18:

- Database schema complete
- All **Mobile App Backend APIs** complete
- All **Trial Admin Panel Backend APIs** complete (Trials, Patients, Sessions, Weekly Forms, Statistics, Institutes, PIN, Export)
- Admin Panel Frontend already started (from Day 15) with core modules wired

---

## Overview

| Days | Workstream | Duration |
|------|------------|----------|
| 1 – 3 | Database Schema Design | 3 days |
| 3 – 12 | Backend APIs — Mobile App | 9 days |
| 8 – 17 | Backend APIs — Trial Admin Panel (parallel) | 10 days |
| 15 – 18 | Admin Panel Frontend kickoff + API polish | overlaps |

> Admin Panel Backend starts on Day 8 and runs through Day 17. Frontend starts Day 15 once Trials / Patients / Sessions APIs are ready.

---

## Days 1 – 3 — Database Schema Design

| Day | Tasks | Status |
|-----|-------|--------|
| **Day 1** | Design & implement core collections: `trials`, `trialConfigurations`, `patients`, `sessions` — indexes, field types, `institutionId` / `trialId` scoping | ☐ |
| **Day 2** | Form collections: `preTherapy`, `postTherapy`, `sessionReadings`, `weeklyForms`, `weeklyFormPins`, `missedSessionLogs` (stats = compute-on-read; no `trialStatistics` collection) | ☐ |
| **Day 3** | Finalize indexes, team review. Product DB: add `controlPatientMusic` on `music_assets`. Begin Mobile App Backend APIs. | ☐ |

**Deliverable:** All MongoDB collections ready for API development.

---

## Days 3 – 12 — Backend APIs (Mobile App)

| Day | Tasks | Status |
|-----|-------|--------|
| **Day 3** | Device PIN APIs — create PIN, verify PIN, forgot PIN / OTP reset | ☐ |
| **Day 4** | Patient APIs — enroll (duplicate `registrationNo` when provided, dynamic schema), list, view, update (Week 0 lock) | ☐ |
| **Day 5** | `POST /sessions/start` — shift window, shift ordering, duplicate session, 30-min minimum | ☐ |
| **Day 6** | `POST /sessions/validate`; stop (`INCOMPLETE`/`USER_ENDED`) / complete (`COMPLETED`/`SESSION_MAX_REACHED`) / readings; 20-min auto-end + 30-min timeout (`AUTO_TERMINATED`/`TIMEOUT`) | ☐ |
| **Day 7** | Pre Therapy + Post Therapy submit APIs; `TRIAL_COMPLETED` enforcement | ☐ |
| **Day 8** | Weekly Form PIN verify + dynamic even-week steps submit (non-HRV). **Admin Panel Backend starts (Trials module).** | ☐ |
| **Day 9** | Weekly form 5-min HRV (when configured); Week 0 enrollment-day + Shift 1 30-min rule; sequential even-week ordering | ☐ |
| **Day 10** | Mobile statistics API (date range); shift window + ordering enforcement polish | ☐ |
| **Day 11** | Cron jobs — 14-day PIN rotation; 4 AM missed session email; form reminder on **last** Thu/Fri/Sat before window expiry | ☐ |
| **Day 12** | Mobile API polish — edge cases, error codes, config fetch. **Mobile Backend complete.** | ☐ |

**Deliverable:** All Mobile App Backend APIs ready for React Native integration.

---

## Days 8 – 17 — Backend APIs (Trial Admin Panel)

*Runs in parallel with Mobile App APIs from Day 8. Continues through Day 17.*

### Module plan

| Module | Scope |
|--------|-------|
| **Trials** | Create / update / list / archive trial; patient schema; shift windows; reminders; activate/deactivate |
| **Trial config** | Assign institute → trial; admin/institute email recipients |
| **Patients** | Admin list, filters, detail, export (CSV/PDF); Week 0 view-only rules |
| **Sessions** | History, detail, Pre/Post Therapy, readings; filter by status / terminationReason |
| **Weekly forms** | List/view configured steps for that week; PIN view (read-only); missed weekly filters |
| **Statistics** | Admin KPIs, missed session logs, analytics export |
| **Institutes & music** | Institute–trial linking; `controlPatientMusic` flag APIs |

### Day-by-day

| Day | Tasks | Status |
|-----|-------|--------|
| **Day 8** | **Trials module** — create / update / list trial; seed Yenepoya v1 config | ☐ |
| **Day 9** | **Trials module** — `patientSchema` + `weeklyFormDefinitions` CRUD (form weeks independent of `trialDurationWeeks`); shift windows; reminder days; activate/deactivate | ☐ |
| **Day 10** | **Trial config** — institute ↔ trial assignment; email recipients. **Patients module** — admin list + filters | ☐ |
| **Day 11** | **Patients module** — detail view, compliance summary, export CSV/PDF | ☐ |
| **Day 12** | **Sessions module** — history list (patient / date / shift); filters by status | ☐ |
| **Day 13** | **Sessions module** — session detail, Pre Therapy, Post Therapy, readings view/download | ☐ |
| **Day 14** | **Weekly forms module** — list/view dynamic steps for even weeks; missed filters; Weekly PIN view API | ☐ |
| **Day 15** | **Statistics module** — admin KPIs, missed session logs. **Admin Panel Frontend starts.** | ☐ |
| **Day 16** | **Institutes module** — Auth institution linking. Music flag APIs (`controlPatientMusic`) | ☐ |
| **Day 17** | Admin auth guards (Skitii internal only); Admin API review + integration smoke with frontend | ☐ |
| **Day 18** | Admin API polish — pagination, error codes, export edge cases; handoff checklist for frontend | ☐ |

**Deliverable:** All Trial Admin Panel Backend APIs complete and ready for full frontend integration.

---

## Parallel Work View (Days 1–18)

```
Day:   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
       ├──────────┤
DB     [DB Schema ]

API         ────────────────────────────────────────┤
Mobile      [Backend — Mobile App APIs                  ]

API                      ──────────────────────────────────────────┤
Admin                    [Backend — Admin Panel APIs (by module)       ]

           Trials ──┤
           Config+Patients ──┤
           Sessions ──┤
           Weekly+Stats ──┤
           Institutes+Auth ──┤

Panel                                        ────────┐
Admin                                        [Frontend from Day 15]
```

---

## What Comes After Day 18 (Reference)

| Days | Work |
|------|------|
| 15 – 22 | Trial Admin Panel Frontend (continues) |
| 15 – 17 | Skitii Admin Panel Update (`controlPatientMusic` UI) |
| 23 – 27 | Deployment (UAT + Production) |
| 26 – 36 | Testing & Bug Fixes |

**Full project duration:** 36 working days.

---

## Checkpoint Summary for Management

| Checkpoint | Day | Expected Outcome |
|------------|-----|------------------|
| Schema ready | Day 3 | All collections designed and implemented |
| Core mobile session APIs ready | Day 7 | Patient + Session start/stop/complete + forms working |
| Weekly + cron ready | Day 11 | Weekly forms, PIN, and cron jobs working |
| Mobile APIs complete | Day 12 | Full mobile backend ready for app team |
| Trials + Patients + Sessions admin APIs ready | Day 13 | Frontend can start on core modules |
| Admin APIs complete | Day 17–18 | Full admin backend ready for remaining frontend modules |

---

## Risks for First 18 Days

| Risk | Mitigation |
|------|-----------|
| Dynamic patient schema complexity | Finalize schema in Trials module (Days 8–9) before Patients admin APIs |
| Admin API scope under-estimated | Explicit module breakdown (Trials / Patients / Sessions / Weekly / Stats / Institutes) |
| Frontend blocked waiting for APIs | Frontend starts Day 15 after Sessions module lands |
| Parallel Admin + Mobile conflicts | Shared services review on Day 17 |
| Cron / email delivery issues | Test email templates on Day 11 |
