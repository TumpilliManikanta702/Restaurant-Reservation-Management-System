import express from 'express';
import Table from '../models/Table.js';
import Reservation from '../models/Reservation.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.get('/availability', asyncHandler(async (req, res) => {
  const { date, timeSlot } = req.query;
  if (!date || !timeSlot) {
    const error = new Error('date and timeSlot are required');
    error.statusCode = 400;
    throw error;
  }

  const tables = await Table.find({ isActive: true }).lean();
  const reservations = await Reservation.find({ date, timeSlot, status: 'confirmed' }).lean();
  const occupiedTableIds = new Set(reservations.map((reservation) => reservation.table.toString()));
  const availableTables = tables.filter((table) => !occupiedTableIds.has(table._id.toString()));
  res.json(availableTables);
}));

router.get('/', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
  const tables = await Table.find().sort({ tableNumber: 1 });
  res.json(tables);
}));

router.post('/', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { tableNumber, capacity } = req.body;
  const table = await Table.create({ tableNumber, capacity, isActive: true });
  res.status(201).json(table);
}));

router.patch('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) {
    const error = new Error('Table not found');
    error.statusCode = 404;
    throw error;
  }
  Object.assign(table, req.body);
  await table.save();
  res.json(table);
}));

export default router;
