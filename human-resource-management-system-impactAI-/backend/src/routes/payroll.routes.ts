import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { oid, payrolls, PayrollDoc, serializeDoc, users } from '../services/mongo';

const router = Router();
router.use(requireAuth);

const upsertSchema = z.object({
  userId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  base: z.number().nonnegative(),
  allowance: z.number().nonnegative(),
  deduction: z.number().nonnegative(),
});

function toSalaryStructure(record: PayrollDoc) {
  return {
    basic: Number(record.base),
    hra: 0,
    da: 0,
    allowances: Number(record.allowance),
    deductions: Number(record.deduction),
    total: Number(record.net),
  };
}

function toPayslip(record: PayrollDoc) {
  const [year, monthNumber] = record.month.split('-').map(Number);
  const monthDate = new Date(year, monthNumber - 1, 1);
  return {
    id: record._id!.toHexString(),
    month: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    year,
    basic: Number(record.base),
    hra: 0,
    da: 0,
    allowances: Number(record.allowance),
    deductions: Number(record.deduction),
    netSalary: Number(record.net),
    paymentDate: `${record.month}-28`,
    status: 'Paid',
  };
}

router.get('/me', requireRole('EMPLOYEE', 'ADMIN'), async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string };
  const list = await (await payrolls()).find({ userId: oid(user.id) }).sort({ month: -1 }).toArray();
  res.json(list.map(serializeDoc));
});

router.get('/structure/me', requireRole('EMPLOYEE', 'ADMIN'), async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string };
  const record = await (await payrolls()).find({ userId: oid(user.id) }).sort({ month: -1 }).limit(1).next();

  if (!record) {
    return res.json({ basic: 0, hra: 0, da: 0, allowances: 0, deductions: 0, total: 0 });
  }

  res.json(toSalaryStructure(record));
});

router.get('/payslips', requireRole('EMPLOYEE', 'ADMIN'), async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string };
  const list = await (await payrolls()).find({ userId: oid(user.id) }).sort({ month: -1 }).toArray();
  res.json(list.map(toPayslip));
});

router.get('/payslips/:id/download', requireRole('EMPLOYEE', 'ADMIN'), async (req: Request, res: Response) => {
  const user = (req as any).user as { id: string; role: 'ADMIN' | 'EMPLOYEE' };
  const record = await (await payrolls()).findOne({ _id: oid(req.params.id) });
  if (!record) return res.status(404).json({ message: 'Payslip not found' });
  if (user.role !== 'ADMIN' && record.userId.toHexString() !== user.id) return res.status(403).json({ message: 'Forbidden' });

  const employee = await (await users()).findOne({ _id: record.userId });
  const slip = toPayslip(record);
  const content = [
    'HRMS Payslip',
    `Employee: ${employee?.name || employee?.email || record.userId.toHexString()}`,
    `Month: ${slip.month}`,
    `Basic: ${slip.basic}`,
    `Allowances: ${slip.allowances}`,
    `Deductions: ${slip.deductions}`,
    `Net Salary: ${slip.netSalary}`,
    `Payment Date: ${slip.paymentDate}`,
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="payslip-${record.month}.txt"`);
  res.send(content);
});

router.get('/', requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const [payrollList, userList] = await Promise.all([
    (await payrolls()).find().sort({ userId: 1, month: -1 }).toArray(),
    (await users()).find().toArray(),
  ]);
  const userMap = new Map(userList.map((u) => [u._id.toHexString(), u]));

  res.json(payrollList.map((record) => {
    const user = userMap.get(record.userId.toHexString());
    return serializeDoc({
      ...record,
      user: user ? { name: user.name, email: user.email, role: user.role } : undefined,
    } as any);
  }));
});

router.post('/', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const { userId, month, base, allowance, deduction } = parsed.data;
  const userObjectId = oid(userId);
  const net = base + allowance - deduction;
  const collection = await payrolls();
  const now = new Date();

  const existing = await collection.findOne({ userId: userObjectId, month });
  if (existing) {
    await collection.updateOne({ _id: existing._id }, { $set: { base, allowance, deduction, net, updatedAt: now } });
    return res.json(serializeDoc({ ...existing, base, allowance, deduction, net, updatedAt: now }));
  }

  const doc = { userId: userObjectId, month, base, allowance, deduction, net, createdAt: now, updatedAt: now };
  const result = await collection.insertOne(doc);
  res.json(serializeDoc({ _id: result.insertedId, ...doc }));
});

router.delete('/:id', requireRole('ADMIN'), async (req: Request, res: Response) => {
  await (await payrolls()).deleteOne({ _id: oid(req.params.id) });
  res.status(204).send();
});

export default router;
