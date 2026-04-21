# 🏢 ProOffice: Programmer Office Suite 🚀

[![Built with React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Cloud Storage](https://img.shields.io/badge/Dropbox-0061FF?style=for-the-badge&logo=dropbox&logoColor=white)](https://www.dropbox.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

 An advanced, serverless Office Register Management System designed for efficiency, portability, and elite tracking. Featuring the **"Cyber Light"** design system—a premium, iOS-inspired aesthetic with state-of-the-art glassmorphism and fluid spring-based motion.

---

## ✨ Key Features

### 📂 "Cyber Light" Aesthetic
- **Premium Glassmorphism**: High-fidelity translucency with deep backdrop blurs and mesh gradients.
- **Fluid Spring Motion**: Every interaction is powered by physics-based spring animations for a tactile, responsive feel.
- **iOS-Inspired UX**: Refined spacing, rounded corners, and subtle micro-interactions reminiscent of high-end mobile operating systems.

### 📦 Document & Order Management
- **Inward/Outward Registers**: Track all official correspondence with a high-fidelity data terminal.
- **Important Orders**: A dedicated vault for mission-critical directives.
- **Advanced Searching**: Global filtering across subjects, dates, and projects (SEO optimized).
- **Smart Sorting**: Automated chronological and dispatch-based sorting for maximum visibility.

### 👥 Staff Directory
- **Elite Personnel Tracking**: Maintain detailed records including IDs, posts, and contact terminals.
- **Interactive UX**: Drag-and-drop reordering with persistent cloud-synchronization.
- **Quick Actions**: One-click communication and project-based asset allocation.

### 📱 Performance & PWA
- **Elite PWA Experience**: Installable on iOS and Android with standalone mode, offline asset caching, and native-app feel.
- **SEO Optimized**: Advanced meta structure, semantic HTML5, and accessibility compliance.
- **Timed Security Sessions**: Automatic session invalidation after 8 hours for data integrity.

---

## 🛠️ Tech Stack

- **Core**: React 19 + TypeScript
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS 4 (Custom design tokens & Mesh gradients)
- **Motion**: Framer Motion (Spring-based interaction engine)
- **Icons**: Lucide React
- **Integration**: Dropbox SDK (Persistent JSON storage & Asset hosting)

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
