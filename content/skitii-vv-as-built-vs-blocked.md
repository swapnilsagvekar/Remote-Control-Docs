# Skitii V&V — As-Built vs Blocked Execution Map

**Version:** 1.0  
**Date:** 03 September 2026  
**Author:** Swapnil Sagvekar  
**Customer:** Internal (Mindful Gurukul / CDSCO pack)  
**Scope:** Map the 03-Sep-2026 V&V Word pack against the current Yenepoya Trial app  
**Classification:** Internal working note — not executed V&V evidence  
**Source pack:** `/home/swapnil/Downloads/files 10` (19 `.docx` files, all Harmonized Draft / Execution Template)

---

## Control note

This document is **as-built engineering fact** from the current Trial stack. It is **not**:

- a completed Software Verification & Validation Report
- permission to pre-fill PASS / FAIL / Evidence IDs in `SKT-TC-*` sheets
- an approved SRS/SDS freeze of algorithm operators

The Word pack itself says: do not pre-fill PASS; expected results must be approved **before** observing Skitii output; unresolved numeric operators remain OPEN.

Use this file to decide **what testers can run later**, and **what PI / Quality must freeze first**. Do not copy these tables into execution Actual-result cells.

---

## 1. Labelled configuration this map uses

The CDSCO pack describes Trial 1: dedicated Android tablet or dedicated device, Polar H10 over BLE, 20-minute two-phase session, four music categories.

**Code used for this map**

| Layer | Repo | What exists |
|-------|------|-------------|
| Session / BLE / HR / HRV / music | `Skitii-Trials-Yenepoya-HNF-APP` | Polar H10 BLE, `hrv.ts`, `discreteBands.ts`, 20-min session, OTP + PIN |
| Trial APIs | `Skitii-Trial-Backend` | Patients, sessions, readings, week-0 |
| Trial Admin | `Skitii-Trial-Admin-Frontend` | Patient list, weekly forms, music, dashboard |

**Out of scope for this pack (same as SKT-SVVR-001)**

- `Skitii-Desktop-Ble` (Pi / station kiosk engineering track)
- `Skitii-Product-Frontend` (commercial product, not Trial 1 labelled config)
- Global (cross-patient) ranking — Trial 2
- Computer-vision / facial-emotion modules — not in the product

The lifecycle draft still mentions React + Python bleak + Capacitor BLE. The Trial app is **React Native CLI + react-native-ble-plx**. SDS / ARCH should be corrected to that before freeze.

---

## 2. Pack status (all 19 files)

| Document | ID | Fill as executed V&V? | What this note records |
|----------|----|----------------------|------------------------|
| Architecture diagrams | SKT-ARCH-001 v0.2 | No (draft) | Stack mismatch vs Trial app |
| Cybersecurity protocol | SKT-CYB-001 v0.1 | No | Auth/TLS exist; kiosk / AES-256 session store / SBOM do not |
| Harmonization register | SKT-HARM-001 v0.1 | Process only | OPEN-01 … OPEN-11 still block release |
| Lifecycle plan | SKT-SDLC-001 v0.2 | Process only | Draft; Class B still unapproved |
| Log templates | SKT-LOGS-001 v0.2 | Empty by design | Add rows only for real DEF- / EV- / tagged builds |
| Risk / FMEA | SKT-RMF-001 v0.2 | Process only | Residual risk after V&V, not now |
| RTM | SKT-RTM-001 v0.2 | Mapping only | Evidence / Status columns stay empty |
| SDS | SKT-SDS-001 v0.1 | Draft design | Operators still OPEN in the SDS itself |
| Software safety class | SKT-SSC-001 v0.1 | Process only | Formal IEC 62304 class not approved |
| SRS | SKT-SRS-001 v0.2 | Draft requirements | Many TBC (timeout, latency, AES-256, kiosk) |
| SVVR | SKT-SVVR-001 v0.2 | **Do not submit as final** | Unexecuted report template |
| V&V plan | SKT-VVP-001 v0.2 | Approve before any formal run | Not an evidence file |
| V&V execution master | SKT-EXEC-MASTER-001 | After family sheets | Cover sheet only |
| BLE execution sheets | SKT-TC-BLE-001 | After Polar run on frozen build | 8 of 10 runnable in principle; 2 blocked |
| E2E execution sheets | SKT-TC-E2E-001 | After frozen labelled config | ~9 of 12 have product behaviour; 3 blocked |
| HR execution sheets | SKT-TC-HR-001 | As-built PASS | Contiguous HR bands; 84.5 Restorative |
| HRV execution sheets | SKT-TC-HRV-001 | Mixed | 007–009 PASS after RMSSD alignment; 001–003/011 still blocked |
| NEG execution sheets | SKT-TC-NEG-001 | After fault tests | Some behaviours exist; expected messages not frozen |
| SEC execution sheets | SKT-TC-SEC-001 | After security freeze | 001 / 004 / 009 exist; kiosk / at-rest / SBOM do not |

