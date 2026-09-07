# Original User Request

## Initial Request — 2026-09-06T16:15:35Z

<USER_REQUEST>
A responsive bilingual (English & Egyptian Arabic RTL) Home Faults Reporting System for residential properties, facilitating fault submissions by residents across an 11-trade taxonomy, triage and contractor dispatch by management employees, and lifecycle oversight by landlords.

Working directory: /home/mostafa/Projects/Home Faults Report System
Integrity mode: development

## Requirements

### R1. Core Persona Workflows & Lifecycle State Machine
- Resident Portal: Mobile-responsive reporting wizard (3-tap categorization, fault description, location/unit #, photo upload) and "My Tickets" status tracking.
- Employee / Dispatcher Portal: Split-pane master-detail triage dashboard to review incoming faults, inspect uploaded photos, document contractor communications, and progress tickets through the lifecycle:
  SUBMITTED -> UNDER_REVIEW -> (CONTRACTOR_CONTACTED or REJECTED) -> APPOINTMENT_SCHEDULED -> IN_PROGRESS -> RESOLVED -> CLOSED.
- Landlord / Admin View: Portfolio summary with ticket volume, distribution across trade categories, and status metrics.

### R2. Smart 3-Tier Categorization Taxonomy
- Comprehensive 3-tier fault taxonomy across 11 trade domains:
  1. Plumbing (سباكة)
  2. Electrical (كهرباء) — with dedicated low-voltage / ELV sub-branch for CCTV camera surveillance, intercom & access control, Wi-Fi access points, and automated gates
  3. HVAC & Air Conditioning (تكييف وتبريد)
  4. Carpentry & Joinery (نجارة وأبواب)
  5. Aluminum & Glazing Works (ألوميتال وزجاج)
  6. Gypsum Boards & False Ceilings (جبس بورد وأسقف معلقة)
  7. Painting & Surface Finishes (نقاشة ودهانات)
  8. Swimming Pool & Water Amenities (حمام سباحة)
  9. Civil, Masonry & Tiling (سيراميك وبلاط وبناء)
  10. Major Landlord Appliances (أجهزة منزلية)
  11. Grounds, Exterior & Roofing (واجهات وأسطح وحدائق)
- Built-in safety warnings for hazardous faults (sparks, water leaks near power, ceiling sag risk).

### R3. Bilingual Support & Prioritized Arabic RTL Layout
- Seamless language toggle between English and authentic Egyptian Arabic (العربية).
- When Arabic is selected, the UI layout fully mirrors (dir="rtl", mirrored icons, navigation, form alignments, and master-detail panes) with Cairo font typography.
- Uses authentic Egyptian market terminology (e.g. سباكة، كهرباء، تكييف، ألوميتال، جبس بورد، نقاشة).

### R4. Modern Tactile UI & Zero-Configuration Local Execution
- Built with a modern 2026 tactile minimalist design aesthetic (crisp 1px borders, subtle surface elevations, status pills, dark/light mode toggle).
- Mobile-first responsiveness for smartphones and wide-screen optimized split-view for desktop/laptops.
- Runs smoothly in local environment with embedded database (e.g. SQLite) and sample pre-seeded test tickets and categories for immediate out-of-the-box verification.

## Acceptance Criteria

### Functionality & Lifecycle
- [ ] Resident can submit a ticket with category, subcategory, photo upload, and description without runtime errors.
- [ ] Submitted ticket appears in the employee triage dashboard with all metadata and photo preview.
- [ ] Dispatcher can transition the ticket through all specified states (SUBMITTED through CLOSED and REJECTED) with state changes reflected immediately.

### Language & RTL Mirroring
- [ ] Language toggle instantly switches all UI strings, category names, and status badges between English and authentic Egyptian Arabic.
- [ ] In Arabic mode, the document switches to dir="rtl" with properly mirrored navigation, chevrons, and input alignments.

### Build & Verification
- [ ] Application builds with zero compile/TypeScript errors (npm run build exits 0).
- [ ] Local dev server launches and is accessible via browser on phone and desktop screen viewports.
</USER_REQUEST>

## Follow-up — 2026-09-06T17:42:10Z

<USER_REQUEST>
Enhance the Home Faults Report System with optimized phone responsive mobile UX, landlord fault reporting capability, landlord unit management (add & edit residential units), and custom "Other" fault entry across categories.

Working directory: /home/mostafa/Projects/Home Faults Report System
Integrity mode: development

## Requirements

### R1. Phone-Optimized Mobile Responsive UX
- Redesign the layout for small touch screens (360px–430px wide):
  - Fixed, accessible bottom navigation bar or thumb-friendly drawer on mobile.
  - Category grids and forms sized with generous touch targets (minimum 48px).
  - Eliminate horizontal overflow, awkward wrapping, and cramped card layouts on phones.
  - Maintain full bidirectional Arabic RTL mirroring and English LTR adaptability seamlessly on mobile viewports.

### R2. Landlord Fault Reporting Capability
- Enable the Landlord / Property Owner persona to submit fault reports directly from their portal (for common areas, building exterior, vacant units, or direct tenant reports).
- Provide quick unit/area selection suitable for building-wide management.

### R3. Landlord Unit Management (Add & Edit Units)
- In the Landlord / Owner portal, provide an interactive Unit Management interface:
  - Add new residential units (unit number, building/block name, floor number, resident name, resident phone number).
  - Edit existing unit details and update tenant contact information.
  - Persistent storage in the SQLite database with instant reflection across reporting dropdowns.

### R4. Custom "Other" Fault Reporting Option
- In the fault reporting wizard (for both residents and landlords):
  - Under each trade or as a dedicated option, add an "Other / عطل غير مدرج" option.
  - Allow users to enter custom fault titles and freeform descriptions if their specific issue is not listed in the standard 11-trade taxonomy.
  - Include automated keyword hazard detection on the custom text (flagging electrical sparks, water near power, gas, or collapse hazards).

## Acceptance Criteria

### Mobile Responsiveness
- [ ] On mobile viewports (<640px), the application has zero horizontal scrolling and all buttons/inputs are easily clickable with thumb interaction.
- [ ] Navigation works fluidly on mobile devices in both Arabic RTL and English LTR.

### Landlord Features
- [ ] Landlord can submit a fault report directly from the Landlord portal with immediate appearance in the tickets queue.
- [ ] Landlord can add a new unit and edit existing unit details, with changes saved persistently to the database and visible in the reporting unit selector.

### Custom Fault Entry
- [ ] Selecting "Other / عطل غير مدرج" allows user to enter custom fault name and description.
- [ ] Submitting a custom fault saves the ticket with appropriate categorization and flags hazards if danger keywords are typed.

### Build & Test Integrity
- [ ] `npm run build` compiles with zero errors.
- [ ] Existing and new automated tests pass cleanly (`npm test` exits 0).
</USER_REQUEST>

