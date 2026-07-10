const base = process.env.API_BASE || 'http://localhost:5000';

const doPost = async (path, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch(e) { json = text; }
  return { status: res.status, body: json };
};

const doGet = async (path, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, { headers });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch(e) { json = text; }
  return { status: res.status, body: json };
};

(async () => {
  console.log('BASE', base);

  console.log('\n1) Health');
  console.log(await doGet('/health'));

  console.log('\n2) Register');
  const reg = await doPost('/api/auth/register', { name: 'NodeTester', email: 'nodetester@local.test', password: 'Tester123!' });
  console.log(reg);

  console.log('\n3) Login');
  const login = await doPost('/api/auth/login', { email: 'nodetester@local.test', password: 'Tester123!' });
  console.log(login);
  const token = login.body.token;
  if (!token) { console.error('No token, aborting'); process.exit(0); }

  console.log('\n4) Get tables (admin required)');
  const tables = await doGet('/api/tables', token);
  console.log(tables);

  console.log('\n5) Get availability (no auth)');
  const tomorrow = new Date(Date.now() + 24*3600*1000).toISOString().slice(0,10);
  const avail = await doGet(`/api/tables/availability?date=${tomorrow}&timeSlot=19:00-20:30`);
  console.log(avail);

  // create reservation using customer token
  console.log('\n6) Create reservation');
  // need a table id; use first available from avail
  const tableId = Array.isArray(avail.body) && avail.body.length ? avail.body[0]._id : null;
  console.log('selected tableId', tableId);
  if (!tableId) { console.error('No table available to create reservation'); process.exit(0); }
  const create = await doPost('/api/reservations', { tableId, date: tomorrow, timeSlot: '19:00-20:30', guests: 2 }, token);
  console.log(create);

  console.log('\n7) Attempt duplicate reservation (should fail)');
  const dup = await doPost('/api/reservations', { tableId, date: tomorrow, timeSlot: '19:00-20:30', guests: 2 }, token);
  console.log(dup);

  console.log('\n8) Capacity exceed (should fail)');
  // get capacity from the table
  const table = await (async () => { const t = await doGet('/api/tables', token); return Array.isArray(t.body) && t.body.length ? t.body.find(x => x._id===tableId) : null; })();
  const capacity = table?.capacity || 2;
  const capTest = await doPost('/api/reservations', { tableId, date: tomorrow, timeSlot: '20:30-22:00', guests: capacity + 1 }, token);
  console.log(capTest);

  console.log('\n9) Cancel reservation');
  const createdId = create.body?._id;
  if (createdId) {
    const res = await fetch(base + `/api/reservations/${createdId}/cancel`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
    console.log({ status: res.status, body: await res.text() });
  } else {
    console.log('No created reservation id to cancel');
  }

  console.log('\nDone');
})();
