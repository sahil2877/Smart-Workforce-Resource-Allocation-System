# HRMS Backend (Express + MongoDB)

This backend powers authentication, role-based access, attendance, leave management, payroll, dashboard stats, and analytics for the HRMS app.

## Requirements

- Node.js 18+
- MongoDB installed locally and running
- MongoDB Compass if you want to view the database visually

## MongoDB Connection

The project uses this local database URL:

```env
DATABASE_URL=mongodb://127.0.0.1:27017/hrms_impactai
```

Open MongoDB Compass, paste the same URL, and you will see the `hrms_impactai` database after `npm run seed` or after using the app.

## Setup

```powershell
Copy-Item .env.example .env
npm install
npm run seed
npm run dev
```

Server runs at `http://localhost:4000`.

## Demo Users

- Admin: `admin@hrms.local` / `Admin@123`
- Employee: `employee@hrms.local` / `Employee@123`

## Main APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`
- `GET /api/attendance/me`
- `POST /api/leave/apply`
- `GET /api/leave/all`
- `POST /api/leave/:id/approve`
- `POST /api/leave/:id/reject`
- `GET /api/payroll/me`
- `GET /api/payroll/structure/me`
- `GET /api/payroll/payslips`
- `GET /api/payroll/payslips/:id/download`
