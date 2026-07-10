import express from 'express';
import Reservation from '../models/Reservation.js';
import Table from '../models/Table.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createReservation } from '../services/reservationService.js';

const router = express.Router();

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { tableId, date, timeSlot, guests } = req.body;
  const reservation = await createReservation({ userId: req.user._id, tableId, date, timeSlot, guests });
  res.status(201).json(reservation);
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id }).populate('table').sort({ date: 1, createdAt: -1 });
  res.json(reservations);
}));

router.patch('/:id/cancel', requireAuth, asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    const error = new Error('Reservation not found');
    error.statusCode = 404;
    throw error;
  }
  if (reservation.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }
  reservation.status = 'cancelled';
  await reservation.save();
  res.json(reservation);
}));

router.get('/', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.date) filter.date = req.query.date;
  const reservations = await Reservation.find(filter).populate('user').populate('table').sort({ date: 1, createdAt: -1 });
  res.json(reservations);
}));

router.patch('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    const error = new Error('Reservation not found');
    error.statusCode = 404;
    throw error;
  }
  const updates = req.body;
  Object.assign(reservation, updates);
  await reservation.save();
  res.json(reservation);
}));

router.delete('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    const error = new Error('Reservation not found');
    error.statusCode = 404;
    throw error;
  }
  reservation.status = 'cancelled';
  await reservation.save();
  res.json({ message: 'Reservation cancelled' });
}));

export default router;
