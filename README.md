# Heritage POS & Gestor de Licencias

![Sistema de Ventas](https://img.shields.io/badge/Estado-Activo-success) 
![React](https://img.shields.io/badge/React-19.2-blue)
![Electron](https://img.shields.io/badge/Electron-44.1-lightgrey)

Un sistema integral de Punto de Venta (POS) y Gestión de Licencias construido para ser escalable, robusto y rápido. Este repositorio utiliza una estructura tipo monorepo que contiene tanto la aplicación principal de punto de venta como una aplicación de escritorio dedicada para el control de las licencias.

## 🚀 Estructura del Proyecto

El proyecto está dividido en dos componentes principales:

### 1. Heritage POS (`/PaginaWeb`)
La aplicación principal de Punto de Venta que ofrece una interfaz súper completa y responsiva para el manejo de ventas e inventario.

- **Frontend:** React 19, Vite, Tailwind CSS, Zustand (Manejo de estados), React Router
- **Aplicación de Escritorio:** Electron (despliegue multiplataforma)
- **Componentes de Interfaz:** Recharts (analíticas y gráficas), Lucide React (íconos)
- **Características:** Dashboard responsivo, registro de ventas, control total de inventario.

### 2. Gestor de Licencias (`/Gestor de Licencias`)
Una aplicación de escritorio de Control Maestro (Master Control) para administrar las licencias y el acceso al sistema.

- **Framework:** Electron & Node.js
- **Backend/API:** Express, Supabase (Autenticación/Base de Datos), SQLite3 (Base de datos local)
- **Seguridad:** JSON Web Tokens (JWT)
- **Características:** Autenticación de la aplicación, generación centralizada de licencias, control de accesos.

## 🛠️ Requisitos Previos

Asegúrate de tener instalado lo siguiente en tu equipo:
- [Node.js](https://nodejs.org/) (se recomienda la versión v18 o superior)
- [Git](https://git-scm.com/)

## 📦 Instalación y Configuración

Clona el repositorio a tu equipo:
```bash
git clone https://github.com/AcornBraydz/Sistema-de-ventas.git
cd Sistema-de-ventas
```

### Correr Heritage POS
Navega a la carpeta del POS, instala las dependencias y córrelo en modo de desarrollo:
```bash
cd PaginaWeb
npm install
npm run electron:dev
```
Para construir la versión final (build) de la aplicación:
```bash
npm run electron:build
```

### Correr el Gestor de Licencias
Navega a la carpeta del Gestor de Licencias, instala las dependencias e inicia la aplicación:
```bash
cd "../Gestor de Licencias"
npm install
npm start
```
Para construir la versión final para producción:
```bash
npm run build
```

## 📄 Licencia
Este proyecto es propietario. Todos los derechos reservados.
