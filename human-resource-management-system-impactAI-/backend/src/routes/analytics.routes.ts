import { Router, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { attendances, leaves, payrolls, users } from '../services/mongo';

const router = Router();
router.use(requireAuth);
router.use(requireRole('ADMIN'));

function getDatesInRange(startDate: Date, endDate: Date) {
  const dates = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

router.get('/summary', async (_req, res: Response) => {
  const today = formatDate(new Date());
  const currentMonth = today.substring(0, 7);
  const [employeeCount, onLeaveToday, payrollList] = await Promise.all([
    (await users()).countDocuments(),
    (await leaves()).countDocuments({ status: 'APPROVED', startDay: { $lte: today }, endDay: { $gte: today } }),
    (await payrolls()).find({ month: currentMonth }).toArray(),
  ]);

  res.json({
    employeeCount,
    activeEmployees: employeeCount,
    onLeaveToday,
    totalPayroll: payrollList.reduce((sum, item) => sum + Number(item.net || 0), 0),
  });
});

router.get('/attendance-trends', async (_req, res: Response) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6);

  const formattedDates = getDatesInRange(startDate, endDate).map(formatDate);
  const [totalUsers, attendanceList, leaveList] = await Promise.all([
    (await users()).countDocuments(),
    (await attendances()).find({ day: { $in: formattedDates } }).toArray(),
    (await leaves()).find({ status: 'APPROVED', startDay: { $lte: formattedDates[formattedDates.length - 1] }, endDay: { $gte: formattedDates[0] } }).toArray(),
  ]);

  res.json(formattedDates.map((date) => {
    const present = attendanceList.filter((record) => record.day === date && record.checkIn).length;
    const leave = leaveList.filter((record) => record.startDay <= date && record.endDay >= date).length;
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      present,
      leave,
      absent: Math.max(0, totalUsers - present - leave),
    };
  }));
});

router.get('/department-distribution', async (_req, res: Response) => {
  const [adminCount, employeeCount] = await Promise.all([
    (await users()).countDocuments({ role: 'ADMIN' }),
    (await users()).countDocuments({ role: 'EMPLOYEE' }),
  ]);

  res.json([
    { department: 'Administration', count: adminCount },
    { department: 'Engineering', count: employeeCount },
    { department: 'HR', count: 0 },
    { department: 'Sales', count: 0 },
  ]);
});

export default router;
