# Enterprise Human Resource Management (HRM) System

A Dribbble-quality, high-fidelity Human Resource Management (HRM) web application featuring 3D visuals, reactive user profiles, real-time clock heatmaps, payslip generation, and an ATS pipeline.

---

## Technical Stack

*   **Frontend**: Vue 3 (Composition API + `<script setup>`), Vue Router 4, Pinia, GSAP 3 (magnetic buttons, page transitions, count-ups), Three.js (rotating wireframe torus mesh, drifting login particle field, floating logo), Axios, and TailwindCSS.
*   **Backend**: Node.js, Express.js, MongoDB (Mongoose ODM), JWT Authentication (1-hour access token, 7-day refresh token in HTTP-only cookies), bcrypt, Multer + Cloudinary (with local disk storage fallback), Nodemailer (with console log fallback for OTP), and node-cron (for contract expiries and leave alerts).

---

## Folder Structure

```text
/hrm-app
  /client                   ← Vue 3 frontend
    /public
    /src
      /assets
      /components
        /ui                 ← Button, Modal, Table, Badge, Toast
        /three              ← HeroCanvas.vue, ParticlesBg.vue, HeaderCanvas.vue
      /composables          ← useAuth, useGsap, useToast
      /layouts              ← DefaultLayout, AuthLayout, PortalLayout
      /pages                ← pages/modules (Landing, Login, Dashboard, Employees, etc.)
      /router               ← index.js with auth & role guards
      /stores               ← Pinia stores per module
      /services             ← Axios API configuration
      App.vue
      main.js
  /server                   ← Express backend
    /config                 ← db.js, cloudinary.js, nodemailer.js
    /controllers            ← controllers per resource
    /middleware             ← auth, roles, errorHandler, rateLimiter
    /models                 ← Mongoose schemas
    /routes                 ← routes per resource
    /services               ← pdfGenerator.js
    /jobs                   ← cronJobs.js
    server.js
    seed.js
    .env
```

---

## Environmental Configuration

Create a `.env` file inside the `/server` folder. (A template is available in `/server/.env.example`).

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/hrm-db
JWT_ACCESS_SECRET=dev_access_secret_key_hrm_99332211
JWT_REFRESH_SECRET=dev_refresh_secret_key_hrm_11223399

# Cloudinary Upload Config (Optional - falls back to local uploads/ directory if empty)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Nodemailer SMTP Config (Optional - logs OTP codes to server console if empty)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@hrm-app.com
```

---

## Getting Started

### 1. Prerequisite Installations

Ensure you have [Node.js](https://nodejs.org) and [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally.

### 2. Seeding the Database

Populate the database with default departments, leave categories, open jobs, past payslips, attendance records, and **20 active employee accounts**.

```bash
cd hrm-app/server
npm run seed
```

Upon success, the following default credentials will be active:
*   **Super Admin**: `admin@hrm.com` / `Admin@123`
*   **HR Manager**: `hr@hrm.com` / `Welcome@123`
*   **Department Manager**: `engmanager@hrm.com` / `Welcome@123`
*   **Employee**: `david.miller@hrm.com` / `Welcome@123`

### 3. Run the Backend Server

```bash
cd hrm-app/server
npm run dev
```

The server will start listening at `http://127.0.0.1:5000` with the scheduler initialized.

### 4. Run the Vue 3 Client Application

Open a new terminal window:

```bash
cd hrm-app/client
npm run dev
```

The client dashboard will compile and open at `http://localhost:3000`. All requests under `/api/*` and `/uploads/*` will automatically proxy through to the server port.

---

## Architectural Highlights

*   **HTTP-Only Cookies Security**: Access tokens expire in 1 hour and are verified in headers. Refresh tokens expire in 7 days and are securely read from HTTP-only cookies.
*   **Dynamic Session Warn Modal**: App.vue initiates a warning popup at 58 minutes of session activity, offering extension prompts using silent Axios refreshes.
*   **GSAP Magnetic Physics**: HrmButton.vue implements interactive magnetic fields that warp button bounds on proximity, popping back with spring physics.
*   **Garbage Collection Cleanups**: All Three.js canvases explicitly dispose of WebGL frame renderers and clear event triggers on component unmount, preventing browser crashes.
*   **PDF Payslip Streams**: Payslips are designed using core Helvetica styles inside pdfmake, piping documents directly to HTTP response streams to minimize server disk writes.
