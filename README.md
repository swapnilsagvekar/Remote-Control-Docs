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

### Trial Admin panel design

- [`content/skitii-trial-admin-panel-design.md`](./content/skitii-trial-admin-panel-design.md) — Leadership overview of Trial Admin sidebar modules (Dashboard, Setup, Operations, Analytics, Music) with diagrams in `assets/admin-panel/`. Patient module wireframes in `assets/admin-panel/patients/`. PDF: `npm run build:admin-panel-design` → `output/Skitii_Trial_Admin_Panel_Design.pdf`.
- [`content/skitii-trial-admin-presentation.md`](./content/skitii-trial-admin-presentation.md) — Simple-language Trial Admin documentation with real screenshots in `assets/admin-panel/presentation/`. PDF: `npm run build:admin-panel-presentation` → `output/Skitii_Trial_Admin_Panel_Documentation.pdf`.

### Unified navigation & user management

- [`content/skitii-admin-unified-nav-user-management.md`](./content/skitii-admin-unified-nav-user-management.md) — One DB-driven sidebar for Product + Trial Admin, user/role permissions, cross-domain login, Trial slim nav (no Institutions/Music). Diagrams and wireframes in `assets/admin-nav/`. PDF: `npm run build:admin-nav-docs` → `output/Skitii_Admin_Unified_Nav_User_Management.pdf`.

### Product Admin RBAC panel design

- [`content/skitii-admin-rbac-panel-design.md`](./content/skitii-admin-rbac-panel-design.md) — Leadership/engineering design for Users, Roles, **dynamic Modules & Actions** (Super Admin CRUD). Wireframes and ER in `assets/admin-rbac/`. PDF: `npm run build:admin-rbac-panel-design` → `output/Skitii_Admin_RBAC_Panel_Design.pdf`.

### Trial task lists

- [`content/skitii-trial-15day-tasks.md`](./content/skitii-trial-15day-tasks.md) — 18-day plan: schema + Mobile App APIs + Admin Panel Backend APIs. PDF: `npm run build:15day-tasks` → `output/Skitii_Trial_18Day_Task_List.pdf`.
- [`content/skitii-trial-admin-8day-tasks.md`](./content/skitii-trial-admin-8day-tasks.md) — 8-day sprint: Trial Admin Panel frontend wired to Trial Backend admin GraphQL. PDF: `npm run build:8day-admin-tasks` → `output/Skitii_Trial_Admin_8Day_Task_List.pdf`.
- [`content/skitii-trial-offline-sync-tasks.md`](./content/skitii-trial-offline-sync-tasks.md) — Offline-first tablet sync, device-assigned patients, transfer (Mobile App + Backend + Admin). PDF: `npm run build:offline-sync-tasks` → `output/Skitii_Trial_Offline_Sync_Task_List.pdf`.
- [`content/skitii-admin-rbac-7day-tasks.md`](./content/skitii-admin-rbac-7day-tasks.md) — 7-day sprint: user management, roles & module permissions, common sidebar (Product + Trial Admin), audit history. PDF: `npm run build:7day-rbac-tasks` → `output/Skitii_Admin_RBAC_7Day_Task_List.pdf`.
- [`content/skitii-admin-rbac-10day-tasks.md`](./content/skitii-admin-rbac-10day-tasks.md) — 10-day sprint (Product Admin + Backend only): users, roles, permission-aware sidebar. PDF: `npm run build:10day-rbac-tasks` → `output/Skitii_Admin_RBAC_10Day_Task_List.pdf`.
- [`content/skitii-admin-audit-4day-tasks.md`](./content/skitii-admin-audit-4day-tasks.md) — 4-day sprint (Product Admin + Backend): append-only audit log. PDF: `npm run build:4day-audit-tasks` → `output/Skitii_Admin_Audit_4Day_Task_List.pdf`.

### Remote control

- [`content/remote-control/`](./content/remote-control/) — Master→many Hosts Android remote assist (requirements, architecture, build plan, **agent prompts**, security/ops). Not a Skitii clinical product.

### Problem statement (team onboarding)

- [`content/skitii-problem-statement.md`](./content/skitii-problem-statement.md) — Why Skitii exists, the problem we solve, and what the platform is for. PDF: `npm run build:problem-statement` → `output/Skitii_Problem_Statement.pdf`.
- [`content/skitii-problem-statement-hi.md`](./content/skitii-problem-statement-hi.md) — Hindi version (same content). PDF: `npm run build:problem-statement-hi` → `output/Skitii_Problem_Statement_Hindi.pdf`.

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

# Trial Admin panel design (leadership overview)
npm run build:admin-panel-design

# Trial Admin panel documentation (simple overview + screenshots)
npm run build:admin-panel-presentation

# Unified nav + user management (Product & Trial Admin)
npm run build:admin-nav-docs

# Product Admin RBAC panel design (Users / Roles / Modules / Actions)
npm run build:admin-rbac-panel-design

# Trial Admin Panel — 8-day task list
npm run build:8day-admin-tasks

# User management / RBAC / audit — 7-day task list
npm run build:7day-rbac-tasks

# Product Admin RBAC — 10-day task list
npm run build:10day-rbac-tasks

# Product Admin audit log — 4-day task list
npm run build:4day-audit-tasks

# Remote control Master→Hosts (requirements + agent prompts)
npm run build:remote-control

# Problem statement (team onboarding)
npm run build:problem-statement

# Problem statement — Hindi
npm run build:problem-statement-hi

# Trial offline sync — full task list (Mobile + Backend + Admin)
npm run build:offline-sync-tasks
```

Outputs:

- `output/music-ranking-guide.pdf`
- `output/eu-gdpr-compliance-review.pdf`
- `output/Applied_AI_Learning_Roadmap.pdf`
- `output/Skitii_Desktop_BLE_Pi_Station_Setup.pdf`
- `output/Skitii_Trial_Yenepoya_Tablet_Security.pdf`
- `output/Skitii_Trial_Admin_Panel_Design.pdf`
- `output/Skitii_Trial_Admin_Panel_Documentation.pdf`
- `output/Skitii_Admin_Unified_Nav_User_Management.pdf`
- `output/Skitii_Admin_RBAC_Panel_Design.pdf`
- `output/Skitii_Trial_Admin_8Day_Task_List.pdf`
- `output/Skitii_Admin_RBAC_7Day_Task_List.pdf`
- `output/Skitii_Admin_RBAC_10Day_Task_List.pdf`
- `output/Skitii_Admin_Audit_4Day_Task_List.pdf`
- `output/Remote_Control_Master_Hosts.pdf`
- `output/Skitii_Problem_Statement.pdf`
- `output/Skitii_Problem_Statement_Hindi.pdf`
- `output/Skitii_Trial_Offline_Sync_Task_List.pdf`

## Postman (Trial mobile)

See [`postman/README.md`](./postman/README.md) — import:

- `postman/skitii-trial-mobile.postman_collection.json`
- `postman/skitii-trial-mobile.postman_environment.json`

## Requirements

- Node.js 20+
- Python 3 with Pillow (`pip install pillow`)
