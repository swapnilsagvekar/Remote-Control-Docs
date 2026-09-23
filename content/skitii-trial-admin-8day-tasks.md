# Skitii Trial — 8-Day Task List  
**Version:** 1.0  
**Date:** August 2026  
**Author:** Swapnil Sagvekar  
**Customer:** Yenepoya Hospital  
**Scope:** Trial Admin Panel Frontend (Next.js) + Trial Backend Admin APIs (GraphQL)  
**Note:** Database schema and Mobile App APIs are covered in the **18-Day Task List**. This document is the focused sprint to **design and wire the Trial Admin Panel** against Skitii Trial Backend. React Native tablet app is out of scope.

---

## Goal for Day 8

By end of Day 8:

- Trial Admin shell live: auth (Product Backend OTP → JWT), sidebar IA, scope bar (Institution + Trial)
- All sidebar modules built and talking to Trial Backend admin GraphQL
- **Setup:** Trials, Institutions, Configurations (including weekly PIN view/copy)
- **Operations:** Patients (list / add / edit / view + weekly schedule) and Sessions (list + detail)
- **Analytics:** Session Statistics and Weekly Statistics (KPIs, charts, drill-down, CSV)
- **Music:** control-pool catalogue preview
- Admin-only guards on backend; smoke pass of every screen against Yenepoya v1 seed

---

## Assumed already done (from 18-Day plan)

| Area | Status |
|------|--------|
| MongoDB collections (`trials`, `trialConfigurations`, `patients`, `sessions`, weekly forms, …) | Ready |
| Mobile App Backend APIs (PIN, enroll, session start/stop, weekly submit, crons) | Ready |
| Yenepoya v1 seed (trial protocol + weekly form definitions) | Ready |
| Product Backend OTP / JWT for Skitii internal admins | Ready |

This sprint does **not** rebuild schema or tablet APIs. It delivers the **admin console** and the **admin GraphQL** it consumes.

---

## Overview

| Days | Workstream | Duration |
|------|------------|----------|
| 1 | Shell, auth, scope, dashboard + API contract | 1 day |
| 2 | Setup — Trials | 1 day |
| 3 | Setup — Institutions + Configurations | 1 day |
| 4 – 5 | Operations — Patients | 2 days |
| 6 | Operations — Sessions | 1 day |
| 7 | Analytics — Session + Weekly statistics | 1 day |
| 8 | Music + polish, guards, smoke, handoff | 1 day |

> Frontend (`Skitii-Trial-Admin-Frontend`, port 3020) and Trial Backend admin GraphQL (`Skitii-Trial-Backend`, port 3010) move **in the same day per module**. Do not start a screen until that day’s queries/mutations exist.

---

## Module plan (matches Admin Panel design)

| Sidebar | Module | Backend (GraphQL) | Frontend routes |
|---------|--------|-------------------|-----------------|
| — | **Dashboard** | Counts from trials / institutions / scope | `/dashboard` |
| Setup | **Trials** | `adminTrials`, `adminTrial`, create / update / activate / complete / deactivate | `/trials` · `/trials/new` · `/trials/[trialId]/edit` |
| Setup | **Institutions** | `adminInstitutions` (Auth DB, `SKITII_TRIAL`) | `/institutions` |
| Setup | **Configurations** | `adminTrialConfigurations`, create / update; `adminWeeklyPin` (read-only) | `/configurations` |
| Operations | **Patients** | `adminPatients`, `adminPatient`, create / update; CSV export | `/patients` · `/patients/new` · `/patients/[id]` · `/patients/[id]/edit` |
| Operations | **Weekly on patient** | `adminPatientWeeklySchedule`, `adminWeeklyForm` | Patient view + form detail |
| Operations | **Sessions** | `adminSessions`, `adminSession`, `adminSessionReadings` | `/sessions` |
| Analytics | **Session Statistics** | `adminStatistics`, `adminStatisticsDetails`; CSV | `/statistics` |
| Analytics | **Weekly Statistics** | `adminWeeklyStatistics`, `adminWeeklyStatisticsDetails` | `/weekly-statistics` |
| Music | **Music** | `adminMusicList`, `adminMusicControl` | `/music` |

Auth: Product Backend email OTP → JWT. Trial GraphQL uses `GqlAuthGuard` + `AdminGuard` (Skitii internal only).

---

