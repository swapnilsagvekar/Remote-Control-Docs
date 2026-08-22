# 05 — Security and Operations

## Magisk

- Magisk is **free** and open source. Install only from the **official GitHub** releases.
- Magisk is **not** a Play Store app. Fake “Magisk” APKs are often malware.
- Magisk alone does **not** put the phone on the open internet for remote control.
- Risk rises when: fake tools, root granted to unknown apps, or a remote Host service with weak/no auth.

**Host policy**

- Grant Magisk root **only** to your Host app.
- Master phone: **no Magisk**.

## Auth and remote risk

Anyone who can authenticate as Master (or talk to an open Host) can see and possibly control that phone.

**Required**

- Strong Master password or equivalent
- TLS (HTTPS / WSS)
- Host device token; Host only accepts commands for its own id
- Master only lists Hosts owned by that account
- Reject unauthenticated WebSocket/API calls

**Recommended**

- Session timeout / idle disconnect (~20–30 min matches usage)
- Live-session indicator on Host UI/notification
- Ability to revoke a Host from Master (delete + invalidate token)
- Billing / spend alarm on cloud account

**Avoid in v1**

- Putting long-lived AWS access keys inside the APK
- Starting/stopping cloud VMs from the client (complex + secret sprawl)
- Storing unlock PIN on the **server** or in Master app plaintext

## Lock screen

| Scenario | Behavior |
|----------|----------|
| Unlocked Host | Screen share (+ control / audio if allowed) works |
| Locked, `remoteUnlock=false` | Lock screen or black; optional wake only |
| Locked, `remoteUnlock=true` | **Master unlocks the Host device** via Host-local credential + root inject |

**Remote unlock security**

- Credential lives **on Host only** (Keystore / encrypted prefs)
- Flag `remoteUnlock` is per-Host; default off for view-only Hosts
- Strong Master auth required — compromise unlocks those Hosts
- Prefer enabling unlock only on Hosts that need unattended access

## Access profiles (ops)

Configure per Host on the server/Master UI — examples only:

| Profile | Flags |
|---------|--------|
| View only | screenShare on; remoteControl / audio / remoteUnlock off |
| Full control | screenShare + remoteControl; audio / remoteUnlock / stopApps / appLock as needed (all v1) |

Device Owner / MDM is **not** required. Magisk full control can lock apps, change settings, uninstall, etc. via the remote session.

Changing flags should not require reinstalling the Host APK.

## AWS / server cost (guidance)

Usage assumption: **~20 minutes/day** screen share.

| Item | Rough monthly |
|------|----------------|
| Lightsail / small always-on VM | $5–10 |
| Egress for ~10 hours/month low-bitrate video | ~$1–3 |
| **Total ballpark** | **$5–15** |

Tips:

- Prefer 480p / low fps for assistance sessions
- Keep server always on; start **stream** on Connect only
- Set billing alerts at $5 and $10

Free tiers exist for experiments; video relay can exceed free limits — fine for learning, not a promise for daily production use.

## Testing ops

| Phase | Network | Notes |
|-------|---------|--------|
| Early video | Same Wi‑Fi OK | Still use server URL if possible |
| Production-like | Different networks / mobile data | Required before “done” |
| Install | `adb install -r` | USB debugging on devices |
| Magisk Host | Physical device only | Emulator not a substitute |

ADB is for **developer install/debug only**. Day-to-day use does not need adb or same Wi‑Fi.

## Incident basics

If a Master password may be leaked:

1. Change Master password / rotate tokens server-side  
2. Remove or re-pair all Hosts  
3. Revoke FCM/device tokens  
4. Review Magisk: ensure only Host app has root  

If a Host phone is lost:

1. Delete Host from account (server revoke)  
2. If possible, remote wipe via Google account  
3. Assume device may be unlocked by finder if no strong screen lock  

## Consent and transparency

- Screen share and control are sensitive. Prefer **view-only** unless control is needed.
- Inform Host users when view or control access is enabled.
- Show a clear “Session active” state on Host when Master is connected.
