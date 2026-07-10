import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import reservationRoutes from './routes/reservations.js';
import tableRoutes from './routes/tables.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Root: redirect to frontend origin or return health when used directly in browser
app.get('/', (req, res) => {
  const client = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  // If request comes from a browser, redirect to the client UI; otherwise return JSON health
  const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
  if (acceptsHtml) return res.redirect(client);
  return res.json({ status: 'ok' });
});
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/tables', tableRoutes);

app.use(errorHandler);

export default app;
