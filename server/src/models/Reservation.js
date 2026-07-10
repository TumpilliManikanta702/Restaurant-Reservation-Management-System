import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    guests: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
  },
  { timestamps: true }
);

reservationSchema.index(
  { table: 1, date: 1, timeSlot: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' } }
);

export default mongoose.model('Reservation', reservationSchema);
