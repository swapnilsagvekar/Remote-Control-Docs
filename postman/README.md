# Skitii Trial — Mobile Postman collection

Import into Postman (Collection + Environment):

| File | Purpose |
|------|---------|
| [`postman/skitii-trial-mobile.postman_collection.json`](./skitii-trial-mobile.postman_collection.json) | Tablet / institution APIs |
| [`postman/skitii-trial-mobile.postman_environment.json`](./skitii-trial-mobile.postman_environment.json) | Local URLs + variables |

## Prerequisites

1. Main Skitii Backend on `:3001` (GraphQL auth)
2. Trial Backend on `:3010`
3. Active trial config for the institution user (e.g. Yenepoya seed)

## Suggested order

1. **Auth (Main GraphQL)** → Send OTP → Verify OTP (saves `accessToken`)
2. **Patients — List scenarios** → List default page (saves `patientId`)
3. **Patients — CRUD** / scenario searches as needed
4. **Auth (Trial) — Forgot Device PIN** when testing PIN reset

## Collection folders

- **Auth (Main GraphQL)** — `sendOtp` / `verifyOtp`
- **Auth (Trial) — Forgot Device PIN** — `POST /auth/forgot-pin/*`
- **Patients — CRUD** — create / get / patch
- **Patients — List scenarios** — all dashboard filters (`shift`, `sessionStatus`, `weekly`, `search`, pagination, combined)
- **Patients — Scenario notes (seed SCN-*)** — searches aligned with Trial Backend seed patients
- **Offline sync (GraphQL)** — `syncTablet` first pull, incremental pull with `since`, replay of an offline `createPatient`, and the `DEVICE_NOT_REGISTERED` rejection
- **Patients — device-scoped (GraphQL)** — `listPatients` / `createPatient` limited to the `x-device-id` tablet
- **Transfers — tablet (GraphQL)** — `transferPatient`
- **Admin — devices & transfers (GraphQL)** — `adminDevices`, `adminPatients` filtered by tablet, `adminTransferPatient`, `adminPatientTransfers`, `adminTransfers`

## Offline sync variables

| Variable | Purpose |
|----------|---------|
| `deviceId` | Sent as `x-device-id`. Must be registered and active for the institution in product `physical_devices` (product admin → Devices) |
| `since` | `serverNow` from the previous `syncTablet`; the first-pull request saves it |
| `targetDeviceId` | Registered tablet to transfer a patient to |
| `institutionId` / `trialId` | Scope for the admin requests |
| `adminAccessToken` | Admin or SUPER_ADMIN JWT for the admin folder (the tablet folders use `accessToken`) |

## Notes

- Only the **Admin — devices & transfers** folder calls Admin Panel APIs; everything else is tablet/institution.
- Every Trial tablet request must send `x-device-id`; unknown or inactive tablets get `DEVICE_NOT_REGISTERED`.
- `institutionId` / `trialId` come from the JWT — not query params.
- Create patient body uses Postman dynamic timestamps; prefer `enrollmentDate` as `YYYY-MM-DD` if the API rejects ISO datetimes.