---

## 3. SKT-TC-HR-001 — Phase 1 heart-rate mapping

**Aligned on both sides (code + SRS/SVVR):** contiguous HR bands. No hole at 84.5 or 94.5.

`musicCategoryFromAvgHr` and SRS-ALG-001 / SVVR Phase 1 table:

| HR (bpm) | Category |
|----------|----------|
| `null` / not finite / `<= 0` | Calming |
| `>= 95` | Grounding |
| `>= 85` and `< 95` | Calming |
| `>= 70` and `< 85` | Restorative |
| `< 70` | Uplifting |

Examples: **84.5 Restorative**, **94.5 Calming**, **95 Grounding**.

| Test ID | Title | As-built |
|---------|-------|----------|
| TC-HR-001 | Phase 1 HR category mapping | PASS |
| TC-HR-002 | Phase 1 HR boundary handling | PASS |

---

## 4. SKT-TC-HRV-001 — HRV algorithm verification

### 4.1 Formulas as implemented (`src/lib/hrv.ts`)

Not approved expected values. Independent calculation must use an agreed method, not this file as the answer key.

| Item | As-built |
|------|----------|
| RR keep range | 300–2500 ms |
| Extra filter | IQR 1.5, then neighbour-average correction if `|RR − avg(neighbours)| > 0.25 × avg` |
| Artifact % | `(range removed + IQR removed + corrected count) / initial count × 100` |
| RMSSD | `sqrt(sum(diff²) / (n − 1))` on corrected series |
| RMSSD min beats | **30** (`HRV_MIN_BEATS_RMSSD`) |
| SDNN | `sqrt(sum((RR − mean)²) / n)` — divisor **n**, not n−1 |
| SDNN min beats | **60** (`HRV_MIN_BEATS_SDNN`) |
| pNN50 | share of successive diffs `> 50` ms, same 30-beat floor as RMSSD |
| Rolling window | 150 s default (`DEFAULT_HRV_CYCLE_SECONDS` in `rollingHrvWindow.ts`) |
| Window inclusion | timestamps `>= now − windowMs` |
| Live phase abort | artifact **> 10%** (`PHASE_ARTIFACT_ERROR_PCT`); UI warn path also uses **5%** |
| RMSSD % for music | `round(value × 100) / 100` (2 decimal places) |

### 4.2 Phase 2 category as implemented (`getCategoryFromRmssd`)

| RMSSD (ms) | Category the app uses |
|------------|------------------------|
| `null` / not finite | Calming |
| `<= 20` | Grounding |
| `<= 35` | Calming |
| `<= 55` | Restorative |
| `> 55` | Uplifting |

**Aligned on both sides (code + SRS-ALG-002 / SVVR):**

| RMSSD (ms) | Category |
|------------|----------|
| `<= 20` | Grounding |
| `> 20` and `<= 35` | Calming |
| `> 35` and `<= 55` | Restorative |
| `> 55` | Uplifting |

Examples: **20.0 Grounding**, **20.01 Calming**. No hole at 20 / 35 / 55.

### 4.3 Switch-suppression as implemented (`musicCategoryFromRmssd`)

- First valid RMSSD: map category, allow ranking.
- Later: absolute RMSSD change **`<= 20%`** → keep previous category, do **not** reselect track.
- Change **`> 20%`** → remap category and allow ranking.

This matches the design intent (category change **and** ≥20% shift). Still not an executed PASS.

### 4.4 Per test ID

| Test ID | Title | Word-pack gate | Actual / PASS? | As-built |
|---------|-------|----------------|----------------|----------|
| TC-HRV-001 | Known RR vector — RMSSD | BLOCKED until expected value + tolerance approved | **No** | Formula and 30-beat floor exist; need Dataset A + independent calc |
| TC-HRV-002 | Known RR vector — SDNN | Same | **No** | Divisor n, 60-beat floor; need Dataset A + independent calc |
| TC-HRV-003 | Window boundary | 2.5 min inclusion rule not approved | **No** | 150 s window; `t >= tMin` |
| TC-HRV-004 | Insufficient data | General entry | Not until QA accepts criterion, then a run | RMSSD `null` if &lt; 30 clean beats |
| TC-HRV-005 | Artifact handling | General entry | Not until method is the approved one | Range + IQR + 25% correction; phase abort &gt; 10% |
| TC-HRV-006 | Missing data | General entry | Not until SRS wording signed | Invalid RMSSD → Calming or previous category |
| TC-HRV-007 | Threshold below | Aligned ≤20 / ≤35 / ≤55 | PASS | See §4.2 |
| TC-HRV-008 | Threshold equal | Equality uses ≤ | PASS | 20 Grounding, 35 Calming, 55 Restorative |
| TC-HRV-009 | Threshold above | Aligned | PASS | 20.01 Calming, 35.01 Restorative, 55.01 Uplifting |
| TC-HRV-010 | Switch-suppression | General entry | Not until a controlled run | `<= 20%` keeps category |
| TC-HRV-011 | Rounding / precision | Decimal precision not approved | **No** | Payload % uses 2 decimals; UI often `toFixed` |

