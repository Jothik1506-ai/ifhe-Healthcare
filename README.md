# 🏥 IFHE Healthcare — Medical Camp Management System

A full-stack web application for end-to-end management of medical health camps. Built with **React** (frontend) and **Node.js/Express** (backend), powered by **MongoDB** and real-time updates via **Socket.IO**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [User Roles](#user-roles)
- [API Routes](#api-routes)
- [Screenshots](#screenshots)
- [Docker Support](#docker-support)
- [License](#license)

---

## Overview

**IFHE Healthcare** is a comprehensive medical camp operations center that digitises the entire patient journey — from registration and vitals recording, through doctor consultation and prescription, to medicine pickup and lab tests. It supports two user roles (**Admin** and **Volunteer**) with role-based dashboards, real-time analytics, and QR-code-based patient tracking.

---

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with role-based access control
- Admin and Volunteer login portals
- OTP-based login support
- Volunteer self-registration

### 👤 Patient Management
- Patient registration with QR code generation
- QR code scanning for quick patient lookup
- Patient profile and history tracking
- Patient status tracking across the care pipeline

### 🩺 Doctor & Consultation
- Doctor registration and profile management
- Doctor availability management
- Manual and automatic doctor assignment
- Doctor queue management
- Prescription writing with medicine selection
- Counselling module

### 💊 Pharmacy & Inventory
- Medicine category management
- Medicine stock tracking and updates
- Medicine pickup with verification workflow
- Inventory monitoring

### 🧪 Lab Tests
- Lab test ordering and result recording
- Admin lab test management

### 📊 Analytics & Monitoring
- Camp analytics with visual charts (Recharts)
- Real-time analytics via WebSocket (Socket.IO)
- Activity logging for audit trail
- CSV data export

### 🍽️ Additional Modules
- Food distribution tracking
- Token generation system
- Volunteer manual / guide
- Downloadable QR codes for batch printing

---

## Tech Stack

| Layer       | Technology                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| Frontend    | React 18, React Router v7, Axios, Recharts, Lucide Icons, html5-qrcode   |
| Backend     | Node.js, Express 4, Mongoose, Socket.IO, JSON Web Tokens, bcryptjs        |
| Database    | MongoDB                                                                    |
| Real-time   | Socket.IO (WebSocket)                                                      |
| Forms       | React Hook Form + Zod validation                                           |
| Styling     | Custom CSS (glassmorphism design system)                                   |
| Dev Tools   | Nodemon, Create React App, Docker                                          |

---

## Project Structure

```
Medical-camp-coding/
├── Medical-camp-backend/          # Express API server
│   ├── db.js                      # MongoDB connection
│   ├── server.js                  # App entry point (port 5002)
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT auth & request logging
│   ├── models/                    # Mongoose schemas
│   │   ├── userModel.js           # Admin & Volunteer users
│   │   ├── patientModel.js        # Patient records
│   │   ├── doctorModel.js         # Doctor profiles
│   │   ├── vitalsModel.js         # Patient vitals
│   │   ├── patientHistoryModel.js # Consultation history
│   │   ├── inventoryModel.js      # Medicine inventory
│   │   ├── medicineCategoryModel.js
│   │   ├── labTestModel.js        # Lab test definitions
│   │   ├── labTestResultModel.js  # Lab test results
│   │   ├── patientFoodModel.js    # Food distribution
│   │   ├── queueModel.js          # Doctor queues
│   │   ├── logModel.js            # Activity logs
│   │   ├── otpModel.js            # OTP records
│   │   └── token.js               # Token tracking
│   ├── routes/                    # API route handlers
│   │   ├── authRoutes.js          # Login, signup, OTP
│   │   ├── patientRoutes.js       # Patient CRUD
│   │   ├── vitalRoutes.js         # Vitals recording
│   │   ├── patientHistoryRoutes.js# Consultation records
│   │   ├── doctorAssignRoutes.js  # Doctor assignment logic
│   │   ├── queueRoutes.js         # Queue management
│   │   ├── inventoryRoutes.js     # Inventory queries
│   │   ├── labTestRoutes.js       # Lab test operations
│   │   ├── analyticsRoutes.js     # Analytics aggregation
│   │   ├── adminSideGeneralRoutes.js
│   │   ├── adminSideDoctorRoutes.js
│   │   ├── adminSideMedicineRoutes.js
│   │   ├── adminSideVolunteerRoutes.js
│   │   ├── adminLabTestRoutes.js
│   │   ├── logRoutes.js           # Log retrieval
│   │   ├── patientStatusRoutes.js # Patient flow tracking
│   │   └── token.js               # Token generation
│   └── utils/                     # Utility functions
│
├── Medical-camp-frontend/         # React SPA
│   ├── public/                    # Static assets
│   └── src/
│       ├── App.js                 # Route definitions
│       ├── App.css                # Global styles
│       ├── index.js               # React entry point
│       ├── api/                   # Axios instance configuration
│       ├── config/                # App configuration
│       ├── Context/               # React Context providers
│       │   └── QrScannerContext.js # QR scanner shared state
│       ├── hooks/                 # Custom React hooks
│       │   └── useSocket.js       # Socket.IO hook
│       ├── Components/            # Reusable UI components
│       │   ├── Navbar.js
│       │   ├── Footer.js
│       │   ├── BookQrScanner.js   # QR code reader
│       │   ├── PatientIDCard.js   # Printable patient card
│       │   ├── CSVDownloadButtons.jsx
│       │   ├── FilterControls.jsx
│       │   └── ProfileHeader.jsx
│       ├── Pages/                 # Page-level components (47 pages)
│       │   ├── Login.js           # Unified login page
│       │   ├── Dashboard.js       # Volunteer dashboard
│       │   ├── DashBoardAdmin.jsx # Admin dashboard
│       │   ├── PatientRegistration.js
│       │   ├── Vitals.js
│       │   ├── DoctorPrescription.js
│       │   ├── MedicinePickup.js
│       │   ├── CampAnalytics.jsx
│       │   ├── RealTimeAnalytics.jsx
│       │   └── ... (40+ more pages)
│       └── Styles/                # Component-specific CSS
│
└── README.md                      # ← You are here
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 16.x
- **npm** ≥ 8.x
- **MongoDB** ≥ 5.x (local or cloud instance — e.g. MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jothik1506-ai/ifhe-Healthcare.git
   cd ifhe-Healthcare
   ```

2. **Install backend dependencies**
   ```bash
   cd Medical-camp-backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../Medical-camp-frontend
   npm install
   ```

### Environment Variables

#### Backend (`Medical-camp-backend/.env`)
```env
MONGO_URI=mongodb://localhost:27017/medical_camp
PORT=5002
JWT_SECRET=your_jwt_secret_key
```

#### Frontend (`Medical-camp-frontend/.env`)
```env
REACT_APP_BACKEND=http://localhost:5002
```

> **Note:** A `.env.example` file is provided in the frontend directory for reference.

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the backend** (runs on port 5002)
   ```bash
   cd Medical-camp-backend
   npm run dev
   ```

3. **Start the frontend** (runs on port 3000)
   ```bash
   cd Medical-camp-frontend
   npm start
   ```

4. Open **http://localhost:3000** in your browser.

> **Tip:** To suppress source-map warnings from third-party libraries, set `GENERATE_SOURCEMAP=false` before running the frontend.

---

## User Roles

### 🔑 Admin
- Full access to the admin dashboard
- Manage doctors, volunteers, medicines, and lab tests
- View camp analytics and real-time monitoring
- Access activity logs and data exports
- Download QR codes in bulk

### 🙋 Volunteer
- Patient registration and vitals recording
- Token generation and doctor queue management
- Doctor assignment (manual/automatic)
- Prescription entry and medicine pickup
- Lab test ordering and food distribution
- Patient status tracking and search

---

## API Routes

| Prefix                   | Description                        |
| ------------------------ | ---------------------------------- |
| `POST /api/auth/login`   | User authentication                |
| `/api/patients`          | Patient CRUD operations            |
| `/api/vitals`            | Vitals recording                   |
| `/api/patient-history`   | Consultation & prescription history|
| `/api/doctor-assign`     | Doctor assignment logic            |
| `/api/queue`             | Queue management                   |
| `/api/inventory`         | Inventory queries                  |
| `/api/labtests`          | Lab test operations                |
| `/api/patient-status`    | Patient flow tracking              |
| `/api/analytics`         | Analytics & aggregation            |
| `/api/logs`              | Activity log retrieval             |
| `/api/admin/*`           | Admin management endpoints         |

---

## Docker Support

Both the backend and frontend include `Dockerfile` configurations for containerised deployment.

```bash
# Build & run backend
cd Medical-camp-backend
docker build -t ifhe-backend .
docker run -p 5002:5002 ifhe-backend

# Build & run frontend
cd Medical-camp-frontend
docker build -t ifhe-frontend .
docker run -p 3000:3000 ifhe-frontend
```

---

## License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](Medical-camp-frontend/LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for <strong>IFHE Healthcare</strong> medical camp operations
</p>
