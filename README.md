# 🏠 Smart Home Maintenance & Reporting System
### نظام إدارة وصيانة المنزل ومتابعة البلاغات وأوامر الشغل

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-node:sqlite_(WAL)-003b57?style=flat&logo=sqlite)](https://nodejs.org/api/sqlite.html)
[![Vitest](https://img.shields.io/badge/Tests-246_Passing_(25_Suites)-729b1b?style=flat&logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, responsive, full-lifecycle residential maintenance operations portal. Built with **Next.js 16 (Turbopack)**, **React 19**, and Node.js built-in **`node:sqlite`**, featuring complete bilingual support (**Arabic RTL & English**), an **11-trade residential taxonomy**, dispatcher triage dashboard, contractor communication logs, field punch list PDF generation, and landlord unit management.

---

## 🌟 Key Features & Highlights

### 1. 📲 Resident Fault Reporting Wizard (بوابة تسجيل وبلاغ الأعطال)
- **3-Step Intuitive Reporting Flow**: Select trade domain ➔ choose specific symptom ➔ select unit & room location.
- **Simplified Unit Selector**: Residents simply pick their registered apartment from a dropdown without typing repetitive building or block details.
- **Owner-Configured Fixed Rooms & Areas**: Dynamically loads unit-specific room chips (`المطبخ`, `الحمام الرئيسي`, `الريسبشن / الصالة`, `غرفة النوم`, `البلكونة`), with a tactile **"مكان آخر (+)"** option for custom locations.
- **Automatic Safety Hazard Detection**: Instant critical alerts (red pulsing banner) for hazardous conditions (e.g. electrical sparks near plumbing, gas odor, sagging false ceilings).
- **Photo Upload & Live Tracking**: Upload evidence images and track progress through a 5-point visual progress stepper.

### 2. 📋 Operations Dispatcher & Triage Dashboard (لوحة المتابعة وتوجيه البلاغات)
- **Master-Detail Split Pane**: Rapidly triage incoming reports, review photos, inspect unit history, and log contractor dispatch details.
- **8-Stage Lifecycle State Machine**:
  $$\text{SUBMITTED} \longrightarrow \text{UNDER\_REVIEW} \longrightarrow \begin{cases} \text{CONTRACTOR\_CONTACTED} \longrightarrow \text{APPOINTMENT\_SCHEDULED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{RESOLVED} \longrightarrow \text{CLOSED} \\ \text{REJECTED} \end{cases}$$
- **Contractor Management & Communication Logs**: Record technician quotes, schedule appointment slots, and track communication history (WhatsApp, Phone, Email, In-Person).
- **Active Queue vs. Archive Segregation**: Resolved, closed, and rejected tickets are segregated into an **"الأرشيف والمنتهي" (Archive & History)** tab to keep the active queue clean and actionable.
- **1-Click Ticket Republishing**: Republish any archived or rejected ticket back into the active queue as a new ticket (`SUBMITTED`) with full historical audit notes.
- **Work Order Print Slip (PDF)**: Generate clean, single-page work orders formatted for field technicians.

### 3. 🏢 Landlord & Property Management (لوحة تحكم الإدارة والوحدات)
- **Real-Time Operational KPIs**: Total tickets, active backlog, resolution count, hazard count, SLA compliance %, and Mean Time to Resolve (MTTR).
- **Trade Failure Distribution**: Visual breakdown of maintenance tickets across trades.
- **Dynamic Unit & Room Manager**: Add or edit residential apartments, update resident contact details, and configure unit-specific room tags with quick-add chips (`+ السطح`, `+ الحديقة`, `+ غرفة التخزين`, `+ غرفة الملابس`).

### 4. 📄 Field Punch List Report Generator (PDF)
- Filterable batch punch list for property inspections and contractor handovers.
- Pure white background print layout with repeating table headers (`thead { display: table-header-group }`), safety hazard highlights, and contractor sign-off blocks.

### 5. 🌐 Authentic Bilingual Arabic (RTL) & English
- First-class Arabic RTL interface designed with **Cairo** typography and authentic Egyptian maintenance terminology (`سباكة`, `كهرباء`, `تكييف وتبريد`, `ألوميتال وزجاج`, `نجارة`, `جبس بورد`, `نقاشة ودهانات`).
- Instant language toggle without page reloads or layout shift.

---

## 🛠️ 11-Trade Residential Taxonomy

The system organizes home repairs into 11 specialized trade categories with over 37 subcategories and 125+ leaf failure symptoms:

| # | Trade (English) | التخصص (عربي) | Highlights & Coverage |
|---|-----------------|---------------|------------------------|
| 1 | **Plumbing** | سباكة | Faucets, mixers, drain clogs, water heaters, pipe leaks, booster pumps |
| 2 | **Electrical & ELV** | كهرباء وأنظمة خفيفة | Breakers, lighting, outlets, short circuits + **Dedicated ELV branch** (CCTV, Intercom, Access Control, Wi-Fi APs, Gate Motors) |
| 3 | **HVAC & Cooling** | تكييف وتبريد | Split AC, freon leak, compressor failure, water dripping, thermostat, duct |
| 4 | **Carpentry & Doors** | نجارة وأبواب | Wood doors, hinges, cylinder locks, kitchen cabinets, closets, window shutters |
| 5 | **Aluminum & Glazing** | ألوميتال وزجاج | Sliding tracks, rollers, double glass condensation, window weatherstripping |
| 6 | **Gypsum & Ceilings** | جبس بورد وأسقف | Cracks, moisture damage, sagging false ceilings, access hatch repairs |
| 7 | **Painting & Finishes** | نقاشة ودهانات | Wall peeling, efflorescence, touch-up paint, water stains |
| 8 | **Swimming Pool** | حمام سباحة ومسطحات | Pool pumps, filtration, chlorinators, surface tiles, underwater lights |
| 9 | **Civil & Masonry** | سيراميك وبلاط وبناء | Hollow tiles, regrouting, cement repairs, stair marble, balcony waterproofing |
| 10 | **Major Appliances** | أجهزة منزلية | Landlord-supplied refrigerators, built-in ovens, washers, range hoods |
| 11 | **Grounds & Exterior** | واجهات وأسطح وحدائق | Roof waterproofing, landscape irrigation, pathway lighting, perimeter fence |

---

## 🏗️ Architecture & Tech Stack

```
                               ┌───────────────────────────┐
                               │   Next.js 16 + React 19   │
                               │  (App Router + Turbopack) │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
             ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
             │ Resident Portal  │  │ Dispatcher Triage│  │  Landlord KPIs   │
             │ (Fault Wizard)   │  │ (Master-Detail)  │  │  & Unit Manager  │
             └─────────┬────────┘  └─────────┬────────┘  └─────────┬────────┘
                       │                     │                     │
                       └─────────────────────┼─────────────────────┘
                                             │ REST API
                                             ▼
                               ┌───────────────────────────┐
                               │  Next.js API Route Layer  │
                               │ /api/tickets, units, stats│
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │     Node.js node:sqlite   │
                               │  DatabaseSync (WAL Mode)  │
                               │   Embedded SQLite DB      │
                               └───────────────────────────┘
```

- **Framework**: Next.js 16.3 (Turbopack, App Router, React 19).
- **Styling**: Tailwind CSS v4 with custom tactile theme variables and Cairo Google Font.
- **Embedded Database**: Node.js 22 built-in `node:sqlite` (`DatabaseSync`) with Write-Ahead Logging (WAL) and foreign key constraints enabled. No external database servers or Docker containers required.
- **Icons**: Lucide React.
- **Testing**: Vitest 5.0 with in-memory SQLite isolation.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version `22.0.0` or higher (uses native `node:sqlite`).
- **npm**: Version `10.0.0` or higher.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Top1mo/Smart-Home-Maintainance-Reporting-System.git
   cd Smart-Home-Maintainance-Reporting-System
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) to view the portal.
   The database automatically initializes and pre-seeds sample properties, units, and realistic lifecycle tickets on first boot!

---

## 🧪 Testing & Quality Assurance

The codebase includes an extensive automated test suite covering all functional tiers, security boundaries, and edge cases:

```bash
# Run all unit, integration, and E2E tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Suite Breakdown (246 Tests across 25 Suites)
- **Adversarial & Security**: SQL injection resistance, query sanitization, XSS payload filtering, and race condition prevention.
- **Lifecycle State Machine**: Valid transition progression, illegal transition prevention, and required payload validation.
- **API Integration**: Endpoints for tickets, units, communications, stats, and ticket republishing.
- **Bilingual & RTL**: Direction mirroring, Arabic typography, and Egyptian dialect terminology verification.
- **Print & PDF Layouts**: Repeating headers, page break rules, and work order layout tests.

---

## 📁 Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── stats/route.ts                 # Real-time landlord KPI aggregates
│   │   │   ├── tickets/
│   │   │   │   ├── route.ts                   # Ticket listing and creation
│   │   │   │   ├── [id]/route.ts              # Ticket retrieval by ID
│   │   │   │   ├── [id]/communications/       # Contractor comms logs
│   │   │   │   ├── [id]/republish/            # 1-click ticket republishing
│   │   │   │   └── [id]/transition/           # Lifecycle state transitions
│   │   │   ├── trades/route.ts                # 11-trade taxonomy data
│   │   │   └── units/route.ts                 # Unit & room management
│   │   ├── globals.css                        # Tactile UI tokens & print styles
│   │   ├── layout.tsx                         # Root layout with Cairo font & theme
│   │   └── page.tsx                           # Main app dashboard & role switcher
│   ├── components/
│   │   ├── dispatcher/
│   │   │   └── DispatcherTriage.tsx           # Split-pane triage, queue & archive
│   │   ├── landlord/
│   │   │   ├── LandlordKPIs.tsx               # Analytics and trade distribution
│   │   │   └── UnitManager.tsx                # Residential unit & room manager
│   │   ├── layout/
│   │   │   └── Header.tsx                     # Top navigation, language & theme toggles
│   │   ├── pdf/
│   │   │   ├── PunchListReport.tsx            # Multi-ticket inspection PDF
│   │   │   └── WorkOrderSlip.tsx              # Single technician work order PDF
│   │   ├── resident/
│   │   │   └── ResidentWizard.tsx             # 3-step fault submission wizard
│   │   └── ui/
│   │       └── TicketCard.tsx                 # Reusable ticket card component
│   └── lib/
│       ├── constants/trades-data.ts           # 11-trade failure catalog
│       ├── db/
│       │   ├── index.ts                       # SQLite connection & schema initialization
│       │   ├── schema.sql                     # Relational DDL schema
│       │   ├── seed-data.ts                   # Seed fixtures (units, properties, tickets)
│       │   ├── seed.ts                        # Seeding runner script
│       │   └── types.ts                       # TypeScript domain interfaces
│       ├── i18n/context.tsx                   # English / Arabic translation context
│       ├── state-machine.ts                   # Strict 8-stage transition engine
│       └── utils.ts                           # CSS and string helper utilities
├── tests/                                     # 25 test suites (246 tests)
│   ├── adversarial/                           # Security & stress tests
│   ├── e2e/                                   # Feature scenarios & boundaries
│   ├── integration/                           # API & database tests
│   └── unit/                                  # PDF & state machine tests
├── data/                                      # SQLite runtime directory (.gitkeep)
├── package.json                               # Project dependencies & scripts
├── tsconfig.json                              # TypeScript configuration
└── vitest.config.mjs                          # Vitest configuration
```

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
