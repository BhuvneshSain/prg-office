# Programmer Office Suite 🚀

An advanced, serverless Office Register Management System designed for efficiency, portability, and professional tracking. Synchronized seamlessly with Dropbox for secure document storage and persistent data management.

## ✨ Features

- **📂 Register Management**: Track Inward and Outward documents with ease.
- **📁 Important Orders**: Dedicated section for tracking urgent directives and assignments.
- **👥 Staff Management**: Manage personnel records, designations, and project allocations.
- **☁️ Dropbox Sync**: Serverless architecture using Dropbox for both JSON data and PDF attachments.
- **📱 Full PWA support**: Installable on iOS and Android for a native-app feel (offline asset caching, standalone mode).
- **🔍 SEO Optimized**: Optimized meta tags, semantic HTML, and accessibility features for better search visibility.
- **📊 Professional Reporting**: Aggregated statistics and performance analytics for office records.

## 🛠️ Technology Stack

- **Core**: React 19 + TypeScript
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS 4
- **PWA**: `vite-plugin-pwa` (Workbox)
- **Icons**: Lucide React
- **Cloud Storage**: Dropbox API v2

## 🚀 Getting Started

### Prerequisites

- Node.js (latest LTS recommended)
- A Dropbox App Key (Client ID)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd prg-office-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory and add:
   ```env
   VITE_DROPBOX_CLIENT_ID=your_dropbox_app_key
   VITE_APP_USERNAME=admin
   VITE_APP_PASSWORD_HASH=your_password_hash
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 📱 Mobile Installation (PWA)

To install the app on your mobile device:
1. Open the app URL in Safari (iOS) or Chrome (Android).
2. Tap **"Share"** (iOS) or the **three-dot menu** (Android).
3. Select **"Add to Home Screen"**.
4. The app will now appear on your home screen and open in standalone mode.

## 📄 License

This project is licensed under the MIT License.
