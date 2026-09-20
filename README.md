# Heritage POS & License Management System

![Sistema de Ventas](https://img.shields.io/badge/Status-Active-success) 
![React](https://img.shields.io/badge/React-19.2-blue)
![Electron](https://img.shields.io/badge/Electron-44.1-lightgrey)

A comprehensive Point of Sale (POS) and License Management System built for scalability, robustness, and performance. This repository uses a monorepo-style structure containing the main POS application and a dedicated desktop application for license control.

## 🚀 Project Structure

The project is divided into two main components:

### 1. Heritage POS (`/PaginaWeb`)
The core Point of Sale application providing a rich, responsive interface for sales and inventory management.

- **Frontend:** React 19, Vite, Tailwind CSS, Zustand (State Management), React Router
- **Desktop Wrapper:** Electron (cross-platform deployment)
- **UI Components:** Recharts (analytics), Lucide React (icons)
- **Features:** Responsive dashboard, sales tracking, inventory management.

### 2. Gestor de Licencias (`/Gestor de Licencias`)
A dedicated Master Control desktop application to manage licenses and system access.

- **Framework:** Electron & Node.js
- **Backend/API:** Express, Supabase (Authentication/Database), SQLite3 (Local DB)
- **Security:** JSON Web Tokens (JWT)
- **Features:** App authentication, centralized license generation, access control.

## 🛠️ Prerequisites

Make sure you have installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)

## 📦 Installation & Setup

Clone the repository:
```bash
git clone https://github.com/AcornBraydz/Sistema-de-ventas.git
cd Sistema-de-ventas
```

### Running Heritage POS
Navigate to the POS directory, install dependencies, and run in development mode:
```bash
cd PaginaWeb
npm install
npm run electron:dev
```
To build the application:
```bash
npm run electron:build
```

### Running the License Manager (Gestor de Licencias)
Navigate to the License Manager directory, install dependencies, and start the app:
```bash
cd "../Gestor de Licencias"
npm install
npm start
```
To build the application for production:
```bash
npm run build
```

## 📄 License
This project is proprietary. All rights reserved.