## Day 1 — Shell, auth, scope, dashboard

| Stream | Tasks | Status |
|--------|-------|--------|
| **Backend** | Confirm admin JWT path; `AdminGuard` on GraphQL; dashboard-safe list queries (`adminTrials`, `adminInstitutions`, `adminTrialConfigurations`) return enough for counts + scope selects | ☐ |
| **Frontend** | Login (OTP); collapsible sidebar (Dashboard / Setup / Operations / Analytics / Music); top bar (title, theme, logout); **scope bar** (Institution + Trial) on dashboard; `/dashboard` cards + quick links | ☐ |

**Deliverable:** Signed-in admin can open the shell, pick institute + trial, and see dashboard counts. No clinical CRUD yet.

---

## Day 2 — Setup: Trials

| Stream | Tasks | Status |
|--------|-------|--------|
| **Backend** | Trials CRUD: list / get / create / update; status mutations (`activate` / `complete` / `deactivate`); fields — basics, `shiftWindows`, `weeklyFormDefinitions` (even weeks independent of `trialDurationWeeks`); seed Yenepoya v1 if not already | ☐ |
| **Frontend** | Trials list (status badges); **Create draft** page; **Edit** page — same fields (trial ID create-only; duration, shifts, weekly interval, reminder days, clinical day start hour; repeatable shift rows; repeatable weekly-step rows) | ☐ |

**Deliverable:** Admin can define a protocol end-to-end. Weekly PIN is **not** on this screen (Configurations only).

---

## Day 3 — Setup: Institutions + Configurations

| Stream | Tasks | Status |
|--------|-------|--------|
| **Backend** | `adminInstitutions` from Auth DB (`SKITII_TRIAL`); configurations list / create / update (`institutionId` + `trialId` + `isActive`); `adminWeeklyPin` read-only (plaintext for copy; rotation stays cron-only) | ☐ |
| **Frontend** | Institutions **list only** (name, email, active trial, config count — no master-data edit). Configurations: weekly PIN view/copy; create mapping; mapping table with active flag | ☐ |

**Deliverable:** Setup complete — protocol defined, hospital mapped, PIN shareable with institute staff.

---

## Days 4 – 5 — Operations: Patients

### Day 4 — List, add, edit, export

| Stream | Tasks | Status |
|--------|-------|--------|
| **Backend** | Paginated `adminPatients` with search, status, group, Week 0 filter, sort; `createAdminPatient` / `updateAdminPatient` scoped by `institutionId` + `trialId`; duplicate `registrationNo` when provided; CSV export endpoint | ☐ |
| **Frontend** | Scoped list: search, filters, sort, pagination, **Add patient**, **Export CSV**. Add page — personal / clinical / enrolment sections. Edit page — same + status (`active` / `completed` / `withdrawn`); Week 0 lock rules | ☐ |

### Day 5 — View + weekly schedule

| Stream | Tasks | Status |
|--------|-------|--------|
| **Backend** | `adminPatient` detail (summary + session snapshot for date/shift); `adminPatientWeeklySchedule` (windows, filled, status); `adminWeeklyForm` read-only (render only configured steps, including HRV when present) | ☐ |
| **Frontend** | Patient view: summary, session snapshot chips, weekly schedule table; **View** opens read-only weekly form detail (`vitals`, `gad7_phq9`, `nccn_distress`, `hads`, `qlq_c30`, `qlq_hn35`, `treatment_adherence`, `satisfaction_survey`, `hrv`) | ☐ |

**Deliverable:** Full patient module as in the Admin Panel design. Admins enroll and review; they do not run therapy sessions.

---

## Day 6 — Operations: Sessions

| Stream | Tasks | Status |
|--------|-------|--------|
| **Backend** | `adminSessions` paginated list (scope + patient + status); `adminSession` detail (status, `terminationReason`, duration, shift, wellbeing, Pre / Post Therapy); `adminSessionReadings` for HR / phase panel | ☐ |
| **Frontend** | Sessions list with search + status filter (`ACTIVE` / `COMPLETED` / `INCOMPLETE` / `AUTO_TERMINATED`). Detail dialog: therapy forms + readings. No start/stop from admin | ☐ |

**Deliverable:** Audit trail of tablet sessions without leaving the list.

---

## Day 7 — Analytics: Session + Weekly statistics

