# Smart Workforce Resource Allocation System

## Project Overview

A full-stack Human Resource Management System (HRMS) designed to streamline employee management, attendance tracking, leave management, and payroll processing with role-based access control.

---

## 🎯 Problem Statement

Manual HR processes are time-consuming, error-prone, and difficult to scale. Organizations need a unified platform to:
- Track employee attendance in real-time
- Manage leave requests with automated approvals
- Process payroll efficiently
- Generate insights through analytics dashboards

---

## 🚀 Key Features

### For Employees
- **Dashboard**: View leave balance, recent requests, and personal statistics
- **Attendance Management**: Check-in/check-out with automatic late detection (9:30 AM threshold)
- **Leave Application**: Apply for leaves with date range selection and reason
- **Leave History**: Track all leave requests with status (Pending/Approved/Rejected)
- **Payroll Access**: View salary structure and download payslips
- **Profile Management**: Update personal information

### For Admins
- **Admin Dashboard**: Overview of all HR metrics (total requests, pending, approved, rejected)
- **Employee Management**: View and manage all employees in the system
- **Leave Management**: Approve or reject leave requests with one click
- **Payroll Management**: Generate payroll, update salaries, manage deductions
- **Analytics**: View attendance trends, department distribution, and payroll summaries
- **Recent Activity Feed**: Monitor all recent leave activities across the organization

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **React Router v7** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Vite** - Build tool
- **Vitest** - Testing framework

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - NoSQL database
- **JWT (jsonwebtoken)** - Authentication
- **Bcrypt** - Password hashing
- **Zod** - Schema validation
- **Helmet** - Security headers
- **Morgan** - Request logging
- **CORS** - Cross-origin resource sharing

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts              # Environment configuration
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT authentication & role guards
│   │   │   └── error.ts            # Centralized error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.ts      # Login, signup
│   │   │   ├── attendance.routes.ts # Check-in/out, stats
│   │   │   ├── leave.routes.ts     # Apply, approve, reject leaves
│   │   │   ├── payroll.routes.ts   # Salary management
│   │   │   ├── dashboard.routes.ts # Stats for dashboards
│   │   │   ├── user.routes.ts      # User management
│   │   │   └── analytics.routes.ts # Analytics data
│   │   ├── services/
│   │   │   └── mongo.ts            # MongoDB connection & helpers
│   │   ├── utils/
│   │   │   └── jwt.ts              # JWT sign/verify
│   │   └── index.ts                # Express app entry point
│   ├── scripts/
│   │   ├── seed.ts                 # Database seeding
│   │   └── migrate-to-atlas.js     # MongoDB Atlas migration
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/          # Dashboard-specific components
│   │   │   ├── layout/             # Layout, Navbar, Sidebar
│   │   │   ├── leave/              # Leave modals
│   │   │   ├── payroll/            # Payroll components
│   │   │   ├── security/           # ProtectedRoute, RoleGuard
│   │   │   ├── shared/             # StatusBadge, etc.
│   │   │   └── ui/                 # Reusable UI components
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx     # Global auth state
│   │   ├── pages/
│   │   │   ├── admin/              # Admin pages
│   │   │   ├── employee/           # Employee pages
│   │   │   ├── auth/               # Login, Signup
│   │   │   ├── leave/              # Leave application & history
│   │   │   └── profile/            # Profile page
│   │   ├── services/               # API service layer
│   │   │   ├── authService.ts
│   │   │   ├── attendanceService.ts
│   │   │   ├── leaveService.ts
│   │   │   ├── payrollService.ts
│   │   │   ├── dashboardService.ts
│   │   │   └── userService.ts
│   │   ├── types/                  # TypeScript types
│   │   ├── App.tsx                 # Route configuration
│   │   └── main.tsx                # React entry point
│   ├── package.json
│   └── vite.config.js
│
├── .env.example
└── README.md
```

---

## 🗄️ Database Schema

### Collections

#### **users**
```typescript
{
  _id: ObjectId
  email: string (unique)
  passwordHash: string
  role: 'ADMIN' | 'EMPLOYEE'
  name: string | null
  createdAt: Date
  updatedAt: Date
}
```
**Indexes:** `email` (unique)

#### **attendances**
```typescript
{
  _id: ObjectId
  userId: ObjectId
  day: string          // Format: 'YYYY-MM-DD'
  checkIn: Date | null
  checkOut: Date | null
  isLeave: boolean
  createdAt: Date
  updatedAt: Date
}
```
**Indexes:** `(userId, day)` (unique compound index)

#### **leaves**
```typescript
{
  _id: ObjectId
  userId: ObjectId
  startDay: string     // Format: 'YYYY-MM-DD'
  endDay: string       // Format: 'YYYY-MM-DD'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reason: string | null
  createdAt: Date
  updatedAt: Date
}
```

#### **payrolls**
```typescript
{
  _id: ObjectId
  userId: ObjectId
  month: string        // Format: 'YYYY-MM'
  base: number
  allowance: number
  deduction: number
  net: number          // Calculated: base + allowance - deduction
  createdAt: Date
  updatedAt: Date
}
```
**Indexes:** `(userId, month)` (unique compound index)

---

## 🔐 Authentication & Security

### JWT Authentication Flow
1. User submits credentials (email + password)
2. Backend validates and hashes password with bcrypt (10 rounds)
3. JWT signed with HS256 containing `{ id, role }`
4. Token returned to client, stored in localStorage
5. Frontend includes token in `Authorization: Bearer <token>` header
6. Backend middleware validates JWT and attaches user to request

### Role-Based Access Control (RBAC)
- **Backend Middleware**: `requireAuth()` validates JWT, `requireRole(...roles)` checks user role
- **Frontend Guards**: `ProtectedRoute` checks authentication, `RoleGuard` checks authorization
- **Two Roles**: ADMIN (full access), EMPLOYEE (limited access)

### Security Features
- Password hashing with bcrypt
- JWT token-based authentication
- Helmet for security headers
- CORS configuration
- Input validation with Zod schemas
- Centralized error handling (no stack trace leaks)
- Role-based route protection

---

## 🧩 Key Technical Implementations

### 1. Leave Overlap Detection
**Challenge**: Prevent employees from applying for overlapping leave periods.

**Solution**: MongoDB range overlap query
```typescript
{
  userId,
  status: { $in: ['PENDING', 'APPROVED'] },
  startDay: { $lte: endDay },    // Existing starts before/at new end
  endDay: { $gte: startDay }     // Existing ends after/at new start
}
```

### 2. Auto-Marking Attendance on Leave Approval
**Challenge**: When leave is approved, mark all days in range as leave days.

**Solution**: 
- `enumerateDays()` function generates all dates in range
- For each day: update existing attendance or insert new record
- Set `isLeave: true`, clear `checkIn/checkOut`

### 3. Late Detection Logic
**Challenge**: Track employees who arrive late.

**Solution**: Check-in time threshold at 9:30 AM
```typescript
if (checkInTime.getHours() > 9 || 
   (checkInTime.getHours() === 9 && checkInTime.getMinutes() > 30)) {
  stats.late++;
}
```

### 4. Attendance Duplicate Prevention
**Challenge**: Prevent multiple check-ins on same day.

**Solution**:
- Unique compound index: `(userId, day)`
- Stateful validation: check if `checkIn` exists before allowing `checkOut`
- Prevent operations when `isLeave: true`

### 5. Payroll Upsert Pattern
**Challenge**: Support both creating and updating payroll for same employee/month.

**Solution**:
- Check if record exists for `(userId, month)`
- Update if exists, insert if not
- Calculate `net` server-side (never trust client)

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Attendance
- `POST /api/attendance/check-in` - Check in for today
- `POST /api/attendance/check-out` - Check out for today
- `GET /api/attendance/me` - Get my attendance records
- `GET /api/attendance` - Get all attendance (Admin only)
- `GET /api/attendance/stats/monthly` - Get monthly stats

### Leave Management
- `POST /api/leave/apply` - Apply for leave
- `GET /api/leave/me` - Get my leave requests
- `GET /api/leave/pending` - Get pending leaves (Admin only)
- `GET /api/leave/all` - Get all leaves (Admin only)
- `POST /api/leave/:id/approve` - Approve leave (Admin only)
- `POST /api/leave/:id/reject` - Reject leave (Admin only)

### Payroll
- `GET /api/payroll/me` - Get my payroll records
- `GET /api/payroll/structure/me` - Get my salary structure
- `GET /api/payroll/payslips` - Get my payslips
- `GET /api/payroll/payslips/:id/download` - Download payslip
- `GET /api/payroll` - Get all payrolls (Admin only)
- `POST /api/payroll` - Create/update payroll (Admin only)
- `DELETE /api/payroll/:id` - Delete payroll (Admin only)

### Dashboard
- `GET /api/dashboard/admin-stats` - Admin dashboard stats
- `GET /api/dashboard/employee-stats` - Employee dashboard stats

### Analytics
- `GET /api/analytics/summary` - Summary stats (Admin only)
- `GET /api/analytics/attendance-trends` - 7-day attendance trends (Admin only)
- `GET /api/analytics/department-distribution` - Department stats (Admin only)

---

## 🚦 Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (v7.0+)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB connection string
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend (.env)**
```
PORT=4000
NODE_ENV=development
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRES_IN=1d
DATABASE_URL=mongodb://127.0.0.1:27017/hrms_impactai
```

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
```

