import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import api from './api';
import './styles.css';

const AuthContext = React.createContext(null);
const useAuth = () => React.useContext(AuthContext);

const TIME_SLOTS = [
  { value: '17:00-18:30', label: '5:00 – 6:30 PM' },
  { value: '18:30-20:00', label: '6:30 – 8:00 PM' },
  { value: '19:00-20:30', label: '7:00 – 8:30 PM' },
  { value: '20:30-22:00', label: '8:30 – 10:00 PM' },
];

const slotLabel = (v) => TIME_SLOTS.find(s => s.value === v)?.label || v;

/* ── Helpers ── */
const Badge = ({ status }) => {
  const map = {
    confirmed: 'badge badge-green',
    cancelled:  'badge badge-red',
    active:     'badge badge-green',
    inactive:   'badge badge-slate',
  };
  return <span className={map[status] || 'badge badge-slate'}>{status}</span>;
};

const Alert = ({ type, children }) =>
  children ? <div className={`alert alert-${type} mb-2`}><span>{type === 'success' ? '✓' : '⚠'}</span>{children}</div> : null;

/* ════════════════════════════════════════════════════════════════
   LOGIN PAGE  — split-screen premium layout
════════════════════════════════════════════════════════════════ */
const LoginPage = () => {
  const { login } = useAuth();
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload  = mode === 'register' ? form : { email: form.email, password: form.password };
      const res = await api.post(endpoint, payload);
      login(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-brand fade-in">
          <div className="login-brand-icon">🍽</div>
          <div className="login-brand-name">TableReserve</div>
          <div className="login-brand-tagline">
            The complete restaurant reservation platform for modern dining experiences.
          </div>
          <div className="login-feature-list">
            {[
              ['📅', 'Smart availability checking with conflict prevention'],
              ['👥', 'Role-based access for customers and administrators'],
              ['⚡', 'Instant booking confirmation with real-time updates'],
            ].map(([icon, text]) => (
              <div className="login-feature" key={text}>
                <div className="login-feature-icon">{icon}</div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--emerald-600)', marginBottom: '.5rem' }}>
            Restaurant Management
          </div>
          <div className="login-form-title">
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </div>
          <div className="login-form-sub">
            {mode === 'login' ? 'Enter your credentials to continue.' : 'Fill in your details to get started.'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3">
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" placeholder="Jane Doe" value={form.name} onChange={set('name')} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" placeholder="you@restaurant.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          </div>

          <Alert type="error">{error}</Alert>

          <button className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? '⏳ Please wait…' : mode === 'login' ? '→ Sign in' : '→ Create account'}
          </button>
        </form>

        <hr className="divider" />

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '.875rem', color: 'var(--text-muted)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{ color: 'var(--emerald-600)', fontWeight: 700 }}
          >
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   SIDEBAR  — shared for customer & admin
════════════════════════════════════════════════════════════════ */
const Sidebar = ({ activeTab, setActiveTab, navItems }) => {
  const { user, logout } = useAuth();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🍽</div>
        <div className="sidebar-logo-text">
          TableReserve
          <span>Management System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu</div>
        {navItems.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="user-chip-info">
            <div className="user-chip-name">{user?.name}</div>
            <div className="user-chip-role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">⏏</button>
        </div>
      </div>
    </aside>
  );
};

/* ════════════════════════════════════════════════════════════════
   CUSTOMER VIEW
════════════════════════════════════════════════════════════════ */
const CustomerView = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('book');

  const navItems = [
    { id: 'book',         icon: '📅', label: 'Book a Table' },
    { id: 'reservations', icon: '📋', label: 'My Reservations' },
  ];

  return (
    <div className="app-shell">
      <Sidebar activeTab={tab} setActiveTab={setTab} navItems={navItems} />
      <div className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">
              {tab === 'book' ? 'Book a Table' : 'My Reservations'}
            </div>
            <div className="topbar-sub">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ fontSize: '.875rem', color: 'var(--text-muted)' }}>
            Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</strong> 👋
          </div>
        </header>

        <div className="page-content fade-in">
          {tab === 'book'         && <CustomerBook />}
          {tab === 'reservations' && <CustomerReservations />}
        </div>
      </div>
    </div>
  );
};

const CustomerBook = () => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]           = useState('');
  const [timeSlot, setTimeSlot]   = useState('19:00-20:30');
  const [guests, setGuests]       = useState(2);
  const [tables, setTables]       = useState([]);
  const [selectedTable, setSelTbl] = useState('');
  const [msg, setMsg]             = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [avLoading, setAvLoading] = useState(false);

  useEffect(() => {
    if (!date || !timeSlot) return;
    setAvLoading(true);
    api.get(`/api/tables/availability?date=${date}&timeSlot=${timeSlot}`)
      .then(r => { setTables(r.data); setSelTbl(''); })
      .catch(() => setError('Could not load availability.'))
      .finally(() => setAvLoading(false));
  }, [date, timeSlot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setError(''); setLoading(true);
    try {
      await api.post('/api/reservations', { tableId: selectedTable, date, timeSlot, guests });
      setMsg('Reservation confirmed! 🎉');
      setSelTbl('');
      // refresh tables
      const r = await api.get(`/api/tables/availability?date=${date}&timeSlot=${timeSlot}`);
      setTables(r.data);
    } catch (err) {
      setError(err.response?.data?.reason || err.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="grid grid-2 gap-3" style={{ alignItems: 'start' }}>
      {/* Booking form */}
      <div className="card">
        <div className="card-header mb-3">
          <div>
            <div className="card-title">New Reservation</div>
            <div className="card-subtitle">Select your preferred date, time, and table.</div>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <form onSubmit={handleSubmit} className="grid gap-3">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" min={today} value={date}
                onChange={e => { setDate(e.target.value); setMsg(''); setError(''); }} required />
            </div>

            <div className="form-group">
              <label className="form-label">Time Slot</label>
              <select className="form-select" value={timeSlot}
                onChange={e => { setTimeSlot(e.target.value); setMsg(''); setError(''); }}>
                {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Guests</label>
              <input className="form-input" type="number" min={1} max={20} value={guests}
                onChange={e => setGuests(Number(e.target.value))} required />
            </div>

            <div className="form-group">
              <label className="form-label">
                Available Tables
                {avLoading && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '.5rem' }}>Loading…</span>}
              </label>
              {!date ? (
                <div style={{ padding: '.75rem', background: 'var(--slate-50)', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '.875rem', textAlign: 'center' }}>
                  Select a date to see available tables
                </div>
              ) : tables.length === 0 && !avLoading ? (
                <div style={{ padding: '.75rem', background: 'var(--red-50)', border: '1.5px solid #fecaca', borderRadius: 'var(--radius-sm)', color: 'var(--red-600)', fontSize: '.875rem', textAlign: 'center', fontWeight: 600 }}>
                  No tables available for this slot
                </div>
              ) : (
                <select className="form-select" value={selectedTable}
                  onChange={e => setSelTbl(e.target.value)} required>
                  <option value="">— Select a table —</option>
                  {tables.map(t => (
                    <option key={t._id} value={t._id}>
                      Table {t.tableNumber} · Seats {t.capacity} guests
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Alert type="success">{msg}</Alert>
            <Alert type="error">{error}</Alert>

            <button className="btn btn-primary btn-full" type="submit"
              disabled={loading || !selectedTable}>
              {loading ? '⏳ Confirming…' : '✓ Confirm Reservation'}
            </button>
          </form>
        </div>
      </div>

      {/* Info panel */}
      <div className="grid gap-3">
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--emerald-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🕐</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '.25rem' }}>Dining Hours</div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>Available time slots</div>
              </div>
            </div>
            {TIME_SLOTS.map(s => (
              <div key={s.value} style={{
                padding: '.6rem .875rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '.375rem',
                background: timeSlot === s.value ? 'var(--emerald-50)' : 'var(--slate-50)',
                border: `1.5px solid ${timeSlot === s.value ? 'var(--emerald-400)' : 'var(--border)'}`,
                fontSize: '.875rem',
                fontWeight: timeSlot === s.value ? 600 : 400,
                color: timeSlot === s.value ? 'var(--emerald-700)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
                onClick={() => setTimeSlot(s.value)}>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ fontWeight: 700, fontSize: '.875rem', marginBottom: '.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontSize: '.72rem' }}>
              Policies
            </div>
            {[
              ['Cancellation', 'Cancel up to the reservation time'],
              ['Capacity', 'Guests must not exceed table capacity'],
              ['Past bookings', 'Reservations for past dates are not allowed'],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: '.625rem', marginBottom: '.75rem' }}>
                <span style={{ color: 'var(--emerald-500)', fontSize: '.875rem', marginTop: '.1rem' }}>✓</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.8rem', color: 'var(--text-primary)' }}>{title}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.1rem' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerReservations = () => {
  const [reservations, setRes] = useState([]);
  const [error, setError]      = useState('');
  const [cancelId, setCancelId] = useState(null);

  const load = async () => {
    try { const r = await api.get('/api/reservations/me'); setRes(r.data); }
    catch { setError('Could not load reservations.'); }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    setCancelId(id);
    try { await api.patch(`/api/reservations/${id}/cancel`); load(); }
    catch (e) { setError(e.response?.data?.message || 'Failed to cancel.'); }
    finally { setCancelId(null); }
  };

  const confirmed = reservations.filter(r => r.status === 'confirmed');
  const cancelled = reservations.filter(r => r.status === 'cancelled');

  return (
    <div className="grid gap-3">
      {/* Stats */}
      <div className="grid grid-3 gap-2">
        {[
          { label: 'Total', value: reservations.length, icon: '📋', cls: '' },
          { label: 'Confirmed', value: confirmed.length, icon: '✅', cls: '' },
          { label: 'Cancelled', value: cancelled.length, icon: '❌', cls: '' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
            <div className="stat-card-icon" style={{ background: 'var(--slate-50)' }}>{s.icon}</div>
          </div>
        ))}
      </div>

      <Alert type="error">{error}</Alert>

      <div className="card">
        <div className="card-header mb-3" style={{ padding: '1.25rem 1.5rem' }}>
          <div className="card-title">Reservation History</div>
        </div>

        {reservations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No reservations yet</div>
            <div className="empty-state-body">Head over to "Book a Table" to make your first reservation.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {['Table', 'Date', 'Time', 'Guests', 'Status', ''].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {reservations.map(r => (
                  <tr key={r._id}>
                    <td><strong>Table {r.table?.tableNumber}</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.date}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{slotLabel(r.timeSlot)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.guests} guests</td>
                    <td><Badge status={r.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      {r.status === 'confirmed' && (
                        <button className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--red-500)', color: 'var(--red-500)' }}
                          onClick={() => cancel(r._id)} disabled={cancelId === r._id}>
                          {cancelId === r._id ? '…' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   ADMIN VIEW
════════════════════════════════════════════════════════════════ */
const AdminView = () => {
  const [tab, setTab] = useState('overview');

  const navItems = [
    { id: 'overview',     icon: '📊', label: 'Overview' },
    { id: 'reservations', icon: '📋', label: 'Reservations' },
    { id: 'tables',       icon: '🪑', label: 'Table Management' },
  ];

  const tabTitle = {
    overview:     'Dashboard Overview',
    reservations: 'All Reservations',
    tables:       'Table Management',
  };

  return (
    <div className="app-shell">
      <Sidebar activeTab={tab} setActiveTab={setTab} navItems={navItems} />
      <div className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{tabTitle[tab]}</div>
            <div className="topbar-sub">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="badge badge-violet">Admin</div>
        </header>

        <div className="page-content fade-in">
          {tab === 'overview'     && <AdminOverview setTab={setTab} />}
          {tab === 'reservations' && <AdminReservations />}
          {tab === 'tables'       && <AdminTables />}
        </div>
      </div>
    </div>
  );
};

/* Admin – Overview */
const AdminOverview = ({ setTab }) => {
  const [reservations, setRes] = useState([]);
  const [tables, setTables]    = useState([]);

  useEffect(() => {
    api.get('/api/reservations').then(r => setRes(r.data)).catch(() => {});
    api.get('/api/tables').then(r => setTables(r.data)).catch(() => {});
  }, []);

  const confirmed = reservations.filter(r => r.status === 'confirmed');
  const cancelled = reservations.filter(r => r.status === 'cancelled');
  const active    = tables.filter(t => t.isActive);

  const stats = [
    { label: 'Total Reservations', value: reservations.length, icon: '📋', bg: 'var(--slate-50)', delta: 'All time', color: 'var(--slate-700)' },
    { label: 'Confirmed',          value: confirmed.length,    icon: '✅', bg: 'var(--emerald-50)', delta: 'Active bookings', color: 'var(--emerald-700)' },
    { label: 'Cancelled',          value: cancelled.length,    icon: '❌', bg: 'var(--red-50)',     delta: 'Total cancellations', color: 'var(--red-600)' },
    { label: 'Active Tables',      value: active.length,       icon: '🪑', bg: 'var(--violet-50)',  delta: `of ${tables.length} total`, color: 'var(--violet-500)' },
  ];

  return (
    <div className="grid gap-3">
      {/* Stats */}
      <div className="grid grid-4 gap-2">
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-delta" style={{ color: 'var(--text-muted)' }}>{s.delta}</div>
            </div>
            <div className="stat-card-icon" style={{ background: s.bg }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Recent reservations preview */}
      <div className="card">
        <div className="card-header mb-3" style={{ padding: '1.25rem 1.5rem' }}>
          <div>
            <div className="card-title">Recent Reservations</div>
            <div className="card-subtitle">Latest 5 bookings</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setTab('reservations')}>View All →</button>
        </div>
        {reservations.length === 0 ? (
          <div className="empty-state"><div className="empty-state-body">No reservations yet.</div></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>{['Customer', 'Date', 'Time', 'Guests', 'Table', 'Status'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {reservations.slice(0, 5).map(r => (
                  <tr key={r._id}>
                    <td><strong>{r.user?.name}</strong><div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{r.user?.email}</div></td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.date}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{slotLabel(r.timeSlot)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.guests}</td>
                    <td><strong>Table {r.table?.tableNumber}</strong></td>
                    <td><Badge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tables quick view */}
      <div className="card">
        <div className="card-header mb-3" style={{ padding: '1.25rem 1.5rem' }}>
          <div>
            <div className="card-title">Tables at a Glance</div>
            <div className="card-subtitle">{active.length} active · {tables.length - active.length} inactive</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setTab('tables')}>Manage →</button>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '.75rem' }}>
            {tables.map(t => (
              <div key={t._id} style={{
                padding: '1rem', borderRadius: 'var(--radius)', border: `1.5px solid ${t.isActive ? 'var(--emerald-100)' : 'var(--border)'}`,
                background: t.isActive ? 'var(--emerald-50)' : 'var(--slate-50)', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.25rem', marginBottom: '.25rem' }}>🪑</div>
                <div style={{ fontWeight: 700, fontSize: '.875rem' }}>Table {t.tableNumber}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Seats {t.capacity}</div>
                <Badge status={t.isActive ? 'active' : 'inactive'} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Admin – Reservations */
const AdminReservations = () => {
  const [reservations, setRes]  = useState([]);
  const [date, setDate]         = useState('');
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({});
  const [msg, setMsg]           = useState('');
  const [error, setError]       = useState('');

  const load = async () => {
    try {
      const q = date ? `?date=${date}` : '';
      const r = await api.get(`/api/reservations${q}`);
      setRes(r.data);
    } catch { setError('Failed to load.'); }
  };

  useEffect(() => { load(); }, [date]);

  const flash = (m, isErr = false) => {
    if (isErr) { setError(m); setMsg(''); } else { setMsg(m); setError(''); }
    setTimeout(() => { setMsg(''); setError(''); }, 4000);
  };

  const cancelRes = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try { await api.delete(`/api/reservations/${id}`); flash('Reservation cancelled.'); load(); }
    catch (e) { flash(e.response?.data?.message || 'Failed.', true); }
  };

  const startEdit = (r) => {
    setEditing(r._id);
    setForm({ date: r.date, timeSlot: r.timeSlot, guests: r.guests || 2, status: r.status });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/api/reservations/${editing}`, { ...form, guests: Number(form.guests) });
      flash('Reservation updated.');
      setEditing(null);
      load();
    } catch (e) { flash(e.response?.data?.message || 'Failed.', true); }
  };

  return (
    <div className="grid gap-3">
      {/* Filter bar */}
      <div className="card" style={{ padding: '1rem 1.5rem' }}>
        <div className="flex items-center gap" style={{ flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 600, fontSize: '.875rem', marginRight: '.5rem' }}>Filter by Date:</div>
          <input className="form-input" type="date" value={date}
            onChange={e => setDate(e.target.value)} style={{ width: 'auto', flex: 'none' }} />
          {date && <button className="btn btn-secondary btn-sm" onClick={() => setDate('')}>✕ Clear</button>}
          <div className="flex-1" />
          <div style={{ fontSize: '.875rem', color: 'var(--text-muted)' }}>
            <strong>{reservations.length}</strong> reservation{reservations.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <Alert type="success">{msg}</Alert>
      <Alert type="error">{error}</Alert>

      <div className="card">
        {reservations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No reservations found</div>
            <div className="empty-state-body">{date ? 'Try clearing the date filter.' : 'No reservations have been made yet.'}</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>{['Customer', 'Date', 'Time Slot', 'Guests', 'Table', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {reservations.map(r => (
                  <React.Fragment key={r._id}>
                    <tr>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.user?.name || '—'}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{r.user?.email}</div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.date}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{slotLabel(r.timeSlot)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.guests}</td>
                      <td><strong>Table {r.table?.tableNumber}</strong></td>
                      <td><Badge status={r.status} /></td>
                      <td>
                        <div className="flex gap" style={{ gap: '.5rem' }}>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => editing === r._id ? setEditing(null) : startEdit(r)}>
                            {editing === r._id ? '✕ Close' : '✏️ Edit'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => cancelRes(r._id)}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                    {editing === r._id && (
                      <tr style={{ background: '#f0fdf4' }}>
                        <td colSpan={7} style={{ padding: '1.25rem 1.5rem' }}>
                          <form onSubmit={saveEdit}>
                            <div style={{ fontWeight: 700, color: 'var(--emerald-700)', marginBottom: '1rem', fontSize: '.875rem' }}>
                              ✏️ Editing reservation for {r.user?.name}
                            </div>
                            <div className="flex gap" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                              {[
                                { label: 'Date', el: <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /> },
                                { label: 'Time Slot', el: <select className="form-select" value={form.timeSlot} onChange={e => setForm(f => ({ ...f, timeSlot: e.target.value }))}>{TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select> },
                                { label: 'Guests', el: <input className="form-input" type="number" min={1} value={form.guests} onChange={e => setForm(f => ({ ...f, guests: e.target.value }))} required /> },
                                { label: 'Status', el: <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select> },
                              ].map(({ label, el }) => (
                                <div key={label} className="form-group" style={{ flex: '1', minWidth: 140 }}>
                                  <label className="form-label">{label}</label>
                                  {el}
                                </div>
                              ))}
                              <div className="flex gap" style={{ gap: '.5rem', paddingBottom: '.2rem' }}>
                                <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                              </div>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* Admin – Tables */
const AdminTables = () => {
  const [tables, setTables]     = useState([]);
  const [form, setForm]         = useState({ tableNumber: '', capacity: '' });
  const [editing, setEditing]   = useState(null);
  const [editForm, setEditForm] = useState({});
  const [msg, setMsg]           = useState('');
  const [error, setError]       = useState('');

  const load = async () => {
    try { const r = await api.get('/api/tables'); setTables(r.data); }
    catch { setError('Failed to load tables.'); }
  };

  useEffect(() => { load(); }, []);

  const flash = (m, isErr = false) => {
    if (isErr) { setError(m); setMsg(''); } else { setMsg(m); setError(''); }
    setTimeout(() => { setMsg(''); setError(''); }, 4000);
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/tables', { tableNumber: Number(form.tableNumber), capacity: Number(form.capacity) });
      flash('Table added successfully.');
      setForm({ tableNumber: '', capacity: '' });
      load();
    } catch (e) { flash(e.response?.data?.message || 'Failed.', true); }
  };

  const startEdit = (t) => { setEditing(t._id); setEditForm({ capacity: t.capacity, isActive: t.isActive }); };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/api/tables/${editing}`, { capacity: Number(editForm.capacity), isActive: editForm.isActive });
      flash('Table updated.');
      setEditing(null);
      load();
    } catch (e) { flash(e.response?.data?.message || 'Failed.', true); }
  };

  const active   = tables.filter(t => t.isActive);
  const inactive = tables.filter(t => !t.isActive);

  return (
    <div className="grid grid-2 gap-3" style={{ alignItems: 'start' }}>
      {/* Add Table */}
      <div className="card">
        <div className="card-header mb-3" style={{ padding: '1.25rem 1.5rem' }}>
          <div>
            <div className="card-title">Add New Table</div>
            <div className="card-subtitle">Configure a new table for the restaurant.</div>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <form onSubmit={create} className="grid gap-3">
            <div className="form-group">
              <label className="form-label">Table Number</label>
              <input className="form-input" type="number" min={1} placeholder="e.g. 7"
                value={form.tableNumber} onChange={e => setForm(f => ({ ...f, tableNumber: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Seating Capacity</label>
              <input className="form-input" type="number" min={1} placeholder="e.g. 4"
                value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} required />
            </div>
            <Alert type="success">{msg}</Alert>
            <Alert type="error">{error}</Alert>
            <button className="btn btn-primary btn-full" type="submit">➕ Add Table</button>
          </form>

          <hr className="divider" />
          <div className="flex gap" style={{ gap: '1rem' }}>
            {[{ label: 'Active', value: active.length, color: 'var(--emerald-600)' }, { label: 'Inactive', value: inactive.length, color: 'var(--slate-500)' }, { label: 'Total', value: tables.length, color: 'var(--text-primary)' }].map(s => (
              <div key={s.label} style={{ textAlign: 'center', flex: 1, padding: '.75rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables list */}
      <div className="card">
        <div className="card-header mb-3" style={{ padding: '1.25rem 1.5rem' }}>
          <div>
            <div className="card-title">All Tables</div>
            <div className="card-subtitle">{tables.length} tables configured</div>
          </div>
        </div>
        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>{['Table #', 'Capacity', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {tables.map(t => (
                <React.Fragment key={t._id}>
                  <tr>
                    <td><strong>Table {t.tableNumber}</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>Seats {t.capacity}</td>
                    <td><Badge status={t.isActive ? 'active' : 'inactive'} /></td>
                    <td>
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => editing === t._id ? setEditing(null) : startEdit(t)}>
                        {editing === t._id ? '✕' : '✏️ Edit'}
                      </button>
                    </td>
                  </tr>
                  {editing === t._id && (
                    <tr style={{ background: '#f0fdf4' }}>
                      <td colSpan={4} style={{ padding: '1rem 1.25rem' }}>
                        <form onSubmit={saveEdit}>
                          <div className="flex gap" style={{ flexWrap: 'wrap', alignItems: 'flex-end', gap: '.75rem' }}>
                            <div className="form-group" style={{ flex: '1', minWidth: 100 }}>
                              <label className="form-label">Capacity</label>
                              <input className="form-input" type="number" min={1}
                                value={editForm.capacity} onChange={e => setEditForm(f => ({ ...f, capacity: e.target.value }))} required />
                            </div>
                            <div className="form-group" style={{ flex: '1', minWidth: 120 }}>
                              <label className="form-label">Status</label>
                              <select className="form-select" value={editForm.isActive ? 'active' : 'inactive'}
                                onChange={e => setEditForm(f => ({ ...f, isActive: e.target.value === 'active' }))}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>
                            <div className="flex gap" style={{ gap: '.5rem', paddingBottom: '.2rem' }}>
                              <button type="submit" className="btn btn-primary btn-sm">Save</button>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                            </div>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   PROTECTED ROUTE
════════════════════════════════════════════════════════════════ */
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--slate-950)', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>⏳</div>
        <div style={{ color: 'var(--slate-400)' }}>Loading...</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/customer'} replace />;
  return children;
};

/* ════════════════════════════════════════════════════════════════
   ROOT APP
════════════════════════════════════════════════════════════════ */
const App = () => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) setUser(JSON.parse(u));
    setLoading(false);
  }, []);

  const login  = ({ user, token }) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); setUser(user); };
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/customer'} replace /> : <LoginPage />} />
          <Route path="/customer" element={<ProtectedRoute><CustomerView /></ProtectedRoute>} />
          <Route path="/admin"    element={<ProtectedRoute role="admin"><AdminView /></ProtectedRoute>} />
          <Route path="*"         element={<Navigate to={user?.role === 'admin' ? '/admin' : '/customer'} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

export default App;
