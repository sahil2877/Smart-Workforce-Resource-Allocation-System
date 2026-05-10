import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { attendances, leaves, oid, serializeDoc, users } from '../services/mongo';

const router = Router();

const applySchema = z.object({
  startDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});

router.use(requireAuth);

router.post('/apply', requireRole('EMPLOYEE', 'ADMIN'), async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string };
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const { startDay, endDay, reason } = parsed.data;
  const collection = await leaves();
  const userId = oid(user.id);
  const overlap = await collection.findOne({
    userId,
    status: { $in: ['PENDING', 'APPROVED'] },
    startDay: { $lte: endDay },
    endDay: { $gte: startDay },
  });
  if (overlap) return res.status(400).json({ message: 'Overlapping leave exists' });

  const now = new Date();
  const doc = { userId, startDay, endDay, reason: reason ?? null, status: 'PENDING' as const, createdAt: now, updatedAt: now };
  const result = await collection.insertOne(doc);
  res.json(serializeDoc({ _id: result.insertedId, ...doc }));
});

router.get('/pending', requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const list = await leavesWithUsers({ status: 'PENDING' });
  res.json(list);
});

router.get('/all', requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const list = await leavesWithUsers({});
  res.json(list);
});

router.post('/:id/approve', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const collection = await leaves();
  const leaveId = oid(req.params.id);
  const now = new Date();
  await collection.updateOne({ _id: leaveId }, { $set: { status: 'APPROVED', updatedAt: now } });
  const leave = await collection.findOne({ _id: leaveId });
  if (!leave) return res.status(404).json({ message: 'Leave not found' });

  const attendanceCollection = await attendances();
  for (const day of enumerateDays(leave.startDay, leave.endDay)) {
    const existing = await attendanceCollection.findOne({ userId: leave.userId, day });
    if (existing) {
      await attendanceCollection.updateOne(
        { _id: existing._id },
        { $set: { isLeave: true, checkIn: null, checkOut: null, updatedAt: now } }
      );
    } else {
      await attendanceCollection.insertOne({
        userId: leave.userId,
        day,
        isLeave: true,
        checkIn: null,
        checkOut: null,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  res.json(serializeDoc(leave));
});

router.post('/:id/reject', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const collection = await leaves();
  const leaveId = oid(req.params.id);
  const now = new Date();
  await collection.updateOne({ _id: leaveId }, { $set: { status: 'REJECTED', updatedAt: now } });
  const leave = await collection.findOne({ _id: leaveId });
  if (!leave) return res.status(404).json({ message: 'Leave not found' });
  res.json(serializeDoc(leave));
});

router.get('/me', requireRole('EMPLOYEE', 'ADMIN'), async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string };
  const list = await (await leaves()).find({ userId: oid(user.id) }).sort({ createdAt: -1 }).toArray();
  res.json(list.map(serializeDoc));
});

async function leavesWithUsers(filter: Record<string, unknown>) {
  const [leaveList, userList] = await Promise.all([
    (await leaves()).find(filter).sort({ createdAt: -1 }).toArray(),
    (await users()).find().toArray(),
  ]);
  const userMap = new Map(userList.map((u) => [u._id.toHexString(), u]));

  return leaveList.map((leave) => {
    const user = userMap.get(leave.userId.toHexString());
    return serializeDoc({ ...leave, user: user ? { email: user.email } : undefined } as any);
  });
}

function enumerateDays(startDay: string, endDay: string): string[] {
  const res: string[] = [];
  const start = new Date(startDay + 'T00:00:00Z');
  const end = new Date(endDay + 'T00:00:00Z');
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    res.push(`${y}-${m}-${day}`);
  }
  return res;
}

export default router;
