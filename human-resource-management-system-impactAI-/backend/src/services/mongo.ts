import { MongoClient, ObjectId, Db, Collection, Document } from 'mongodb';
import { config } from '../config/env';

export type Role = 'ADMIN' | 'EMPLOYEE';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserDoc extends Document {
  _id?: ObjectId;
  email: string;
  name?: string | null;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceDoc extends Document {
  _id?: ObjectId;
  userId: ObjectId;
  day: string;
  checkIn?: Date | null;
  checkOut?: Date | null;
  isLeave: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveDoc extends Document {
  _id?: ObjectId;
  userId: ObjectId;
  startDay: string;
  endDay: string;
  status: LeaveStatus;
  reason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollDoc extends Document {
  _id?: ObjectId;
  userId: ObjectId;
  month: string;
  base: number;
  allowance: number;
  deduction: number;
  net: number;
  createdAt: Date;
  updatedAt: Date;
}

const client = new MongoClient(config.databaseUrl);
let db: Db | null = null;

export async function getDb() {
  if (!db) {
    await client.connect();
    db = client.db();
    await ensureIndexes(db);
  }
  return db;
}

async function ensureIndexes(database: Db) {
  await Promise.all([
    database.collection('users').createIndex({ email: 1 }, { unique: true }),
    database.collection('attendances').createIndex({ userId: 1, day: 1 }, { unique: true }),
    database.collection('payrolls').createIndex({ userId: 1, month: 1 }, { unique: true }),
  ]);
}

export async function users(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>('users');
}

export async function attendances(): Promise<Collection<AttendanceDoc>> {
  return (await getDb()).collection<AttendanceDoc>('attendances');
}

export async function leaves(): Promise<Collection<LeaveDoc>> {
  return (await getDb()).collection<LeaveDoc>('leaves');
}

export async function payrolls(): Promise<Collection<PayrollDoc>> {
  return (await getDb()).collection<PayrollDoc>('payrolls');
}

export function oid(id: string) {
  return new ObjectId(id);
}

export function nowFields() {
  const now = new Date();
  return { createdAt: now, updatedAt: now };
}

export function publicUser(user: UserDoc) {
  return {
    id: user._id!.toHexString(),
    email: user.email,
    role: user.role,
    name: user.name || user.email,
  };
}

export function serializeDoc<T extends { _id: ObjectId }>(doc: T) {
  const { _id, ...rest } = doc as any;
  return { id: _id.toHexString(), ...rest };
}
