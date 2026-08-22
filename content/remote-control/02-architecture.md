# 02 — Architecture

## High-level

```text
Master app (no Magisk)
        │
        │  HTTPS + WSS (auth)
        ▼
┌───────────────────────────┐
│  Backend (always-on)      │
│  - REST API               │
│  - WebSocket signaling    │
│  - Media/input relay (v1) │
│  - DB: users, hosts       │
└───────────────────────────┘
        │
        │  HTTPS + WSS
        ▼
Host app (Magisk root)
  - Heartbeat / online
  - Screen capture (root)
  - Input inject (root) if policy allows
  - Applies access flags from server
```

Real use: Host and Master on **any** networks (home Wi‑Fi, mobile data, different cities).  
Early test: same Wi‑Fi is fine; still prefer going through the server so the internet path is ready.

## App structure

Single Android project with two flavors (recommended):

| Flavor | Package / applicationId suffix | Magisk |
|--------|--------------------------------|--------|
| `master` | `.master` | No |
| `host` | `.host` | Yes |

Alternative: one APK with “This device is Master / Host” — flavors are cleaner for permissions and Play-like separation later.

### Master responsibilities

- Login / session token
- List Hosts (name, id, online, access summary)
- Add Host (code/QR), rename, remove, edit access
- Connect → show video surface
- **Unlock Host device** when locked and `remoteUnlock` is enabled
- Map touch to Host coordinates when `remoteControl` allowed
- stopApps / appLock / audio controls when those flags allowed
- Disconnect / idle timeout

### Host responsibilities

- Pair to Master account
- Request Magisk root once; refuse to stream without root (v1 Magisk path)
- Foreground service + boot receiver (or documented restart)
- Heartbeat to server
- On connect (push or WS command): start capture + send frames
- Apply input only if server policy says `remoteControl`
- On disconnect: stop capture (keep lightweight heartbeat)

## Magisk vs app

```text
┌─────────────────────────────┐
│  Your Host APK (Kotlin)     │  ← you build this
├─────────────────────────────┤
│  Android sandbox            │
├─────────────────────────────┤
│  Magisk (boot / root)       │  ← existing tool; do not rebuild
└─────────────────────────────┘
```

Magisk unlocks root. Your app uses root (e.g. libsu) for:

- Screen frames without MediaProjection Allow dialog
- Touch/scroll inject without Accessibility prompts

Master never needs Magisk.

## Access model

Server is source of truth. Host caches last policy and refreshes on connect/heartbeat.

```json
{
  "hostId": "h_abc123",
  "name": "Host-A",
  "access": {
    "screenShare": true,
    "remoteControl": true,
    "stopApps": true,
    "appLock": true,
    "audio": true,
    "remoteUnlock": true
  }
}
```

Convenience presets (UI only):

- `VIEW_ONLY` → screenShare true; remoteControl / audio / remoteUnlock false  
- `FULL_CONTROL` → screenShare + remoteControl true; audio / remoteUnlock / stopApps / appLock as chosen (all are v1 features, not deferred)  

## Data model (minimal)

### User (Master account)

- `id`, `email` or username, `passwordHash`, `createdAt`

### Host

- `id`, `ownerUserId`, `name`, `pairingSecret` / device token
- `access` (JSON flags)
- `fcmToken` (optional)
- `lastSeenAt`, `online`
- `createdAt`
- Unlock credential: **Host-local only** (Android Keystore / encrypted prefs). Server stores `remoteUnlock` flag, not the PIN.

### Session (optional table)

- `id`, `hostId`, `masterUserId`, `startedAt`, `endedAt`, `status`

## Networking

### v1 (required): relay through server

- Host uploads frames (+ audio if enabled) → server → Master  
- Master sends input / unlock commands → server → Host  
- Simpler than WebRTC; more bandwidth on VPS  
- Fine for ~20 min/day at 480p / low fps  

### Later (optional): WebRTC + TURN

Not in v1. For lower latency later:

- **WebRTC** — Master and Host try a direct media path (like a call)  
- **TURN** — fallback relay when firewalls/NAT block direct path  

v1 server relay is enough until latency becomes a problem.

### Discovery

- No LAN-only discovery for production  
- Hosts register to account; Master lists by `ownerUserId`  

### Push wake

- Master taps Connect → server sends FCM to Host → Host starts stream service  
- Avoids 24/7 heavy capture  

## Screen + input + audio pipeline (Host)

1. Root capture → bitmap/frames (target 5–10 fps, ~480p for v1)  
2. Encode JPEG (v1) or H.264 (later)  
3. If `audio`: capture system/internal audio (root); encode Opus/AAC; mux or parallel stream  
4. Send over WSS binary (preferred) via server relay  
5. Receive input events `{ type: tap|swipe, x, y, ... }`  
6. Scale coordinates to Host display size  
7. Inject via root (`input` / uinput) only if `remoteControl`  
8. If `remoteUnlock`: accept unlock command; inject credential via root only when flag true  

## Lock screen

- Unlocked: normal stream (+ audio if enabled)  
- Locked + `remoteUnlock=false`: lock UI or black; optional `wakeScreen` only  
- Locked + `remoteUnlock=true`: Master sends unlock → Host unlocks with stored credential → then full session  

## Server deployment sketch

| Component | Suggestion |
|-----------|------------|
| Runtime | Node (Nest/Express) or Go — team preference |
| Process | systemd / Docker on Lightsail |
| TLS | HTTPS + WSS (Caddy/nginx or cloud cert) |
| DB | SQLite (tiny) or Postgres |
| Cost | Always-on ~$5–10/mo; billing alarm at $5/$10 |

Do **not** design v1 around starting/stopping the VM from the APK (cold start + secret handling). Keep server always on; start **stream** on demand.

## Security boundaries

- TLS everywhere  
- Host accepts commands only with valid device token for that Host  
- Master only sees Hosts for `ownerUserId`  
- Magisk grant only to Host app  
- Unlock PIN/pattern stored **on Host only**, encrypted; enable `remoteUnlock` only on Hosts that need it  
- Compromised Master account ≈ unlock + full control on those Hosts — strong Master auth required  
- No Device Owner required: Magisk full control covers settings / app lock / uninstall via remote UI