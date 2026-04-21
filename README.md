# 🏢 ProOffice: Programmer Office Suite 🚀

[![Built with React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Cloud Storage](https://img.shields.io/badge/Dropbox-0061FF?style=for-the-badge&logo=dropbox&logoColor=white)](https://www.dropbox.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

An advanced, serverless Office Register Management System designed for efficiency, portability, and professional tracking. Synchronized seamlessly with Dropbox for secure document storage and persistent data management.

---

## ✨ Key Features

### 📂 Document & Order Management
- **Inward/Outward Registers**: Track all official correspondence with ease.
- **Important Orders**: A dedicated module for mission-critical directives.
- **Advanced Searching**: Instant search across subjects, dates, and projects (SEO optimized).
- **Smart Sorting**: Default sorting by Dispatch Number for Outward records to ensure high-priority visibility.

### 👥 Staff Directory
- **Personnel Management**: Maintain detailed records including IDs, posts, and contact details.
- **Interactive UX**: Drag-and-drop reordering with persistent cloud-saving.
- **Quick Actions**: One-click phone dialing and project-based filtering.

### 📱 Performance & PWA
- **Full PWA support**: Installable on iOS and Android for a native-app feel (offline asset caching, standalone mode).
- **SEO Optimized**: Optimized meta tags, semantic HTML, and accessibility features for better search visibility.
- **Timed Sessions**: Automatic logout after 8 hours to ensure data privacy.
- **Instant Refresh**: Smooth fetching and updating mechanisms for real-time collaboration.

### ☁️ Cloud & Persistence
- **Dropbox Backend**: All data and attachments are securely stored and synced via the Dropbox API.
- **Multi-File Support**: Upload and preview PDFs, images, and videos directly within the app with enhanced mobile viewer fallback.

---

## 🛠️ Tech Stack

- **Core**: React 19 + TypeScript
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS 4 (Glassmorphism & Modern UI)
- **PWA**: `vite-plugin-pwa` (Workbox)
- **Icons**: Lucide React
- **Integration**: Dropbox SDK (Persistent JSON storage & File Hosting)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A Dropbox App Key (Client ID) with `files.content.write` and `files.content.read` permissions.

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
VITE_APP_USERNAME=admin
VITE_APP_PASSWORD_HASH=your_password_hash
VITE_SESSION_DURATION_HOURS=8
```

### 4. Run Locally
```bash
npm run dev
```

---

## 📱 Mobile Installation (PWA)

To install the app on your mobile device:
1. Open the app URL in Safari (iOS) or Chrome (Android).
2. Tap **"Share"** (iOS) or the **three-dot menu** (Android).
3. Select **"Add to Home Screen"**.
4. The app will now appear on your home screen and open in standalone mode.

---

## 📄 License
This project is licensed under the **MIT License**. See `LICENSE` for more information.

---

**Developed with ❤️ by [Bhuvnesh Sain](https://github.com/BhuvneshSain)**
