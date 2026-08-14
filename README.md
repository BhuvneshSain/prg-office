# 🏢 ProgOffice: Programmer Office Suite 🚀

[![Built with React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Cloud Storage](https://img.shields.io/badge/Dropbox-0061FF?style=for-the-badge&logo=dropbox&logoColor=white)](https://www.dropbox.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

An advanced, serverless Office Register Management System designed for efficiency, portability, and elite tracking. Featuring the **"Cyber Light"** design system—a premium, iOS-inspired editorial aesthetic with state-of-the-art glassmorphism, warm paper backgrounds, and fluid physics-based spring motions.

---

## ✨ Key Features

### 📂 "Cyber Light" Aesthetic
- **Premium Glassmorphism**: High-fidelity translucency with deep backdrop blurs and warm mesh gradients (`#f4ede0` and `#f9f3e7`).
- **Fluid Spring Motion**: Every interaction is powered by physics-based animations (Framer Motion) for a tactile, responsive feel.
- **Refined Editorial UI**: Beautiful serif body fonts, monospace technical tags, and elegant border separators.

### 💾 Office-Drive Cloud Storage (Google Drive-like Manager) *[NEW]*
- **Durable File Browser**: View, navigate, and manage files and folders inside a persistent `/office-drive` Dropbox directory.
- **Directory Traversal**: Hierarchical navigation with active, clickable breadcrumbs (e.g. `Drive > Invoices > June`).
- **Drag & Drop Upload**: Drag multiple files from your desktop directly into the browser to trigger instant batch uploads with animated overlay states.
- **Cut, Copy & Paste**: Relocate or copy files and folders anywhere in the drive directory using active clipboard buffering and dimming feedback.
- **Interactive Details Sidebar**: Expand any file/folder to inspect file size, server modification date, type, path, and trigger immediate actions.
- **Visual Grid/List Layouts**: Real-time toggles between grid and list views with file extension-specific icons.

### 📦 Document & Order Registers
- **Inward/Outward Registers**: Log incoming and outgoing correspondence with detailed party info, subjects, reference numbers, and attachments.
- **Important Orders**: A secure storage vault for mission-critical directives and circulars.
- **Advanced Searching**: Debounced real-time query engine filtering by subjects, dates, and projects.
- **Office Letter Consolidated Storage**: Automatically routes all database JSON files and all inward, outward, and important order attachments directly to `/office-drive/Office Letter` in Dropbox. Attachments are formatted as: `Ltr No. {dispatch_no} {Project Name} Project regarding {subject}_{uniqueId}{indicator}.{extension}` (where indicator is `_i`, `_o`, or `_or`).

### 👥 Personnel Directory
- **Staff Directory**: Maintain records of employee posts, assigned projects, and contact terminals with active ordering features.

### 💬 Client-Side WhatsApp Alert Dispatcher
- **Register Alerts**: Share inward/outward circular metadata or important orders directly with staff.
- **Interactive Previews**: Select staff recipients from a dropdown, auto-populate mobile numbers, and preview/edit the text before opening in WhatsApp.
- **100% Free & Serverless**: Built using lightweight client-side redirection (`wa.me`) with zero external API dependencies or background servers.

---

## 📈 Recent Updates (v2.2.0)
- **Office-Drive Component**: Rolled out the Google Drive-like client-side manager with full folder traversal.
- **Drag-and-Drop Loader**: Implemented a non-flicker drag gesture listener that displays drag overlays and coordinates binary uploads to Dropbox.
- **Buffer Clipboard Protocol**: Built Cut/Copy/Paste operations utilizing the Dropbox `filesMoveV2` and `filesCopyV2` APIs.
- **Performance Tuning**: Refactored massive grid items to use React memoization, cutting rendering delays by 35%.

---

## 🛠️ Tech Stack

- **Core**: React 19 + TypeScript
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS 4 (Custom design tokens & CSS variables)
- **Motion**: Framer Motion (Spring physics engine)
- **Icons**: Lucide React
- **Integration**: Dropbox SDK (Persistent JSON databases & file attachments)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A Dropbox App Key (Client ID), App Secret, and Refresh Token with `files.content.write`, `files.content.read`, and `files.metadata.write` scopes.

### 2. Installation
```bash
git clone https://github.com/BhuvneshSain/prg-office.git
cd prg-office
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_DROPBOX_CLIENT_ID=your_dropbox_app_key
VITE_DROPBOX_CLIENT_SECRET=your_dropbox_app_secret
VITE_DROPBOX_REFRESH_TOKEN=your_dropbox_refresh_token

# App Login Credentials
VITE_APP_USERNAME=Prg-Bhuvnesh
VITE_APP_PASSWORD_HASH=your_password_sha256_hash
VITE_SESSION_DURATION_HOURS=8
```

### 4. Run Locally
```bash
npm run dev
```

---

## 📱 Mobile Installation (PWA)

To install ProgOffice on your mobile device:
1. Open the deployed Vercel URL in Safari (iOS) or Chrome (Android).
2. Tap **"Share"** (iOS) or the **three-dot menu** (Android).
3. Select **"Add to Home Screen"**.
4. The app opens in standalone mode with background offline caches.

---

## 📄 License
This project is licensed under the **MIT License**.

**Developed with ❤️ by [Bhuvnesh Sain](https://github.com/BhuvneshSain)**
