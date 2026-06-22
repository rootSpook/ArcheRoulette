import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';

dotenv.config();

const USERNAME = 'admin';
const PASSWORD = 'admin123';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('MongoDB connected');

  const existing = await User.findOne({ username: USERNAME });
  if (existing) {
    console.log('Admin user already exists, skipping.');
    await mongoose.disconnect();
    return;
  }

  await User.create({ username: USERNAME, password: PASSWORD, role: 'admin' });
  console.log(`Admin user created — username: ${USERNAME}, password: ${PASSWORD}`);
  console.log('Change the password after first login!');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
