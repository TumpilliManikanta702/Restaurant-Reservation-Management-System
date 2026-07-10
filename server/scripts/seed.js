import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import Table from '../src/models/Table.js';

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await User.deleteMany({});
  await Table.deleteMany({});

  const adminPasswordHash = await bcrypt.hash('AdminPass123', 10);
  await User.create({
    name: 'Admin User',
    email: 'admin@restaurant.com',
    passwordHash: adminPasswordHash,
    role: 'admin'
  });

  const tables = [
    { tableNumber: 1, capacity: 2 },
    { tableNumber: 2, capacity: 4 },
    { tableNumber: 3, capacity: 2 },
    { tableNumber: 4, capacity: 6 },
    { tableNumber: 5, capacity: 4 },
    { tableNumber: 6, capacity: 8 }
  ];

  await Table.create(tables);
  console.log('Seed completed');
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
