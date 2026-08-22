# 03 — Build Plan

Work in phases. Each phase has a clear “done” check. Prefer physical phones; same Wi‑Fi for early streaming tests; internet before calling the project usable.

## Phase 0 — Tooling

**Do**

1. Install Android Studio (SDK, platform tools). adb already OK if present.
2. Create empty Kotlin + Compose project.
3. Add product flavors: `master`, `host`.
4. Create Git repo. Sideload with `adb install -r`.

**Done when:** both flavors install and open on two physical phones.

## Phase 1 — App shells + Magisk gate

**Host**

- UI: Host name, Host ID placeholder, status “Waiting”
- Foreground service skeleton
- Magisk/root request (libsu or equivalent); show granted/denied

**Master**

- Simple login UI (local or against stub API)
- Empty Host list
- Connect button (no-op)

**Done when:** Host obtains root grant; Master opens list screen.

## Phase 2 — Backend basics

**Server**

- Register/login Master
- Register/pair Host
- List Hosts for owner
- Host heartbeat → `online` / `lastSeenAt`
- WebSocket connect with auth token

**Done when:** Host appears **online** on Master without video.

## Phase 3 — Dynamic Hosts + access

1. Host shows pairing code or QR.
2. Master “Add Host” → pair.
3. Master rename / remove Host.
4. Master edits access flags; Host fetches policy.

**Done when:** add two Hosts; one VIEW_ONLY, one FULL_CONTROL (with audio/remoteUnlock as needed); flags persist after app restart.

## Phase 4 — Screen share (same Wi‑Fi via server)

1. Host root capture frames.
2. Relay through server (or temporary direct only for debug — prefer server).
3. Master renders frames.
4. Target: ~480p, 5–10 fps, JPEG OK.

**Done when:** Master sees unlocked Host screen live for several minutes.

## Phase 5 — Remote control + stopApps + appLock

1. Master maps touches to normalized or pixel coordinates.
2. Host injects tap/scroll if `remoteControl=true`.
3. Host **ignores** input if `remoteControl=false`.
4. `stopApps` (v1 must): Master sends package name(s); Host force-stops when flag true.
5. `appLock` (v1 must): Master configures locked/blocked package list; Host enforces when flag true (block launch / re-lock as designed).

**Done when:** FULL_CONTROL Host is controllable; VIEW_ONLY Host is not; stopApps and appLock work when flags are on.

## Phase 6 — Internet + on-demand stream

1. Point apps at public HTTPS/WSS URL.
2. Test Master on mobile data, Host on home Wi‑Fi.
3. FCM (or equivalent): Connect → wake Host → start capture.
4. Disconnect → stop capture; heartbeat remains.

**Done when:** cross-network session works ~20 minutes; reconnect works.

## Phase 7 — System audio (v1 must)

1. Host: root capture of system/internal audio (document approach).
2. Stream with video via server relay.
3. Master: play audio; basic A/V sync tolerance.
4. Enforce `access.audio` — no audio path when false.
5. Do not silently fall back to microphone-only without labeling it.

**Done when:** YouTube (or similar) on Host is audible on Master with `audio=true`.

## Phase 8 — Master unlocks Host device (v1 must)

1. Host setup: store unlock credential in Android Keystore / encrypted storage (PIN/password/pattern as supported).
2. Access flag `remoteUnlock` (enable on Hosts where Master must unlock the device).
3. Master UI: clear **Unlock device** action when Host reports locked.
4. Host: wake display + inject unlock via root only if flag true.
5. After unlock, normal screen/control/audio/stopApps/appLock session continues.
6. Document risk: stolen Master session can unlock Host device.

**Done when:** Master can unlock a locked Host (flag on) and then use the device without anyone tapping the Host.

## Phase 9 — Harden

- TLS, strong passwords, session timeout
- Live-session indicator on Host
- AWS billing alarm
- Document Magisk install for each Host model
- Confirm Device Owner not used; app lock/uninstall via Magisk control when needed

## Suggested calendar

| Week | Focus |
|------|-------|
| 1 | Phase 0–1 |
| 2 | Phase 2–3 |
| 3–4 | Phase 4 |
| 5 | Phase 5 |
| 6 | Phase 6 |
| 7 | Phase 7–8 |
| 8 | Phase 9 |

## Test matrix

| Test | Network | Host state | Access | Expect |
|------|---------|------------|--------|--------|
| Online list | any | app running | — | online badge |
| View | same Wi‑Fi | unlocked | VIEW_ONLY | video; no inject |
| Control | same Wi‑Fi | unlocked | FULL_CONTROL | taps work |
| Stop apps | any | unlocked | stopApps=true | package force-stopped |
| App lock | any | unlocked | appLock=true | locked apps cannot be used as designed |
| Audio | any | unlocked | audio=true | Master hears Host app audio |
| Unlock | any | locked | remoteUnlock=true | **Master unlocks Host device**; then session works |
| Locked denied | any | locked | remoteUnlock=false | lock/black; no unlock |
| Internet | different nets | unlocked | FULL_CONTROL | video + taps (+ audio if on) |
| Auth fail | any | — | — | rejected |

## First milestone (celebrate)

Master sees one Host online → Connect → **live screen** (same Wi‑Fi via server).

After that milestone: add control, then internet, then **audio** and **remote unlock**. Do not start WebRTC before those are stable.
