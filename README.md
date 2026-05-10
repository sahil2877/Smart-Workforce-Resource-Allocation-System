# Smart Workforce Resource Allocation System

A web-based workforce management system built using React, TypeScript, Node.js, Express, and MongoDB with role-based access for Admin and Employee users.

<div align="center">

# Smart Workforce Resource Allocation System

**A full-stack HR and workforce allocation platform for managing employees, attendance, leave requests, payroll, and workforce analytics.**

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

</div>

---

## Project Structure

```bash
Smart-Workforce-Resource-Allocation-System/
│
├── human-resource-management-system-impactAI-/
│   │
│   ├── backend/
│   │   ├── scripts/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── contexts/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── README.md
│
└── README.md
```

## Features

| Feature | Description |
|--------|-------------|
| Authentication | Secure login and signup using JWT authentication |
| Role-Based Access | Separate dashboards and permissions for Admin and Employee |
| Employee Management | Admin can add, update, delete, and manage employees |
| Attendance Management | Employees can check in and check out daily |
| Leave Management | Employees can apply for leave and track leave status |
| Leave Approval | Admin can approve or reject employee leave requests |
| Payroll Management | Admin can manage employee salary and payroll records |
| Dashboard Analytics | Admin can view leave stats, employee count, payroll summary, and recent activity |
| MongoDB Integration | Persistent data storage using MongoDB database |

---

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router
- Lucide Icons

**Backend**
- Node.js
- Express.js
- TypeScript
- MongoDB
- JWT Authentication
- bcrypt.js
- Zod Validation

**Database**
- MongoDB
- MongoDB Compass for database visualization

---

## Getting Started

**Prerequisites:** Node.js and MongoDB installed on your system.

```bash
git clone https://github.com/sahil2877/Smart-Workforce-Resource-Allocation-System.git
cd Smart-Workforce-Resource-Allocation-System/human-resource-management-system-impactAI-
```

MongoDB connection URL:

```bash
mongodb://127.0.0.1:27017/hrms_impactai
```

---

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

Backend server will run at:

```bash
http://localhost:4000
```

---

## Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at:

```bash
http://localhost:5173
```

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hrms.local | Admin@123 |
| Employee | employee@hrms.local | Employee@123 |

---

## MongoDB Database

Use MongoDB Compass and connect with:

```bash
mongodb://127.0.0.1:27017/hrms_impactai
```

After running the seed command or using the app, you will see collections like:

```bash
users
attendances
leaves
payrolls
```

---

## Main Modules

| Module | Description |
|--------|-------------|
| Admin Dashboard | Shows overall leave requests, approvals, rejections, and recent activity |
| Employee Dashboard | Shows leave balance, requests, and employee-specific stats |
| Attendance | Handles employee check-in and check-out |
| Leave | Handles leave application, approval, rejection, and history |
| Payroll | Handles employee salary structure and payslip records |
| Profile | Allows users to view and update profile information |

---

## Author

**Sahil Belim**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/sahil2877)

---

<div align="center">
  <sub>Built with React, Node.js & MongoDB</sub>
</div>
