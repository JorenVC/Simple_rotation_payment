import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3000;

// Use Neon connection string from environment variable
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// Get all cards
app.get('/cards', async (req, res) => {
  const result = await db.query('SELECT * FROM cards ORDER BY id');
  res.json(result.rows);
});

// Add a card
app.post('/cards', async (req, res) => {
  const { label } = req.body;
  await db.query('INSERT INTO cards (label) VALUES ($1)', [label]);
  res.status(201).send('Card added');
});

// Delete a card
app.delete('/cards/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM cards WHERE id = $1', [id]);
  res.send('Card deleted');
});

// Toggle switch
app.put('/cards/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await db.query(
    'INSERT INTO switch_logs (card_id, status) VALUES ($1, $2)',
    [id, status]
  );
  res.send('Switch toggled');
});

// Get logs
app.get('/logs', async (req, res) => {
  const result = await db.query(
    'SELECT * FROM switch_logs ORDER BY timestamp DESC LIMIT 20'
  );
  res.json(result.rows);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
