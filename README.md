# Skitii Music Ranking Docs

Standalone project for the **Music Ranking & Category Guide** (markdown source + PDF build).

## Structure

- `content/` — guide markdown source
- `assets/` — CSS, Mermaid diagrams, Puppeteer config, resize script
- `scripts/` — PDF build script
- `output/` — generated HTML, PNG diagrams, and PDF
- `postman/` — Postman collections (Trial mobile API, etc.)

### Station / Pi runbooks

- [`content/skitii-desktop-ble-pi-setup.md`](./content/skitii-desktop-ble-pi-setup.md) — Raspberry Pi 5 kiosk setup (Skitii Desktop BLE): build, kiosk scripts, splash/Plymouth, EEPROM, ops cheatsheet. Companion scripts live in `Skitii-Desktop-Ble/scripts/`.

### Trial tablet security

- [`content/skitii-trial-tablet-security.md`](./content/skitii-trial-tablet-security.md) — Yenepoya dedicated OnePlus Pad Go lockdown (MDM kiosk, app hardening, lost-tablet revoke).

### Remote control

- [`content/remote-control/`](./content/remote-control/) — Master→many Hosts Android remote assist (requirements, architecture, build plan, **agent prompts**, security/ops). Not a Skitii clinical product.

## Build

```bash
npm install

# Music Ranking & Category Guide
npm run build

# EU GDPR Compliance Review
npm run build:compliance

# Applied AI Learning Roadmap
npm run build:ai-roadmap

# Raspberry Pi station setup (Desktop BLE kiosk)
npm run build:pi-setup

# Yenepoya dedicated tablet security (kiosk / MDM)
npm run build:tablet-security

# Remote control Master→Hosts (requirements + agent prompts)
npm run build:remote-control
```

Outputs:

- `output/music-ranking-guide.pdf`
- `output/eu-gdpr-compliance-review.pdf`
- `output/Applied_AI_Learning_Roadmap.pdf`
- `output/Skitii_Desktop_BLE_Pi_Station_Setup.pdf`
- `output/Skitii_Trial_Yenepoya_Tablet_Security.pdf`
- `output/Remote_Control_Master_Hosts.pdf`

## Postman (Trial mobile)

See [`postman/README.md`](./postman/README.md) — import:

- `postman/skitii-trial-mobile.postman_collection.json`
- `postman/skitii-trial-mobile.postman_environment.json`

## Requirements

- Node.js 20+
- Python 3 with Pillow (`pip install pillow`)