**Test Coverage:**
- Component rendering tests
- Auth flow tests (Login, Signup)
- Protected route tests
- Role guard tests
- Dashboard data loading tests

---

## 🎨 Design Decisions

### 1. Direct MongoDB Driver (Not Mongoose)
**Reason**: Lightweight operations without ODM overhead. TypeScript interfaces provide type safety without abstraction. Results in faster queries and smaller bundle size.

### 2. JWT in LocalStorage
**Reason**: Simpler for SPA architecture, works across subdomains. Trade-off: XSS vulnerability (acceptable with proper sanitization).

### 3. Date Format as String ('YYYY-MM-DD')
**Reason**: Avoids timezone issues. MongoDB indexes strings efficiently. Easier to display and validate.

### 4. Separate Service Layer
**Reason**: Centralized API calls instead of Axios in components. Easier to mock in tests, single source of truth for endpoints.

### 5. Context API (Not Redux)
**Reason**: App complexity doesn't justify Redux overhead. Context API sufficient for global auth state.

---

## 📊 Future Enhancements

### Short-term
- [ ] Refresh token rotation for enhanced security
- [ ] Redis caching for dashboard stats
- [ ] React Query for better data fetching and caching
- [ ] Comprehensive integration tests
- [ ] Email notifications for leave approvals

