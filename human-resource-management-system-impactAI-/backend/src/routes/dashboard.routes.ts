import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { leaves, oid, serializeDoc, users } from '../services/mongo';

const router = Router();
router.use(requireAuth);

router.get('/admin-stats', requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const collection = await leaves();
  const [totalRequests, pendingRequests, approvedRequests, rejectedRequests, recentActivity] = await Promise.all([
    collection.countDocuments(),
    collection.countDocuments({ status: 'PENDING' }),
    collection.countDocuments({ status: 'APPROVED' }),
    collection.countDocuments({ status: 'REJECTED' }),
    collection.find().sort({ createdAt: -1 }).limit(5).toArray(),
  ]);
  const userIds = recentActivity.map((leave) => leave.userId);
  const recentUsers = userIds.length
    ? await (await users()).find({ _id: { $in: userIds } }).toArray()
    : [];
  const userMap = new Map(recentUsers.map((user) => [user._id!.toHexString(), user]));

  res.json({
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    recentActivity: recentActivity.map((leave) => ({
      id: leave._id.toHexString(),
      user: userMap.get(leave.userId.toHexString())?.name
        || userMap.get(leave.userId.toHexString())?.email
        || 'Unknown Employee',
      type: leave.reason || 'Leave Request',
      status: leave.status.toLowerCase(),
      date: leave.createdAt.toISOString().split('T')[0],
    })),
  });
});

router.get('/employee-stats', requireRole('EMPLOYEE', 'ADMIN'), async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string };
  const userId = oid(user.id);
  const collection = await leaves();
  const [leavesApplied, pendingLeaves, approvedLeaves, rejectedLeaves, recentRequests, approvedLeavesList] = await Promise.all([
    collection.countDocuments({ userId }),
    collection.countDocuments({ userId, status: 'PENDING' }),
    collection.countDocuments({ userId, status: 'APPROVED' }),
    collection.countDocuments({ userId, status: 'REJECTED' }),
    collection.find({ userId }).sort({ createdAt: -1 }).limit(5).toArray(),
    collection.find({ userId, status: 'APPROVED' }).toArray(),
  ]);

  const daysUsed = approvedLeavesList.reduce((sum, leave) => {
    const start = new Date(leave.startDay);
    const end = new Date(leave.endDay);
    return sum + Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, 0);

  res.json({
    leavesApplied,
    pendingLeaves,
    approvedLeaves,
    rejectedLeaves,
    leaveBalance: 20 - daysUsed,
    recentRequests: recentRequests.map((leave) => ({
      ...serializeDoc(leave),
      type: leave.reason || 'Leave Request',
      status: leave.status.toLowerCase(),
      startDate: leave.startDay,
      endDate: leave.endDay,
    })),
  });
});

export default router;
