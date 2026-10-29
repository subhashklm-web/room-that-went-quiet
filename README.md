# The Room That Went Quiet — classroom simulation

Learners join at `/play/<batch-code>`; the trainer logs in at `/trainer`.

## Environment variables (set on Render)
- `DATABASE_URL` — Postgres connection string (Render Internal Database URL)
- `TRAINER_PASSWORD` — password for the trainer dashboard
- `SESSION_SECRET` — any long random string
- `BRAND_NAME` — optional, defaults to "Aviation Training Centre"

Build: `npm install` · Start: `npm start`

Edit `content.js` to change the scenario, rounds, options, points and feedback.
