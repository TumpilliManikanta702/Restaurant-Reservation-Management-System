import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

const createToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    const error = new Error('Name, email and password are required');
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error('Password must be at least 6 characters long');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: 'customer' });

  res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token: createToken(user)
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token: createToken(user)
  });
}));

export default router;
