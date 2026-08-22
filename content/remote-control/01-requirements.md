# 01 — Requirements

## Goal

Build a **custom Android remote assistance app** so one **Master** phone can connect to **many Host** phones over the internet (different cities), with:

- Screen share (see Host screen)
- Optional remote control (tap / scroll) when access allows
- **Master can unlock the Host device** (lock screen) when `remoteUnlock` is enabled
- Minimal Host-side interaction after one-time setup (Magisk path = no per-session Allow dialog)
- Dynamic Hosts and dynamic access (not hard-coded device lists)

Owner installs and configures each Host. Master connects when needed (~20 minutes/day typical).

## Roles

| Role | Device | Magisk | Responsibility |
|------|--------|--------|----------------|
| **Master** | Controller phone | Not required | Login, Host list, connect, view, control, **unlock device**, stop/lock apps, hear audio (per flags) |
| **Host** | Controlled phone(s) | Required for silent capture + inject | Run background service, stream, apply access policy |

Devices are authorized by the account owner. Not a public Play Store product for v1.

## Core features (must)

1. **Custom app** (Kotlin) — Master + Host modes (flavors or in-app role). Not AnyDesk/TeamViewer.
2. **1 Master → many Hosts** — add / remove / rename Hosts anytime.
3. **Dynamic access** per Host (server-backed), e.g.:
   - `screenShare`
   - `remoteControl`
   - `stopApps` (v1 must when enabled — e.g. force-stop YouTube / packages)
   - `appLock` (v1 must when enabled — block or lock selected apps)
   - `audio` (v1 must when enabled for that Host)
   - `remoteUnlock` (v1 must when enabled for that Host — high risk)
4. **Internet** — works across cities (not same Wi‑Fi only). Same Wi‑Fi allowed for early testing.
5. **Host online presence** — heartbeat; Master sees online/offline.
6. **Pairing** — code or QR; Host linked to Master account only.
7. **Auth** — Master login; sessions rejected without valid token.
8. **Magisk on Host** — root grant only to Host app; silent screen capture + input inject when policy allows.
9. **Foreground service** on Host + start-on-boot (or clear restart instructions).
10. **Connect-on-demand streaming** — capture/stream starts when Master connects (e.g. FCM wake); stops after disconnect. Cheap always-on server stays up (do not start/stop VM every session for v1).
11. **System audio stream** — Host app/system sound (e.g. YouTube) playable on Master when `audio` is enabled.
12. **Master unlocks Host device** — When Host screen is locked and `remoteUnlock` is enabled, Master taps Unlock; Host wakes and unlocks lock screen (PIN/password/pattern via Magisk/root). Credential stored only on Host, encrypted; never in Master APK plaintext. After unlock, Master can view/control/audio as other flags allow.

## Example access profiles (not hard-coded)

| Example profile | Intended access |
|-----------------|-----------------|
| Host A | `FULL_CONTROL`: screen + remote control + audio + remote unlock + stop apps + app lock |
| Host B | `VIEW_ONLY`: screen share only (no control, unlock, stopApps, appLock, or required audio) |
| Host C | `VIEW_ONLY`: screen share only |

Profiles are settings on each Host record. Any new phone can be added with any profile.

With Magisk **FULL_CONTROL**, Master can already open Settings, lock/stop apps, uninstall apps, etc. via remote UI — **Device Owner / MDM is not required**. `stopApps` and `appLock` are first-class Host features (not “optional later”).

## Later / optional (not v1)

- **WebRTC + TURN** — lower latency than server relay. Not required for v1; relay is enough for ~20 min/day. (WebRTC = phones try direct media; TURN = fallback relay when direct fails.)
- Multi-Master — out of scope

## Non-goals

- Rebuilding Magisk or a Magisk clone
- Play Store listing for v1
- iOS
- Zero-server P2P only (unreliable across cities)
- Unauthenticated open Hosts on the internet
- React Native / Flutter for Host root capture and inject core
- Perfect commercial AnyDesk parity in v1
- Device Owner / MDM lockdown (not needed; Magisk full control covers app lock / uninstall / settings)
- Multi-Master
- WebRTC + TURN in v1 (optional later only)

## Lock screen behavior

| State | Expected |
|-------|----------|
| Host unlocked | Full screen share (+ control / audio if allowed) |
| Host locked, `remoteUnlock=false` | Lock screen or black; Master may wake screen only |
| Host locked, `remoteUnlock=true` | Master can unlock (PIN/password/pattern credential configured on Host) then use session |

## Tech constraints

| Area | Choice |
|------|--------|
| Language | Kotlin |
| UI | Jetpack Compose (preferred) |
| IDE | Android Studio required to build/run; Cursor optional for editing |
| Testing | Physical phones (Magisk Host + Master). Emulator insufficient for root path |
| Install | Sideload APK via adb |
| Backend | Small always-on VPS (e.g. AWS Lightsail ~$5–10/mo) |
| Usage budget | ~20 min/day → roughly $5–15/mo AWS all-in |

## Acceptance criteria (v1)

- [ ] Master can add a Host via code/QR and see it in a list
- [ ] Master sees Host online/offline
- [ ] Master connects over internet and sees Host screen (unlocked Host)
- [ ] When `remoteControl=true`, Master tap/scroll controls Host
- [ ] When `remoteControl=false`, Master cannot control Host (view only)
- [ ] When `audio=true`, Master hears Host system/app audio (e.g. YouTube)
- [ ] When `remoteUnlock=true`, **Master can unlock the locked Host device** and then control/view
- [ ] When `stopApps=true`, Master can force-stop selected packages on Host
- [ ] When `appLock=true`, Master can lock/block selected apps on Host
- [ ] Access flags changeable without reinstalling Host app
- [ ] Unauthenticated connect rejected
- [ ] Host can be removed from Master account
- [ ] Magisk root used only on Host; Master has no Magisk requirement
- [ ] No per-session MediaProjection Allow on Magisk Host path

## Glossary

- **Master** — controller / viewer phone
- **Host** — controlled / shared phone
- **Magisk** — free open-source root tool (official GitHub only); not a Play Store app
- **Silent control** — no system Allow dialog each session (requires root on Host)
