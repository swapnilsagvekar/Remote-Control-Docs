# 04 — Agent Prompts

Copy a prompt below into another AI agent (Cursor, etc.). Always attach or point to:

- `content/remote-control/01-requirements.md`
- `content/remote-control/02-architecture.md`
- Relevant phase in `03-build-plan.md`
- `05-security-and-ops.md` for auth/network work

**Global rules for every agent**

- Kotlin Android app: Master (no Magisk) + Host (Magisk).
- Do not rebuild Magisk. Do not use Device Owner for v1.
- Do not use React Native for Host capture/inject.
- Hosts and access are dynamic (server-backed). Do not hard-code Host names or access maps.
- v1 includes system audio, remote unlock, stopApps, and appLock (feature flags). No Device Owner. No WebRTC in v1 unless asked.
- Prefer small, phase-scoped PRs. Physical device testing.
- Never commit secrets, Host PINs, or AWS keys in the APK. Unlock credentials stay on Host only.

---

## Prompt A — Scaffold Android project

```text
Read remote-control docs 01-requirements and 02-architecture.

Create a new Kotlin Android project (Compose) with product flavors:
- master (applicationId suffix .master)
- host (applicationId suffix .host)

Add:
- Minimal Master screen: login placeholder, empty host list, Connect button
- Minimal Host screen: status Waiting, Host name field
- Host foreground service skeleton + notification channel
- Shared module or common package for API models (Host, AccessFlags)

Do not implement Magisk, video, or backend yet.
Follow Phase 0–1 of 03-build-plan.
```

---

## Prompt B — Magisk / root gate on Host

```text
Read remote-control 01, 02, and 05 (security).

On the Host flavor only:
- Integrate a maintained root library (e.g. libsu)
- On start, request root; show Granted / Denied in UI
- Gate streaming APIs behind root granted
- Document that Magisk must be installed from official GitHub only

Master flavor must not request root.
No screen capture implementation yet beyond a stub function that checks root.
```

---

## Prompt C — Backend API + WebSocket

```text
Read remote-control 01–02 and Phase 2 of 03-build-plan.

Build a small backend (Node/Nest or Express is fine) with:
- Master register/login → JWT
- Host register/pair with one-time code
- GET /hosts for owner (id, name, online, access flags)
- PATCH /hosts/:id access flags and name
- DELETE /hosts/:id
- Host heartbeat POST every 15–30s
- Authenticated WebSocket for signaling

Use Postgres or SQLite. TLS assumed at reverse proxy.
Provide .env.example without real secrets.
No video relay binary protocol yet — text signaling events only:
host.online, session.request, session.accept, session.end
```

---

## Prompt D — Pairing + dynamic access UI

```text
Read remote-control Phase 3.

Implement:
- Host displays rotating or static pairing code
- Master Add Host flow
- Master Host detail: rename, remove, toggle access flags
  (screenShare, remoteControl, stopApps, appLock, audio, remoteUnlock)
- Presets VIEW_ONLY and FULL_CONTROL that set flags
- Host polls or receives WS update for policy; caches locally

Enforce: Master UI hides control / unlock / audio chrome when those flags are false.
```

---

## Prompt E — Root screen capture + Master viewer

```text
Read remote-control Phase 4 and architecture screen pipeline.

Implement v1 screen share:
- Host: root-based frame capture (document approach used)
- Encode JPEG ~480p, 5–10 fps
- Send frames over authenticated WebSocket via server relay
- Master: render latest frame on a full-screen surface

Constraints:
- Magisk Host path only (no MediaProjection Allow dialog requirement)
- Same Wi‑Fi or internet both OK if using public server URL
- Stop capture on session end

Do not implement touch inject in this task.
```

---

## Prompt F — Remote control + policy enforcement

```text
Read remote-control Phase 5.

Implement:
- Master: touch on video → send tap/swipe events with coordinates
- Scale correctly for Host resolution / letterboxing
- Host: inject via root only if access.remoteControl == true
- If false, ignore input and log
- stopApps / appLock: implement in Prompt F2 (v1 must) — do not skip as optional

Add tests or manual test checklist for VIEW_ONLY vs FULL_CONTROL.
```

---

## Prompt F2 — stopApps + appLock (v1 must)

```text
Read remote-control Phase 5 and requirements (stopApps and appLock are v1 must, not optional).

Implement:
- stopApps: Master UI to force-stop packages; Host executes via root when access.stopApps == true
- appLock: Master configures package block/lock list; Host enforces when access.appLock == true
- Ignore both when flags are false
- Persist lock list on Host; sync from server policy when possible

Add manual test checklist for both flags on/off.
```

---

## Prompt G — FCM wake + internet hardening

```text
Read remote-control Phase 6 and 05-security-and-ops.

Implement on-demand streaming:
- Master Connect → server → FCM data message to Host
- Host wakes service, starts capture, joins session
- Disconnect stops capture; heartbeat continues
- Point apps at production HTTPS/WSS base URL via BuildConfig

Keep AWS/Lightsail server always on. Do NOT start/stop EC2 from the APK.
Add idle session timeout (e.g. 30 min).
```

---

## Prompt H — System audio (v1)

```text
Read remote-control Phase 7 and requirements (audio is v1 must).

Implement:
- Host: capture system/internal audio with root where possible
- Stream alongside video via server relay
- Master: play audio with basic A/V sync tolerance
- Feature flag access.audio must be true

If platform limitations block clean app audio, document limitation; do not fake with microphone-only without labeling it.
```

---

## Prompt H2 — Master unlocks Host device (v1)

```text
Read remote-control Phase 8 and 05-security-and-ops (remote unlock).

Requirement: Master can unlock the Host device when the screen is locked.

Implement:
- Host setup UI to store unlock credential in Android Keystore / encrypted storage
- access.remoteUnlock flag from server
- Master "Unlock device" action when Host is locked
- Host: wake + root inject unlock only if flag true
- Never send raw PIN to server logs; never store PIN in Master APK

Document security risk if Master account is compromised.
```

---

## Prompt I — Docs / handoff update

```text
Update remote-control docs to match what was actually implemented
(APIs, package names, how to run server, adb install commands).
Keep agent prompts in sync. Do not invent features not in the repo.
```

---

## Prompt J — Full context bootstrap (new chat)

```text
You are building a Master→many Hosts Android remote-control system.

Read all docs under content/remote-control/ in Skitii-Docs-Generation:
README, 01-requirements, 02-architecture, 03-build-plan, 04-agent-prompts, 05-security-and-ops.

Summary constraints:
- Kotlin Master + Host flavors
- Magisk on Host only for silent screen + input
- Dynamic hosts and dynamic access flags
- v1 must include system audio, remote unlock, stopApps, and appLock (per-Host flags)
- No Device Owner / MDM; Magisk full control is enough for app lock/uninstall/settings
- No WebRTC/TURN in v1 (server relay only); no Multi-Master
- Small always-on relay server; ~20 min/day usage
- Physical device testing; sideload APKs
- No Magisk clone, no RN Host core

Ask which phase to implement next, then implement only that phase.
```
