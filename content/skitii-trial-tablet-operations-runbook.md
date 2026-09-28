# Skitii Trial — Tablet Operations Runbook
**Version:** 1.0  
**Date:** September 2026  
**Author:** Swapnil Sagvekar  
**Customer:** Yenepoya Hospital  
**Scope:** Offline sync, tablet registration and patient transfer for clinical staff and site admins

---

## 1. How the tablet works

- Every tablet saves its work on the tablet first. Enrolment, Week 0, sessions, readings and forms keep working without internet.
- Each saved change joins a queue on the tablet. When the tablet is online, it sends the queue to the server in the order the changes were made.
- The tablet syncs when internet comes back, when the app returns to the foreground, after login, and shortly after every new change.
- A patient belongs to exactly one tablet. A tablet only shows its own patients. Registration numbers must be unique on each tablet.
- The server checks every offline action against the time it happened on the tablet. Actions older than 72 hours, or more than 2 minutes in the future, are rejected. Keep tablet clocks on automatic time.

---

## 2. Before a tablet is used

1. Open the app on the tablet. If it shows **"This tablet is not registered. Ask your admin to register it."**, note the **Device ID** shown on that screen (it starts with `SKT-`).
2. A Skitii admin registers that ID for the hospital on the product admin panel: **Devices → Register device**.
3. Reopen the app. The tablet can now log in and sync.

A tablet that is later deactivated on the Devices page stops syncing immediately and shows the same screen.

---

## 3. What clinicians see

### 3.1 Sync status (sidebar, bottom)

| Status text | Meaning | What to do |
|-------------|---------|------------|
| **All data synced** | Everything on this tablet is on the server | Nothing |
| **Syncing…** | Sending changes now | Wait |
| **N changes waiting to sync** | Saved on the tablet, not yet on the server | Nothing if online; it retries automatically |
| **Offline — changes are saved on this tablet** | No internet | Keep working; it syncs when internet is back |
| **Sync paused — will retry automatically** | Temporary server or network problem | Nothing; retries back off up to 15 minutes |
| **N items failed to sync** | The server rejected some changes | Tap the status to open **Failed sync items** (section 3.3) |

Tapping the status starts a sync straight away, or opens the failed list when something failed.

### 3.2 Patient badges (dashboard)

Each patient row shows **Synced**, **Waiting to sync** or **Sync failed**.

### 3.3 Failed sync items

The screen lists each rejected change with the patient, the action (for example *Start session* or *Weekly assessment*), the time, and the reason.

- **Retry** sends one item again; **Retry all** sends every failed item again.
- Changes that depend on a failed item wait behind it and go through once it succeeds.
- Each reason is shown as the error code followed by the server's message. Common ones:
  - `DUPLICATE_REGISTRATION_NO`: another patient on this tablet has the same registration number. Fix the number, then retry.
  - `WEEK0_REQUIRED` (*Week 0 must be submitted before sessions*) or `SHIFT_WINDOW_CLOSED` (*Shift window is closed*): the action was not allowed at the time it happened on the tablet. It will keep failing; contact the Skitii team.
  - `OCCURRED_AT_INVALID` (*clientOccurredAt is older than 72 hours* or *…is in the future — check the tablet clock*): the tablet stayed offline too long, or its clock is wrong. Fix the clock and contact the Skitii team.
- Items that keep failing after a retry need admin help. Do not uninstall the app or clear its data; that deletes unsynced work.

---

## 4. Moving a patient to another tablet

### 4.1 Why transfer needs internet

The server records who owns the patient. A transfer changes that owner, and the old tablet must hand over everything it holds for the patient before it lets go. That can only happen online.

### 4.2 From the tablet

1. On the dashboard, tap **View/Edit** on the patient's row → **Transfer to tablet** (available even after Week 0 locks the profile).
2. Enter the target tablet's Device ID (`SKT-…`) and an optional reason, then confirm.
3. The tablet syncs the patient's pending changes first. The transfer is refused if:
   - the tablet is offline (*Connect to the internet to transfer a patient.*),
   - anything for the patient is still waiting or failed (*This patient has data that has not synced yet…*),
   - a session is in progress (*End the session before transferring.*),
   - the target is not registered for the hospital, or is this same tablet.
4. On success the patient disappears from this tablet. The target tablet shows the patient after its next sync.

### 4.3 From the Trial Admin panel

1. **Patients** → **Transfer** on the patient's row, or open the patient → **Transfer to tablet**.
2. Pick the target tablet from the list and add a reason. Only registered, active tablets are listed.
3. The patient view shows the **Assigned tablet** and a **Transfer history** table (date, from, to, by whom, reason).
4. The **Devices** page lists every tablet with its status, last activity and patient count. Click a tablet to see its patients.

> **Sync the old tablet before an admin transfer.** If the old tablet still has unsynced changes for the patient, those changes are discarded when it learns about the transfer. When possible, open the old tablet, confirm **All data synced**, then transfer.

---

## 5. Quick troubleshooting

| Problem | Check |
|---------|-------|
| "This tablet is not registered" | Register the Device ID on product admin → Devices, or reactivate it |
| Patient missing on a tablet | Trial Admin → patient → **Assigned tablet**. It may belong to another tablet; transfer it back if needed |
| Changes stuck on "waiting to sync" | Internet connection; open the app so the foreground sync runs |
| Transfer blocked by unsynced data | Open **Failed sync items**, fix and retry, then transfer |
| Same registration number on two tablets | Allowed; numbers are unique per tablet. Transferring into a tablet that already has that number is refused |