---

## 5. SKT-TC-BLE-001 — Polar H10

Product has pairing, RR stream, reconnect copy, sensor-off handling, and battery % (`BleProvider`, `ble.manager.ts`, `BleConnectPanel`).

| Test ID | Title | Actual / PASS? | As-built / blocker |
|---------|-------|----------------|---------------------|
| TC-BLE-001 | Initial pairing | After Polar run on frozen build | Discover + connect exists |
| TC-BLE-002 | Wrong nearby sensor | After run | User picks a device from the scan list |
| TC-BLE-003 | RR stream acquisition | After run | RR intervals ingested with timestamps |
| TC-BLE-004 | Temporary connection loss | **Blocked** | Timeout still `[X]` in SRS; app has HR grace / stale-packet timeout, not frozen |
| TC-BLE-005 | Reconnection | After run | Reconnect path exists |
| TC-BLE-006 | Sensor powered off | After run | Error state; do not use stale RR |
| TC-BLE-007 | Low battery | After run (or N/A with QA note) | Battery Service % is shown |
| TC-BLE-008 | Malformed / missing data | **Blocked** | Needs a qualified RR fault-injection harness — none in the Trial app |
| TC-BLE-009 | Long session stability | After run | 20-minute session exists |
| TC-BLE-010 | Resume after interruption | After run | App interrupt / resume exists; confirm labelled behaviour |

---

## 6. SKT-TC-E2E-001 — End to end

| Test ID | Title | Actual / PASS? | As-built / blocker |
|---------|-------|----------------|---------------------|
| TC-E2E-001 | Authorized user starts app | After frozen build | OTP + 4-digit PIN |
| TC-E2E-002 | Create / select patient | After run | Trial patients + session IDs |
| TC-E2E-003 | Connect Polar H10 | After run | Same as BLE-001/003 |
| TC-E2E-004 | Baseline / data-quality | After run | Resting baseline + artifact / missing-vitals gates |
| TC-E2E-005 | HRV calculation | **Blocked** | Same as HRV-001/002 (no approved expected numbers) |
| TC-E2E-006 | Therapy decision | PASS | Contiguous HR then RMSSD bands + 20% switch rule |
| TC-E2E-007 | Audio playback | After run | Category-based streaming playback |
| TC-E2E-008 | Mid-session signal loss | After run | Vitals-missing / BLE loss UI |
| TC-E2E-009 | Session completion | After run | Default cap 20 minutes (`DEFAULT_SESSION_MAX_SECONDS`) |
| TC-E2E-010 | Report / store result | **Blocked** | SRS requires AES-256 **local** session store + protocol offline/sync. App uses MMKV; session payload goes to Trial API over TLS. PIN storage mentions AES. That is not the labelled at-rest control. |
| TC-E2E-011 | New patient after prior | After run | Session patient / music / discrete-band state is reset between sessions |
| TC-E2E-012 | Application restart | After run | Confirm recovery against approved spec |

---

## 7. SKT-TC-NEG-001 — Negative / fault

Expected messages are not frozen. Do not pre-fill PASS.

| Test ID | Title | Product today |
|---------|-------|----------------|
| TC-NEG-001 | App terminated during session | Partial data / restart path exists; recovery spec not frozen |
| TC-NEG-002 | Tablet power loss | No specified safe-state in app |
| TC-NEG-003 | Storage full | No dedicated warning / block |
| TC-NEG-004 | Corrupt local record | No dedicated handler |
| TC-NEG-005 | Bluetooth permission revoked | OS / BLE error path exists |
| TC-NEG-006 | Audio device removed | Playback engine can pause / fail; message not frozen |
| TC-NEG-007 | Rapid repeated taps | Session start should be single-flight; confirm on device |
| TC-NEG-008 | Invalid patient fields | Form validation exists |
| TC-NEG-009 | Date / time change | Not specified |
| TC-NEG-010 | Unsupported OS | Not specified; production target is OnePlus Pad Go / Android 14 |

