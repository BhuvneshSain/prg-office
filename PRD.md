# Product Requirements Document (PRD) - ProgOffice Suite

## 1. Project Overview & Background
In government administrative offices (such as the Department of Information Technology & Communication (DoIT&C) in Rajasthan), keeping logs of files, circulars, incoming/outgoing correspondence, tasks, and personnel is vital. Conventional database systems are heavy and require dedicated hosting servers, which introduces deployment complexity and cost.

To solve this, **ProgOffice** is a Progressive Web App (PWA) that acts as a serverless office management system. It securely hooks directly into the office's own Dropbox account as a persistence layer, transforming JSON databases and directory hierarchies in real-time. 

ProgOffice features a custom **"Cyber Light"** design language: a premium editorial aesthetic using serif display headings, warm paper/panel palettes, and physics-based spring motions.

---

## 2. Core Objectives & Success Metrics
- **Zero Server Footprint**: 100% serverless client-side architecture. Dropbox handles all storage, auth refreshing, and asset downloads.
- **Flawless Mobilization**: Transform into an installable PWA that functions seamlessly on viewports from 320px wide upwards.
- **Editorial Aesthetic**: Provide a modern look (warm backgrounds, DM Serif display typography, and smooth micro-interactions) that is clear, crisp, and high-performance.
- **Rich Document Portals**: Support full file traversal, file uploads, folder creation, and interactive clipboard commands (Cut/Copy/Paste).

---

## 3. Technology Stack
- **Frontend Core**: React 19 + TypeScript + Vite 8.
- **Styling**: Tailwind CSS v4.0 (utilizing modern CSS variables and theme configurations).
- **Interactions**: Framer Motion (handling fluid, spring-based motion curves).
- **Backend Integrations**: Dropbox API v2 SDK.
  - Exposes endpoints for file downloads, uploads, folder creation, deletions, and moves.
  - Automatically fetches fresh short-lived access tokens via client-side OAuth2 refresh credentials.
- **Visual Charts**: Recharts for visualizing tasks, registers, and progress statistics.

---

## 4. Feature Requirements

### 4.1. The Editorial Dashboard
- **KPI Metrics Cards**: Displays real-time counts of Inward entries, Outward entries, Orders, Staff, and Pending/Completed tasks.
- **Task Activity Chart**: Render a dynamic bar chart showcasing recent task priorities and completion statuses.
- **System status ticker**: UPPERCASE ticker showing online sync state and total file counts.

### 4.2. Inward & Outward Registers
- **Data Loggers**: Form fields to register date, sender/recipient party, subject description, official reference numbers, and attachments.
- **Data Terminal**: Scrollable list view featuring advanced query search fields and department/project-based filtering.
- **Task Binding**: Quick-action shortcuts to link any inward entry directly to a task in the Task Center.

### 4.3. Important Orders & Directives
- **Directives Vault**: Storage portal specifically reserved for high-priority circulars and orders.
- **Metadata Fields**: Reference numbers, circular subject, remarks, and PDF attachments.

### 4.4. Office-Drive (File Manager) *[Added in v2.2.0]*
- **Hierarchical Browser**: Traverses directory structures under the `/office-drive` directory in the user's Dropbox account.
- **Directory Breadcrumbs**: Interactive breadcrumb bar that visualizes directory paths and supports backward traversal.
- **Multi-File Drag & Drop**: Activates a full-screen dashed border container when drag events are detected. Enables dragging files from a desktop directly to upload to the active directory.
- **Cut, Copy, Paste**: 
  - Standard clipboard buffering logic.
  - Fades out elements marked for moving (opacity-40).
  - Uses the Dropbox API `filesMoveV2` and `filesCopyV2` to restructure folders client-side.
- **Info Sidebar**: Selecting a file/folder slides out a description panel with file dimensions, types, exact paths, and modified dates.
- **View Toggles**: Switches between 5-column grid layout and structured row list formats.

### 4.5. Staff Directory & Allocations
- **Staff logs**: Tracks posts, codes, contact terminals, and assigned projects.
- **Tactile reordering**: Supports drag-and-drop listing reordering with immediate persistence to Dropbox databases.

### 4.6. Task Management Center
- **Task Cards**: Track titles, descriptions, priorities (Low to Critical), assigned staff, and completion statuses.
- **Status toggles**: Tick checkbox to mark tasks complete, featuring instant database saves and rollback states if network errors occur.

---

## 5. Security & Session Protocols
- **Client-Side Auth**: Protects the entry view with username and password checking. Passwords are validated using SHA-256 hashes defined in the environment.
- **Idle Logout Timer**: Automatically invalidates local sessions and logs out users after 8 hours of inactivity.
- **Exposed Secret Handling**: Client credentials are encrypted at build time and handled securely via short-lived Dropbox tokens.