| Stream | Tasks | Status |
|--------|-------|--------|
| **Backend** | `adminStatistics` + `adminStatisticsDetails` (registered / expected / completed / missed / open × Shift 1–3; clinical date range). `adminWeeklyStatistics` + `adminWeeklyStatisticsDetails` (same pattern × study weeks). Session stats CSV export. Open-items when windows still active | ☐ |
| **Frontend** | Shared date filter (Today / 3 / 7 / 14 / custom). Session Statistics: KPI cards, donut, stacked bars by shift, breakdown table, drill-down dialog, Export CSV. Weekly Statistics: same pattern by week; empty state if no `weeklyFormDefinitions` | ☐ |

**Deliverable:** Two analytics screens, scoped, with click-through to patient rows.

---

## Day 8 — Music, polish, guards, handoff

| Stream | Tasks | Status |
|--------|-------|--------|
| **Backend** | `adminMusicList` / `adminMusicControl` (control pool only for preview). Re-check `AdminGuard` on every admin query/mutation — institute users cannot call these. Pagination / error codes / export edge cases | ☐ |
| **Frontend** | Music catalogue: search, category filter, in-page preview player (no upload CMS). Loading / empty / error states on all modules. Theme + scope persistence. Integration smoke vs Yenepoya seed | ☐ |

**Handoff checklist**

- [ ] Login → dashboard with real counts  
- [ ] Create / edit trial; map institute; copy weekly PIN  
- [ ] Add / edit / view patient; export CSV; open weekly form detail  
- [ ] Open a completed session (forms + readings)  
- [ ] Session stats + weekly stats drill-down for a date range  
- [ ] Play a control-pool track  
- [ ] Non-admin JWT rejected by GraphQL  

**Deliverable:** Trial Admin Panel complete and ready for UAT with Trial Backend.

---

## Parallel Work View (Days 1–8)

```
Day:     1    2    3    4    5    6    7    8
         │
Backend  [Auth+lists] [Trials] [Inst+Cfg] [Patients APIs     ] [Sessions] [Stats] [Music+guards]
Frontend [Shell+Dash] [Trials] [Inst+Cfg] [List/Add/Edit] [View+Wkly] [Sessions] [Stats] [Music+smoke]
```

---

## What this 8-day sprint is not

| Out of scope | Where it lives |
|--------------|----------------|
| DB schema, indexes, seeds | 18-Day Task List (Days 1–3) |
| Tablet / mobile APIs, device PIN, session start/stop, weekly submit, crons | 18-Day Task List (Days 3–12) |
| React Native HNF app screens | Separate mobile track |
| Product Admin `controlPatientMusic` flag UI | Skitii Admin Panel (original Days 15–17) |
| UAT / Production deploy | Timeline Phase 6 |
| Full QA cycle | Timeline Phase 7 |

---

## Checkpoint Summary

| Checkpoint | Day | Expected outcome |
|------------|-----|------------------|
| Shell usable | Day 1 | Login, sidebar, scope, dashboard |
| Setup complete | Day 3 | Trial protocol + institute mapping + PIN copy |
| Patients complete | Day 5 | List / CRUD / weekly review |
| Sessions complete | Day 6 | History + forms + readings |
| Analytics complete | Day 7 | Session + weekly KPIs with drill-down |
| Panel complete | Day 8 | Music + smoke + admin-only access |

---

## Risks for 8 Days

| Risk | Mitigation |
|------|-----------|
| Admin GraphQL lagging a screen | Same-day backend-first: queries land in the morning, UI in the afternoon |
| Scope bar missing on clinical pages | Day 1 contract: every patients / sessions / stats call requires `institutionId` + `trialId` |
| Weekly form detail explosion (many step types) | Day 5: render **configured steps only**; reuse section components |
| Statistics compute-on-read too slow | Date range mandatory; reuse existing compute-on-read services; no new cache collection |
| 8 days too tight if backend APIs are greenfield | Schema + mobile APIs must already be done (18-Day plan). If admin GraphQL is also new, drop Music to a stretch goal and finish stats on Day 8 |

---

## Stretch (only if Days 1–7 are green)

| Item | Note |
|------|------|
| Music preview polish (seek, next/prev) | Day 8 if time |
| Missed-session log list from `adminMissedSessionLogs` | Optional extra on Session Statistics |
| Patient PDF export | CSV is Day 4 must-have; PDF is stretch |