---

## 8. SKT-TC-SEC-001 — Cybersecurity

Aligns with `content/skitii-trial-tablet-security.md`: app lock is not device lock.

| Test ID | Title | Product today |
|---------|-------|----------------|
| TC-SEC-001 | Role / authentication | OTP + PIN; unauthorized user cannot use clinical functions |
| TC-SEC-002 | Kiosk escape | **Not in the app.** Needs MDM Device Owner / lock-task on hospital units |
| TC-SEC-003 | Data at rest | **Not AES-256 session store.** MMKV for PIN, drafts, tokens; clinical session records are server-side |
| TC-SEC-004 | Data in transit | HTTPS to Trial / auth APIs; no certificate pinning in the app |
| TC-SEC-005 | Update control | No labelled signed-update path |
| TC-SEC-006 | Package integrity | Release APK can be hashed; QMS process not recorded here |
| TC-SEC-007 | USB / peripheral | Debug USB used in lab; production must disable via MDM |
| TC-SEC-008 | Audit / logging | Not a data-minimised security event log as specified |
| TC-SEC-009 | Default credentials | No shared default admin password; OTP + PIN |
| TC-SEC-010 | Dependency vulnerabilities | **Blocked** until production SBOM + qualified scanner + dispositions |

---

## 9. OPEN items that still block a formal run (from SKT-HARM-001)

| ID | Decision needed | Blocks |
|----|-----------------|--------|
| OPEN-01 | Phase 1 HR bands aligned in code + SRS/SVVR (≥95 / ≥85 / ≥70) | Closed for 84.5 / 94.5 / 95 |
| OPEN-02 | Phase 2 RMSSD bands aligned in code + SRS/SVVR (≤20 / ≤35 / ≤55) | Closed for 20 / 35 / 55 ms |
| OPEN-03 | Personal scoring parameters (α, bounds, exploration, min exposures) | SRS-ALG-004 / H-05 |
| OPEN-04 | Safe headphone volume limit | SRS-AUD-005 |
| OPEN-05 | Final tablet model + Android OS build | System validation (target today: OnePlus Pad Go OPD2304) |
| OPEN-06 | Polar H10 firmware + BLE library version | Interoperability baseline |
| OPEN-07 | Startup / connect / latency / storage numeric targets | Performance V&V |
| OPEN-08 | Production crypto / key management / update signing | TC-SEC-003/005/006, TC-E2E-010 |
| OPEN-09 | Final SBOM + vulnerability scan | TC-SEC-010 |
| OPEN-10 | Formal IEC 62304 software safety class | Lifecycle tailoring |
| OPEN-11 | Actual executed V&V evidence | Final SVVR / submission |

---

## 10. Suggested order of work (engineering + QA)

1. PI / Quality freeze OPEN-01 and OPEN-02 in SRS + SDS (do not reverse-approve from this note).
2. Create Dataset A / B (known RR vectors) and **independent** RMSSD / SDNN expected values + tolerances.
3. Tag a release-candidate APK; record SHA-256, tablet ID, Polar H10 FW, `react-native-ble-plx` version.
4. Execute BLE (except 004 / 008), then E2E (except 005 / 006 / 010), then HRV-004/005/006/010, then NEG/SEC items that have a spec.
5. Index evidence in SKT-LOGS-001 Annexure S. Only then fill Word Actual / PASS cells and RTM Evidence.

Until step 1–3 exist, **do not update data inside SKT-TC-HR-001 or SKT-TC-HRV-001**.

---

## 11. Code pointers

| Topic | File |
|-------|------|
| Phase 1 HR / Phase 2 RMSSD / 20% switch | `Skitii-Trials-Yenepoya-HNF-APP/src/lib/musicAnalyzer/discreteBands.ts` |
| RMSSD / SDNN / artifact preprocess | `Skitii-Trials-Yenepoya-HNF-APP/src/lib/hrv.ts` |
| 150 s window | `Skitii-Trials-Yenepoya-HNF-APP/src/lib/rollingHrvWindow.ts` |
| 20-minute session cap | `Skitii-Trials-Yenepoya-HNF-APP/src/lib/sessionPhaseConstants.ts` |
| Phase artifact 10% | `Skitii-Trials-Yenepoya-HNF-APP/src/screens/Session/vitalsMissingNav.ts` |
| BLE + battery | `Skitii-Trials-Yenepoya-HNF-APP/src/hooks/ble.manager.ts` |
| Tablet kiosk gap | `Skitii-Docs-Generation/content/skitii-trial-tablet-security.md` |
