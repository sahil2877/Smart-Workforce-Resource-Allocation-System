import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signJwt } from '../utils/jwt';
import { nowFields, publicUser, users } from '../services/mongo';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
});

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const { email, password, role, name } = parsed.data;
  const userCollection = await users();
  const existing = await userCollection.findOne({ email });
  if (existing) return res.status(400).json({ message: 'User already exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await userCollection.insertOne({
    email,
    passwordHash,
    role: role ?? 'EMPLOYEE',
    name: name ?? null,
    ...nowFields(),
  });

  const user = await userCollection.findOne({ _id: result.insertedId });
  if (!user) return res.status(500).json({ message: 'User creation failed' });

  const token = signJwt({ id: user._id.toHexString(), role: user.role });
  return res.json({ token, role: user.role, user: publicUser(user) });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const { email, password } = parsed.data;
  const user = await (await users()).findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signJwt({ id: user._id.toHexString(), role: user.role });
  return res.json({ token, role: user.role, user: publicUser(user) });
});

export default router;
