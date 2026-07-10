import Reservation from '../models/Reservation.js';
import Table from '../models/Table.js';

const SLOT_DETAILS = {
  '17:00-18:30': { start: '17:00', end: '18:30' },
  '18:30-20:00': { start: '18:30', end: '20:00' },
  '19:00-20:30': { start: '19:00', end: '20:30' },
  '20:30-22:00': { start: '20:30', end: '22:00' }
};

const parseTime = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const isPastDateTime = (date, timeSlot) => {
  const { start } = SLOT_DETAILS[timeSlot] || {};
  if (!start) {
    const error = new Error('Unsupported time slot');
    error.statusCode = 400;
    error.reason = 'Unsupported time slot';
    throw error;
  }
  const [hours, minutes] = start.split(':').map(Number);
  const requestedTime = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const requestedDay = new Date(`${date}T00:00:00`);
  if (requestedDay < today) {
    return true;
  }
  return requestedTime.getTime() < now.getTime();
};

const overlaps = (slotA, slotB) => {
  const detailsA = SLOT_DETAILS[slotA];
  const detailsB = SLOT_DETAILS[slotB];
  if (!detailsA || !detailsB) {
    return false;
  }
  return parseTime(detailsA.start) < parseTime(detailsB.end) && parseTime(detailsB.start) < parseTime(detailsA.end);
};

export const createReservation = async ({ userId, tableId, date, timeSlot, guests }) => {
  const table = await Table.findById(tableId);
  if (!table || !table.isActive) {
    const error = new Error('table unavailable');
    error.statusCode = 404;
    error.reason = 'Table not found or inactive';
    throw error;
  }

  if (guests > table.capacity) {
    const error = new Error('capacity exceeded');
    error.statusCode = 400;
    error.reason = 'capacity exceeded';
    throw error;
  }

  if (isPastDateTime(date, timeSlot)) {
    const error = new Error('past reservation');
    error.statusCode = 400;
    error.reason = 'Reservation date/time is in the past';
    throw error;
  }

  const conflicts = await Reservation.find({
    table: tableId,
    date,
    status: 'confirmed'
  }).lean();

  const hasOverlap = conflicts.some((reservation) => overlaps(reservation.timeSlot, timeSlot));
  if (hasOverlap) {
    const error = new Error('table unavailable at that time');
    error.statusCode = 409;
    error.reason = 'table unavailable at that time';
    throw error;
  }

  try {
    const reservation = await Reservation.create({ user: userId, table: tableId, date, timeSlot, guests, status: 'confirmed' });
    return reservation;
  } catch (error) {
    if (error.code === 11000) {
      const duplicateError = new Error('table unavailable at that time');
      duplicateError.statusCode = 409;
      duplicateError.reason = 'table unavailable at that time';
      throw duplicateError;
    }
    throw error;
  }
};
