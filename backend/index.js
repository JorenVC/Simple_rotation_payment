const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get('/', (req, res) => res.send('API is live!'));

app.get('/cards', async (req, res) => {
  const result = await db.query('SELECT * FROM cards');
  res.json(result.rows);
});

app.post('/cards', async (req, res) => {
  const { label } = req.body;
  const result = await db.query('INSERT INTO cards (label) VALUES ($1) RETURNING *', [label]);
  res.json(result.rows[0]);
});

app.delete('/cards/:id', async (req, res) => {
  await db.query('DELETE FROM cards WHERE id = $1', [req.params.id]);
  res.sendStatus(204);
});

app.put('/cards/:id/toggle', async (req, res) => {
  const { status } = req.body; // "on" or "off"
  await db.query('INSERT INTO switch_logs (card_id, status) VALUES ($1, $2)', [req.params.id, status]);
  res.sendStatus(200);
});

app.get('/logs', async (req, res) => {
  const result = await db.query('SELECT * FROM switch_logs ORDER BY timestamp DESC');
  res.json(result.rows);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
