import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true, unique: true },
    capacity: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Table', tableSchema);
