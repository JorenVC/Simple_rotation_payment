import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

function getFormattedDate() {
  const now = new Date();
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return now.toLocaleDateString('nl-NL', options); // e.g., "10 July 2025"
}

// ------------------ ROUTES ------------------

// Get all cards
app.get('/cards', async (req, res) => {
  const result = await db.query('SELECT * FROM cards ORDER BY id');
  res.json(result.rows);
});

// Add a new card by name
app.post('/cards', async (req, res) => {
  const { name } = req.body;
  const result = await db.query(
    'INSERT INTO cards (name, status) VALUES ($1, $2) RETURNING *',
    [name, false]
  );
  res.json(result.rows[0]);
});

// Delete a card by ID
app.delete('/cards/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM cards WHERE id = $1', [id]);
  res.sendStatus(204);
});

// Toggle card status and log it
app.post('/cards/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const card = await db.query('SELECT * FROM cards WHERE id = $1', [id]);

  if (card.rows.length === 0) return res.status(404).send('Card not found');

  const currentStatus = card.rows[0].status;
  const newStatus = !currentStatus;
  const cardName = card.rows[0].name;

  await db.query('UPDATE cards SET status = $1 WHERE id = $2', [newStatus, id]);

  await db.query(
    'INSERT INTO logs (card_name, status, date) VALUES ($1, $2, $3)',
    [cardName, newStatus ? 'ON' : 'OFF', getFormattedDate()]
  );

  res.sendStatus(200);
});

// Get logs
app.get('/logs', async (req, res) => {
  const result = await db.query('SELECT * FROM logs ORDER BY id DESC');
  res.json(result.rows);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
