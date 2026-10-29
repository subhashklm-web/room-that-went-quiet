const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const { Pool } = require('pg');
const content = require('./content');

const PORT = process.env.PORT || 3000;
const TRAINER_PASSWORD = process.env.TRAINER_PASSWORD || 'trainer123';
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const BRAND = process.env.BRAND_NAME || 'Aviation Training Centre';

const ssl = process.env.DATABASE_URL && !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)
  ? { rejectUnauthorized: false } : false;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:pg@localhost:5432/sim', ssl });
const q = (text, params) => pool.query(text, params);

async function migrate() {
  await q(`
    CREATE TABLE IF NOT EXISTS batches (
      code TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'waiting',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      batch_code TEXT NOT NULL REFERENCES batches(code) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      started BOOLEAN NOT NULL DEFAULT false,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      finished_at TIMESTAMPTZ,
      UNIQUE (batch_code, email)
    );
    CREATE TABLE IF NOT EXISTS answers (
      participant_id INT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      round INT NOT NULL,
      option_id TEXT NOT NULL,
      points INT NOT NULL,
      answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (participant_id, round)
    );`);
}

const app = express();
app.use(express.json());
app.use(cookieParser(SECRET));

const MAX_SCORE = content.rounds.reduce((s, r) => s + Math.max(...r.options.map(o => o.points)), 0);
const cleanCode = c => String(c || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
const wrap = fn => (req, res) => fn(req, res).catch(e => { console.error(e); res.status(500).json({ error: 'Server error' }); });

// ---------- pages ----------
app.get('/', (req, res) => res.redirect('/trainer'));
app.get('/play/:code', (req, res) => res.sendFile(path.join(__dirname, 'public', 'learner.html')));
app.get('/trainer', (req, res) => res.sendFile(path.join(__dirname, 'public', 'trainer.html')));
app.get('/trainer/:code', (req, res) => res.sendFile(path.join(__dirname, 'public', 'trainer.html')));
app.get('/healthz', (req, res) => res.send('ok'));

// ---------- shared ----------
app.get('/api/info', (req, res) => res.json({
  brand: BRAND, title: content.title, subtitle: content.subtitle, module: content.module,
  intro: content.intro, objectives: content.objectives, rounds: content.rounds.length, maxScore: MAX_SCORE,
}));

// ---------- learner API ----------
async function learner(req) {
  const token = req.signedCookies.lt;
  if (!token) return null;
  const { rows } = await q(`SELECT p.*, b.status FROM participants p JOIN batches b ON b.code = p.batch_code WHERE p.token = $1`, [token]);
  return rows[0] || null;
}

app.post('/api/join', wrap(async (req, res) => {
  const code = cleanCode(req.body.batch);
  const name = String(req.body.name || '').trim().slice(0, 80);
  const email = String(req.body.email || '').trim().toLowerCase().slice(0, 120);
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Please enter your name and a valid email.' });
  const b = await q('SELECT code FROM batches WHERE code = $1', [code]);
  if (!b.rows.length) return res.status(404).json({ error: 'This batch code was not found. Check the link with your trainer.' });
  const token = crypto.randomBytes(24).toString('hex');
  // Re-joining with the same email resumes the same seat.
  const { rows } = await q(`
    INSERT INTO participants (batch_code, name, email, token) VALUES ($1,$2,$3,$4)
    ON CONFLICT (batch_code, email) DO UPDATE SET name = EXCLUDED.name
    RETURNING token`, [code, name, email, token]);
  res.cookie('lt', rows[0].token, { signed: true, httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 });
  res.json({ ok: true });
}));

app.get('/api/me', wrap(async (req, res) => {
  const p = await learner(req);
  if (!p || p.batch_code !== cleanCode(req.query.batch)) return res.json({ joined: false });
  // Starting rule: live session lets a waiting learner start; paused keeps new joiners waiting.
  if (!p.started && p.status === 'live') { await q('UPDATE participants SET started = true WHERE id = $1', [p.id]); p.started = true; }
  const ans = await q('SELECT round, option_id, points FROM answers WHERE participant_id = $1 ORDER BY round', [p.id]);
  const answered = ans.rows.length;
  const total = ans.rows.reduce((s, a) => s + a.points, 0);
  const out = { joined: true, name: p.name, status: p.status, started: p.started, answered, total, maxScore: MAX_SCORE, rounds: content.rounds.length };
  if (p.started && answered < content.rounds.length) {
    const r = content.rounds[answered];
    out.round = { index: answered, time: r.time, title: r.title, situation: r.situation, question: r.question,
      options: r.options.map(o => ({ id: o.id, text: o.text })) };
  }
  if (answered >= content.rounds.length) {
    const lb = await leaderboard(p.batch_code);
    out.rank = lb.findIndex(x => x.id === p.id) + 1;
    out.of = lb.length;
    out.debrief = content.debrief;
    out.review = ans.rows.map(a => {
      const r = content.rounds[a.round]; const best = r.options.reduce((m, o) => o.points > m.points ? o : m);
      return { title: r.title, chose: a.option_id, points: a.points, best: best.id, bestPoints: best.points };
    });
  }
  res.json(out);
}));

app.post('/api/answer', wrap(async (req, res) => {
  const p = await learner(req);
  if (!p) return res.status(401).json({ error: 'Please join first.' });
  if (!p.started) return res.status(409).json({ error: 'The session has not started yet.' });
  const round = Number(req.body.round);
  const r = content.rounds[round];
  const opt = r && r.options.find(o => o.id === req.body.option);
  if (!opt) return res.status(400).json({ error: 'Invalid answer.' });
  const done = await q('SELECT count(*)::int AS n FROM answers WHERE participant_id = $1', [p.id]);
  if (done.rows[0].n !== round) return res.status(409).json({ error: 'This round was already answered.' });
  await q('INSERT INTO answers (participant_id, round, option_id, points) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [p.id, round, opt.id, opt.points]);
  if (round === content.rounds.length - 1) await q('UPDATE participants SET finished_at = now() WHERE id = $1', [p.id]);
  const best = Math.max(...r.options.map(o => o.points));
  res.json({ points: opt.points, best, feedback: opt.feedback, bestId: r.options.find(o => o.points === best).id });
}));

// ---------- trainer API ----------
const isTrainer = req => req.signedCookies.tr === 'yes';
const needTrainer = (req, res, next) => isTrainer(req) ? next() : res.status(401).json({ error: 'Trainer login required.' });

app.post('/api/trainer/login', (req, res) => {
  const a = Buffer.from(String(req.body.password || '')); const b = Buffer.from(TRAINER_PASSWORD);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Wrong password.' });
  res.cookie('tr', 'yes', { signed: true, httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 12 });
  res.json({ ok: true });
});
app.post('/api/trainer/logout', (req, res) => { res.clearCookie('tr'); res.json({ ok: true }); });
app.get('/api/trainer/me', (req, res) => res.json({ trainer: isTrainer(req) }));

app.get('/api/trainer/batches', needTrainer, wrap(async (req, res) => {
  const { rows } = await q(`SELECT b.code, b.status, b.created_at, count(p.id)::int AS learners
    FROM batches b LEFT JOIN participants p ON p.batch_code = b.code GROUP BY b.code ORDER BY b.created_at DESC`);
  res.json(rows);
}));

app.post('/api/trainer/batches', needTrainer, wrap(async (req, res) => {
  const code = cleanCode(req.body.code);
  if (code.length < 3) return res.status(400).json({ error: 'Use at least 3 letters or numbers (e.g. clscmp-m6).' });
  await q('INSERT INTO batches (code) VALUES ($1) ON CONFLICT DO NOTHING', [code]);
  res.json({ code });
}));

app.delete('/api/trainer/batches/:code', needTrainer, wrap(async (req, res) => {
  await q('DELETE FROM batches WHERE code = $1', [cleanCode(req.params.code)]);
  res.json({ ok: true });
}));

app.post('/api/trainer/batches/:code/:action', needTrainer, wrap(async (req, res) => {
  const code = cleanCode(req.params.code); const action = req.params.action;
  if (action === 'start') await q(`UPDATE batches SET status = 'live' WHERE code = $1`, [code]);
  else if (action === 'pause') await q(`UPDATE batches SET status = 'paused' WHERE code = $1`, [code]);
  else if (action === 'reset') {
    await q('DELETE FROM participants WHERE batch_code = $1', [code]);
    await q(`UPDATE batches SET status = 'waiting' WHERE code = $1`, [code]);
  } else return res.status(400).json({ error: 'Unknown action' });
  res.json({ ok: true });
}));

async function leaderboard(code) {
  const { rows } = await q(`
    SELECT p.id, p.name, p.email, p.joined_at, p.started, p.finished_at,
      coalesce(sum(a.points),0)::int AS score, count(a.round)::int AS answered
    FROM participants p LEFT JOIN answers a ON a.participant_id = p.id
    WHERE p.batch_code = $1 GROUP BY p.id
    ORDER BY score DESC, answered DESC, p.finished_at ASC NULLS LAST, p.joined_at ASC`, [code]);
  return rows;
}

app.get('/api/trainer/batches/:code', needTrainer, wrap(async (req, res) => {
  const code = cleanCode(req.params.code);
  const b = await q('SELECT * FROM batches WHERE code = $1', [code]);
  if (!b.rows.length) return res.status(404).json({ error: 'Batch not found' });
  const people = await leaderboard(code);
  const ans = await q(`SELECT a.round, a.option_id, count(*)::int AS n, avg(a.points)::float AS avg
    FROM answers a JOIN participants p ON p.id = a.participant_id WHERE p.batch_code = $1 GROUP BY a.round, a.option_id`, [code]);
  const rounds = content.rounds.map((r, i) => {
    const rowsR = ans.rows.filter(x => x.round === i);
    const total = rowsR.reduce((s, x) => s + x.n, 0);
    const pts = rowsR.reduce((s, x) => s + x.n * r.options.find(o => o.id === x.option_id).points, 0);
    return { index: i, title: r.title, time: r.time, responses: total,
      avg: total ? pts / total : null, max: Math.max(...r.options.map(o => o.points)),
      options: r.options.map(o => ({ id: o.id, text: o.text, points: o.points, n: (rowsR.find(x => x.option_id === o.id) || {}).n || 0 })) };
  });
  res.json({ code, status: b.rows[0].status, maxScore: MAX_SCORE, totalRounds: content.rounds.length, people, rounds, title: content.title });
}));

app.get('/api/trainer/batches/:code/export.csv', needTrainer, wrap(async (req, res) => {
  const code = cleanCode(req.params.code);
  const people = await leaderboard(code);
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['Rank', 'Name', 'Email', 'Score', 'Max', 'Rounds answered', 'Joined', 'Finished'].map(esc).join(',')];
  people.forEach((p, i) => lines.push([i + 1, p.name, p.email, p.score, MAX_SCORE, p.answered, p.joined_at?.toISOString(), p.finished_at?.toISOString() || ''].map(esc).join(',')));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${code}-results.csv"`);
  res.send(lines.join('\n'));
}));

migrate().then(() => app.listen(PORT, () => console.log(`Listening on ${PORT}`)))
  .catch(e => { console.error('DB setup failed', e); process.exit(1); });