### Long-term
- [ ] Multi-tenant architecture
- [ ] Advanced analytics with charts (Chart.js/Recharts)
- [ ] Document management system
- [ ] Performance reviews module
- [ ] Recruitment pipeline
- [ ] Time tracking with project assignments
- [ ] Mobile app (React Native)
- [ ] Export reports (PDF/Excel)
- [ ] Slack/Teams integration
- [ ] SSO with OAuth providers

---

## 🐛 Known Limitations

1. **No refresh token**: JWT doesn't refresh automatically
2. **Basic analytics**: No ML or predictive insights
3. **Single organization**: No multi-tenancy support
4. **Text payslips**: No PDF generation
5. **No file uploads**: Can't attach documents to leave requests
6. **Basic department structure**: Only ADMIN/EMPLOYEE roles
7. **No audit logs**: Can't track who modified what

---

## 📈 Performance Considerations

- **Database Indexes**: Unique compound indexes on high-query fields
- **Pagination**: Not implemented yet (all queries fetch full dataset)
- **Caching**: No Redis layer (relies on in-memory caching)
- **Bundle Size**: Frontend ~150KB gzipped
- **API Response Time**: <100ms for most endpoints (localhost)

---

## 👥 Roles & Permissions Matrix

| Feature | ADMIN | EMPLOYEE |
|---------|-------|----------|
| View own attendance | ✅ | ✅ |
| Check-in/Check-out | ✅ | ✅ |
| Apply for leave | ✅ | ✅ |
| View own leaves | ✅ | ✅ |
| View own payroll | ✅ | ✅ |
| Download own payslip | ✅ | ✅ |
| View all attendance | ✅ | ❌ |
| View all employees | ✅ | ❌ |
| Approve/Reject leaves | ✅ | ❌ |
| Manage payroll | ✅ | ❌ |
| View analytics | ✅ | ❌ |

---

## 📝 License

This project is private and proprietary.

---

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

---

## 🙏 Acknowledgments

- Built as a smart workforce resource allocation system
- Designed to solve real HR management challenges
- Focus on security, scalability, and user experience

---

**Last Updated**: June 2026
