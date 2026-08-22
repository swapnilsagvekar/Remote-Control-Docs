# Remote Control — Documentation Index

Android project: **1 Master → many Hosts** remote screen share and optional remote control (different networks / cities). Master can **unlock the Host device**, stream audio, stop/lock apps (per flags). Custom Kotlin app + Magisk on Hosts. Not a Skitii clinical product.

## Docs in this folder

| Doc | Purpose |
|-----|---------|
| [01-requirements.md](./01-requirements.md) | What to build (goals, features, non-goals, acceptance criteria) |
| [02-architecture.md](./02-architecture.md) | Master / Host / Magisk / server, data model, networking |
| [03-build-plan.md](./03-build-plan.md) | Phased how-to-build and test order |
| [04-agent-prompts.md](./04-agent-prompts.md) | Copy-paste prompts for other AI agents |
| [05-security-and-ops.md](./05-security-and-ops.md) | Auth, Magisk risk, AWS cost, lock screen, ops |

## Quick summary

- **Master phone:** normal Android app (no Magisk). Lists Hosts, connects, views screen, can **unlock Host device**, send taps, stop/lock apps, play Host audio (per flags).
- **Host phones:** Magisk + Host app. Silent screen capture + input inject + unlock/audio/stop/lock. Dynamic add/remove.
- **Access:** per-Host and dynamic (`VIEW_ONLY` vs `FULL_CONTROL` + flags: `audio`, `remoteUnlock`, `stopApps`, `appLock`).
- **v1 includes:** system audio, **Master unlocks locked Host**, stop apps, and app lock (when flags enabled).
- **Network:** small always-on **relay** server (e.g. AWS Lightsail ~$5–10/mo). ~20 min/day usage. WebRTC optional later.
- **Stack:** Kotlin, Android Studio, physical device testing. Sideload APKs (no Play Store for v1).

## How to use with agents

1. Give the agent [01-requirements.md](./01-requirements.md) + [02-architecture.md](./02-architecture.md) as context.
2. Pick a phase from [03-build-plan.md](./03-build-plan.md).
3. Paste the matching prompt from [04-agent-prompts.md](./04-agent-prompts.md).
4. Keep [05-security-and-ops.md](./05-security-and-ops.md) in scope for any auth/network work.

## Out of scope reminders

- Do not rebuild Magisk.
- Do not use Device Owner / MDM (not needed with Magisk full control).
- Do not use React Native for Host root core.
- Do not build WebRTC/TURN in v1 unless asked (relay is enough).
- No Multi-Master.
- Host display names are labels only — access profiles are not hard-coded to specific devices.
