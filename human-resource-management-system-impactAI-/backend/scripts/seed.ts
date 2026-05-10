import bcrypt from 'bcryptjs';
import { nowFields, users } from '../src/services/mongo';

async function main() {
  const userCollection = await users();
  const demoUsers = [
    {
      email: 'admin@hrms.local',
      password: 'Admin@123',
      name: 'Admin User',
      role: 'ADMIN' as const,
    },
    {
      email: 'employee@hrms.local',
      password: 'Employee@123',
      name: 'Employee User',
      role: 'EMPLOYEE' as const,
    },
  ];

  for (const demoUser of demoUsers) {
    const existing = await userCollection.findOne({ email: demoUser.email });
    if (existing) continue;

    await userCollection.insertOne({
      email: demoUser.email,
      name: demoUser.name,
      role: demoUser.role,
      passwordHash: await bcrypt.hash(demoUser.password, 10),
      ...nowFields(),
    });
  }

  console.log('Seed complete: admin and employee users created');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
