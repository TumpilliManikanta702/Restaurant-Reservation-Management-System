# Restaurant Reservation Management System

A full-stack MERN application for managing restaurant reservations with role-based access for customers and administrators. Built as a production-grade assignment submission.

---

## 🚀 Live Demo

> **Frontend:** _[Add Vercel URL after deployment]_
> **Backend API:** _[Add Render URL after deployment]_

---

## 🔐 Test Credentials

### Admin Account
| Field    | Value                     |
|----------|---------------------------|
| Email    | `admin@restaurant.com`    |
| Password | `AdminPass123`            |

> The admin account is created by the seed script — there is no public admin registration endpoint by design.

### Customer Account (create your own, or use below)
Register a new account at `/login` → "Register" with any name, email, and password (min 6 characters).

---

## 🛠 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18 + Vite                   |
| Backend    | Node.js + Express                 |
| Database   | MongoDB + Mongoose                |
| Auth       | JWT (7-day expiry) + bcrypt       |

---

## 📦 Local Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally on port 27017 (or a MongoDB Atlas URI)

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd restaurant-reservation-system

# 2. Install server dependencies
cd server && npm install

# 3. Install client dependencies
cd ../client && npm install

# 4. Configure environment variables
#    Copy the example file and fill in your values
cp server/.env.example server/.env

# 5. Seed the database (creates admin user + 6 tables)
cd server && npm run seed

# 6. Start the backend (runs on port 5000)
npm run dev

# 7. In a new terminal, start the frontend (runs on port 5173)
cd ../client && npm run dev
```

### Environment Variables (`server/.env`)

| Variable        | Description                              | Example                        |
|-----------------|------------------------------------------|--------------------------------|
| `PORT`          | Server port                              | `5000`                         |
| `MONGO_URI`     | MongoDB connection string                | `mongodb://localhost:27017/rrs`|
| `JWT_SECRET`    | Secret key for signing JWTs             | `your_super_secret_key`        |
| `CLIENT_ORIGIN` | Allowed CORS origin(s) for the frontend | `http://localhost:5173`        |

### Client Environment Variables (`client/.env`)

| Variable        | Description                        | Example                    |
|-----------------|------------------------------------|----------------------------|
| `VITE_API_URL`  | Base URL of the backend API server | `http://localhost:5000`    |

---

## 🏗 Project Structure

```
/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx         # All components & routes
│   │   ├── api.js          # Axios instance with JWT interceptor
│   │   ├── styles.css      # Full design system (CSS variables, components)
│   │   └── main.jsx
│   ├── .env.example
│   └── vite.config.js
│
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── models/         # Mongoose schemas (User, Table, Reservation)
│   │   ├── routes/         # auth.js, reservations.js, tables.js
│   │   ├── middleware/     # auth.js (requireAuth, requireAdmin), errorHandler.js
│   │   ├── services/       # reservationService.js (core business logic)
│   │   ├── app.js          # Express app setup, CORS, routes
│   │   └── server.js       # MongoDB connect + server start
│   ├── scripts/
│   │   └── seed.js         # Seeds admin user + 6 tables
│   └── .env.example
│
└── README.md
```

---

## 📐 Data Models

### User
```js
{ name, email (unique), passwordHash, role: "customer" | "admin", timestamps }
```

### Table
```js
{ tableNumber (unique), capacity, isActive (default: true), timestamps }
```

### Reservation
```js
{ user (ref), table (ref), date (YYYY-MM-DD string), timeSlot (enum string), guests, status: "confirmed" | "cancelled", timestamps }
```

**Schema decisions:**
- `date` is stored as a plain `YYYY-MM-DD` string for simplicity and easy filtering.
- `timeSlot` is one of four fixed enum strings: `17:00-18:30`, `18:30-20:00`, `19:00-20:30`, `20:30-22:00`. Using fixed strings makes overlap detection explicit and avoids ambiguity.

---

## ⚙️ Reservation & Availability Logic

The core booking logic lives in `server/src/services/reservationService.js` as an isolated, testable function. On every `POST /api/reservations`, the service runs these checks **in order**:

1. **Table exists & is active** — Returns 404 if the table is inactive or not found.
2. **Capacity check** — Rejects if `guests > table.capacity` with a `400` and reason `"capacity exceeded"`.
3. **Past date/time check** — Rejects if the reservation start time is in the past with a `400`.
4. **Overlap check** — Queries all confirmed reservations for the same `(table, date)` and checks each existing `timeSlot` for time overlap using a `parseTime()` helper. Returns `409` with reason `"table unavailable at that time"` if any overlap is found.
5. **Atomic uniqueness** — A MongoDB compound unique index on `{ table, date, timeSlot, status: "confirmed" }` (partial filter) acts as a last line of defence against race conditions on concurrent requests. A duplicate key error (`code 11000`) is caught and mapped to a clean `409` response — never a raw `500`.

---

## 🔑 Role-Based Access Control

| Action                          | Customer | Admin |
|---------------------------------|----------|-------|
| Register / Login                | ✅        | ✅     |
| Create reservation              | ✅        | ❌     |
| View own reservations           | ✅        | ❌     |
| Cancel own reservation          | ✅        | ❌     |
| View ALL reservations           | ❌        | ✅     |
| Filter reservations by date     | ❌        | ✅     |
| Update any reservation          | ❌        | ✅     |
| Cancel any reservation          | ❌        | ✅     |
| Add / edit tables               | ❌        | ✅     |
| Check table availability        | ✅ (public)| ✅    |

**Enforcement strategy:**
- Backend: `requireAuth` middleware validates the JWT on every protected route. `requireAdmin` additionally verifies `role === "admin"`. Frontend route guards redirect unauthorized users, but backend is the real enforcement.
- Passwords are hashed with bcrypt (10 rounds) and never returned in any API response.
- JWTs carry `{ id, role }` payload and expire after 7 days.

---

## 🔌 API Reference

### Auth
| Method | Endpoint              | Access  | Description           |
|--------|-----------------------|---------|-----------------------|
| POST   | `/api/auth/register`  | Public  | Register as customer  |
| POST   | `/api/auth/login`     | Public  | Login, returns JWT    |

### Reservations
| Method | Endpoint                        | Access         | Description                      |
|--------|---------------------------------|----------------|----------------------------------|
| POST   | `/api/reservations`             | Customer       | Create a reservation              |
| GET    | `/api/reservations/me`          | Customer       | Get own reservations              |
| PATCH  | `/api/reservations/:id/cancel`  | Customer       | Cancel own reservation            |
| GET    | `/api/reservations`             | Admin          | Get all (optional `?date=`)       |
| PATCH  | `/api/reservations/:id`         | Admin          | Update any reservation            |
| DELETE | `/api/reservations/:id`         | Admin          | Cancel any reservation            |

### Tables
| Method | Endpoint                          | Access        | Description             |
|--------|-----------------------------------|---------------|-------------------------|
| GET    | `/api/tables/availability`        | Public        | `?date=&timeSlot=`      |
| GET    | `/api/tables`                     | Admin         | List all tables         |
| POST   | `/api/tables`                     | Admin         | Add a table             |
| PATCH  | `/api/tables/:id`                 | Admin         | Update a table          |

---

## ⚠️ Known Limitations

- Time slots are fixed to four predefined windows — dynamic slot configuration is not supported.
- No email notifications or reminders are sent on booking or cancellation.
- No pagination on the admin reservations list — could be slow with very large datasets.
- No real-time updates — the admin must refresh to see new bookings.

---

## 💡 What I Would Improve With More Time

- Add automated tests (Jest + Supertest) for all reservation conflict edge cases.
- Implement refresh tokens and proper token expiry handling on the frontend.
- Add pagination and search/sort to the admin reservations table.
- Add email confirmation via SendGrid or Nodemailer.
- Add CI/CD pipeline (GitHub Actions) for automated testing and deployment.
- Support dynamic time slot configuration per restaurant.
- Improve mobile responsiveness of the dashboard.

---

## 🚢 Deployment

| Service   | Platform        | Notes                                             |
|-----------|-----------------|---------------------------------------------------|
| Backend   | Render / Railway| Set all `server/.env` variables in platform dashboard |
| Frontend  | Vercel / Netlify| Set `VITE_API_URL` to deployed backend URL        |

CORS is environment-driven via `CLIENT_ORIGIN` — no hardcoded URLs.
