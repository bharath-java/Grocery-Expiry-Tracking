# 🍏 Grocery Expiry Tracker

A complete, full-stack, production-ready web application built to prevent food waste through automated notifications, AI shelf-life predictions, and real-time synchronization.

---

## 📁 Repository Structure

```
├── backend/            # Express.js & TypeScript Server
├── frontend/           # Next.js 15, Tailwind CSS, & Zustand Client
├── uploads/            # Dynamic image upload storage fallback
├── .gitignore          # Repository git-ignore configuration
├── package.json        # Workspace coordinator scripts
├── README.md           # Documentation guide (this file)
└── vercel.json         # Deployment directives
```

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Zustand, Socket.io-client, Axios, jsPDF
- **Backend**: Node.js, Express.js, TypeScript, Mongoose, Socket.io, Node-Cron, Nodemailer
- **Database**: MongoDB (Local or Atlas)
- **Deployment**: Vercel (Frontend), Render/Railway (Backend)

---

## ⚙️ Ports Configurations

To prevent ports collisions, we run on custom, conflict-free ports:
- **Frontend Port**: `http://localhost:3001`
- **Backend API Port**: `http://localhost:5001`

---

## 🚀 Getting Started

### 1. Pre-requisites
Make sure you have **Node.js** and **MongoDB** installed and running on your local machine.

### 2. Install & Start Stack
You can run the entire workspace using the root coordinator script:

```bash
# Install root dependencies
npm install

# Start both backend and frontend servers concurrently
npm run dev
```

The frontend will run at `http://localhost:3001` and the backend will run at `http://localhost:5001`.
