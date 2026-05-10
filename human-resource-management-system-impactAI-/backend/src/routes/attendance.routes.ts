import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { attendances, oid, serializeDoc, users } from '../services/mongo';

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const router = Router();
router.use(requireAuth);

router.post('/check-in', async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string };
  const collection = await attendances();
  const userId = oid(user.id);
  const day = todayKey();
  const existing = await collection.findOne({ userId, day });

  if (existing?.checkIn) return res.status(400).json({ message: 'Already checked in today' });
  if (existing?.isLeave) return res.status(400).json({ message: 'On leave today' });

  const now = new Date();
  if (existing) {
    await collection.updateOne({ _id: existing._id }, { $set: { checkIn: now, updatedAt: now } });
    return res.json(serializeDoc({ ...existing, checkIn: now, updatedAt: now }));
  }

  const doc = { userId, day, checkIn: now, checkOut: null, isLeave: false, createdAt: now, updatedAt: now };
  const result = await collection.insertOne(doc);
  res.json(serializeDoc({ _id: result.insertedId, ...doc }));
});

router.post('/check-out', async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string };
  const collection = await attendances();
  const existing = await collection.findOne({ userId: oid(user.id), day: todayKey() });

  if (!existing?.checkIn) return res.status(400).json({ message: 'Check-in required' });
  if (existing.checkOut) return res.status(400).json({ message: 'Already checked out today' });
  if (existing.isLeave) return res.status(400).json({ message: 'On leave today' });

  const now = new Date();
  await collection.updateOne({ _id: existing._id }, { $set: { checkOut: now, updatedAt: now } });
  res.json(serializeDoc({ ...existing, checkOut: now, updatedAt: now }));
});

router.get('/me', async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string };
  const list = await (await attendances()).find({ userId: oid(user.id) }).sort({ day: -1 }).toArray();
  res.json(list.map(serializeDoc));
});

router.get('/', requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const [attendanceList, userList] = await Promise.all([
    (await attendances()).find().sort({ day: -1 }).toArray(),
    (await users()).find().toArray(),
  ]);
  const userMap = new Map(userList.map((u) => [u._id.toHexString(), u]));

  res.json(attendanceList.map((record) => {
    const user = userMap.get(record.userId.toHexString());
    return serializeDoc({
      ...record,
      user: user ? { name: user.name, email: user.email } : undefined,
    } as any);
  }));
});

router.get('/stats/monthly', async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string };
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const records = await (await attendances()).find({
    userId: oid(user.id),
    day: { $gte: `${year}-${month}-01`, $lte: `${year}-${month}-31` },
  }).toArray();

  const stats = {
    present: records.filter((r) => r.checkIn && !r.isLeave).length,
    absent: 0,
    late: 0,
    halfDays: 0,
  };

  records.forEach((r) => {
    if (r.checkIn) {
      const checkInTime = new Date(r.checkIn);
      if (checkInTime.getHours() > 9 || (checkInTime.getHours() === 9 && checkInTime.getMinutes() > 30)) {
        stats.late++;
      }
    }
  });

  res.json(stats);
});

export default router;
