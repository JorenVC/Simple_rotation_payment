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

  // Check if card exists and get label
  const cardResult = await db.query('SELECT label FROM cards WHERE id = $1', [id]);
  if (cardResult.rowCount === 0) {
    return res.status(404).send('Card not found');
  }
  const label = cardResult.rows[0].label;

  // Insert log with label
  await db.query(
    'INSERT INTO logs (card_id, status, card_label) VALUES ($1, $2, $3)',
    [id, status, label]
  );

  // Update payment counter
  if (status === 'Betaald') {
    await db.query(
      'UPDATE cards SET payment_count = payment_count + 1 WHERE id = $1',
      [id]
    );
  } else if (status === 'fout') {
    await db.query(
      'UPDATE cards SET payment_count = GREATEST(payment_count - 1, 0) WHERE id = $1',
      [id]
    );
  }

  res.send('Switch toggled and counter updated');
});


// Get logs
app.get('/logs', async (req, res) => {
  const result = await db.query(
    'SELECT * FROM logs ORDER BY timestamp DESC LIMIT 20'
  );
  res.json(result.rows);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
