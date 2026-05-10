import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { attendances, leaves, nowFields, oid, payrolls, publicUser, users } from '../services/mongo';

const router = Router();
router.use(requireAuth);

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
  password: z.string().min(6).optional(),
});

router.get('/me', async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string };
  const profile = await (await users()).findOne({ _id: oid(user.id) });
  if (!profile) return res.status(404).json({ message: 'User not found' });
  res.json(publicUser(profile));
});

router.put('/me', async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string };
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  await (await users()).updateOne(
    { _id: oid(user.id) },
    { $set: { name: parsed.data.name, updatedAt: new Date() } }
  );
  const updated = await (await users()).findOne({ _id: oid(user.id) });
  if (!updated) return res.status(404).json({ message: 'User not found' });
  res.json(publicUser(updated));
});

router.get('/', requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const list = await (await users()).find({}, { projection: { passwordHash: 0 } }).toArray();
  res.json(list.map((user: any) => ({ id: user._id.toHexString(), email: user.email, name: user.name, role: user.role })));
});

router.post('/', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const createSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
    role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
  });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const { email, password, name, role } = parsed.data;
  const collection = await users();
  const existing = await collection.findOne({ email });
  if (existing) return res.status(400).json({ message: 'User already exists' });

  const result = await collection.insertOne({
    email,
    passwordHash: await bcrypt.hash(password, 10),
    name,
    role: role ?? 'EMPLOYEE',
    ...nowFields(),
  });
  const user = await collection.findOne({ _id: result.insertedId });
  if (!user) return res.status(500).json({ message: 'User creation failed' });
  res.json(publicUser(user));
});

router.put('/:id', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const data: any = { ...parsed.data, updatedAt: new Date() };
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }

  await (await users()).updateOne({ _id: oid(req.params.id) }, { $set: data });
  const updated = await (await users()).findOne({ _id: oid(req.params.id) });
  if (!updated) return res.status(404).json({ message: 'User not found' });
  res.json(publicUser(updated));
});

router.delete('/:id', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const userId = oid(req.params.id);
  await Promise.all([
    (await users()).deleteOne({ _id: userId }),
    (await attendances()).deleteMany({ userId }),
    (await leaves()).deleteMany({ userId }),
    (await payrolls()).deleteMany({ userId }),
  ]);
  res.status(204).send();
});

export default router;
