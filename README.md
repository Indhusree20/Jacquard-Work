# Jacquard Work Management Platform (ஜாகார்ட் பணி மேலாண்மை தளம்)

A production-oriented full-stack web application designed specifically for the traditional handloom and Jacquard-weaving sector in Tamil Nadu (Salem, Kanchipuram, Erode, Coimbatore, Tiruppur, Namakkal, etc.).

> **Important Business Philosophy**: The physical Jacquard craftsmanship remains manual and is performed on-site by skilled master artisans. This platform digitizes and streamlines the surrounding business workflow: work requests, punch card/graph design uploads, quotation negotiations, scheduling, on-site GPS navigation to looms, job status tracking, charge reconciliation, and comprehensive job history.

---

## 🚀 Key Features

### 1. Dual Language Architecture (English & தமிழ்)
- Complete bilingual interface with persistent language toggle (`EN | தமிழ்`).
- Form validations, status timelines, notifications, and catalog descriptions fully rendered in both Tamil and English without layout breakage.

### 2. Role-Based Access Control (RBAC)
- **Weaver (நெசவாளர்)**:
  - Create Jacquard work requests with loom count, service type, and preferred time.
  - Upload design graphs / punch card sketches (JPG, PNG, PDF).
  - Pin loom workshop location with interactive Leaflet map and GPS auto-pinning.
  - Review incoming artisan quotations with transparent breakdown (Base labor, Extra materials, Travel charge).
  - Accept/Decline quotes, track live on-site progress, and rate artisans.
- **Jacquard Master Artisan (ஜாகார்ட் மாஸ்டர் ஆசாரி)**:
  - Marketplace of open requests across Tamil Nadu handloom clusters.
  - Inspect design graphs and workshop location.
  - Submit transparent quotations with customized charges and notes.
  - 1-Click GPS Navigation (`Google Maps`) directly to the weaver's loom site.
  - Real-time job lifecycle controls: `START WORK AT LOOM` → `MARK COMPLETED`.
  - Daily loom visit calendar and availability toggle (`Available` / `Busy`).
  - Earnings overview and cash/UPI payment logging.
- **Admin & Primary Admin**:
  - Primary Admin invite system for secondary administrators with granular permissions (`MANAGE_USERS`, `MANAGE_WORK_TYPES`, `MANAGE_PRICING`, `MANAGE_JOBS`, `VIEW_REPORTS`, etc.).
  - Service catalog management (Jacquard box setup, card punching & lacing, harness mounting, border modification, overhaul).
  - Regional analytics for Tamil Nadu handloom clusters.
  - Audit logging of all critical platform actions.

### 3. Realtime Updates & Notifications
- Realtime WebSocket updates powered by Socket.IO for quote submissions, job confirmations, and progress changes.
- In-app notification bell with unread badge and interactive toast alerts.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, TypeScript, Mongoose, Socket.IO, Multer, Zod, bcrypt, JWT, Helmet, CORS, Morgan.
- **Database**: MongoDB with automatic embedded `mongodb-memory-server` fallback for zero-configuration instant development.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, React Router v6, Leaflet & React-Leaflet, Axios, React Hook Form, Zod.

---

## ⚡ Quick Start & Development

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Seed Database with Realistic Tamil Nadu Handloom Data
```bash
cd backend
npm run seed
```

### 3. Start Backend & Frontend Servers
```bash
# Terminal 1: Backend Server (Port 5000)
cd backend
npm run dev

# Terminal 2: Frontend Server (Port 3000)
cd frontend
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🔑 Pre-seeded Demo Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Primary Admin** | `admin@jacquardwork.in` | `Admin@123456` | P. Shanmuga Sundaram (Full permissions) |
| **Secondary Admin** | `salem.admin@jacquardwork.in` | `Admin@123456` | R. Kavin Kumar (Salem/Erode operations) |
| **Weaver (Salem)** | `muthuswamy.weaver@gmail.com` | `Weaver@123` | Muthuswamy Weavers (Ammapet, 8 Looms) |
| **Weaver (Kanchipuram)** | `velmurugan.silk@gmail.com` | `Weaver@123` | Sri Velmurugan Silk Looms (14 Looms) |
| **Jacquard Master (Salem)**| `kandasamy.jacquard@gmail.com`| `Worker@123` | Kandasamy Master (24 yrs exp) |
| **Jacquard Master (Erode)**| `arumugam.worker@gmail.com`| `Worker@123` | Arumugam Master (18 yrs exp) |

---

## 🧪 Running Automated Tests

```bash
cd backend
npm test
```
All integration test suites test Authentication, RBAC guards, Work Request creation, Quotation submission, Weaver Quote acceptance, Job lifecycle progression, and Payment logging.

---

## 🏛️ Handloom Clusters Supported
- **Salem (சேலம்)**: Ammapet, Gugai, Jalakandapuram
- **Kanchipuram (காஞ்சிபுரம்)**: Pillaiyarpalayam, Mettu Street
- **Erode (ஈரோடு)**: Chennimalai, Bhavani, BP Agraharam
- **Coimbatore (கோயம்புத்தூர்)**: Somanur, Sirumugai
- **Namakkal (நாமக்கல்)**: Rasipuram
- **Tiruppur (திருப்பூர்)**