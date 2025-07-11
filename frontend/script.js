const BACKEND_URL = 'https://simple-rotation-payment-backend.onrender.com'; // Replace this

async function fetchCards() {
  const res = await fetch(`${BACKEND_URL}/cards`);
  return res.json();
}

async function fetchLogs() {
  const res = await fetch(`${BACKEND_URL}/logs`);
  return res.json();
}

async function addCard(label) {
  await fetch(`${BACKEND_URL}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label })
  });
  render();
}

async function deleteCard(id) {
  await fetch(`${BACKEND_URL}/cards/${id}`, { method: 'DELETE' });
  render();
}

async function toggleCard(id, status) {
  await fetch(`${BACKEND_URL}/cards/${id}/toggle`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  render();
}

function createCardElement(card) {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <span>${card.label} (x${card.payment_count || 0})</span>
    <button class="toggle-btn" data-id="${card.id}" data-status="Betaald">Betaald</button>
    <button class="toggle-btn" data-id="${card.id}" data-status="fout">-</button>
    <button class="delete-btn" data-id="${card.id}">🗑</button>
  `;
  return div;
}

function createLogItem(log, cards) {
  const li = document.createElement('li');
  const date = new Date(log.timestamp).toLocaleDateString(
    'nl-NL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const card = cards.find(card => card.id === log.card_id);
  const label = card ? card.label : 'Onbekende kaart';

  let count = paymentCounts[log.card_id] || 0;
  let labelWithCount = label;

  if (log.status === 'Betaald') {
    // Show count only on 'Betaald' logs
    labelWithCount += ` (x${count})`;
  }

  li.textContent = `${labelWithCount} -> ${log.status.toUpperCase()} @ ${date}`;
  return li;
}


async function render() {
  const cards = await fetchCards();
  const logs = await fetchLogs();

  // Render cards using payment_count
  const cardList = document.getElementById('cardList');
  cardList.innerHTML = '';
  cards.forEach(card => {
    cardList.appendChild(createCardElement(card, card.payment_count));
  });

  // Render logs (you no longer need to pass paymentCounts)
  const logList = document.getElementById('logList');
  logList.innerHTML = '';
  logs.slice(0, 10).forEach(log => {
    logList.appendChild(createLogItem(log, cards));
  });
}


document.getElementById('cardList').addEventListener('click', async e => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    const confirmDelete = confirm('Weet je zeker dat je deze kaart wilt verwijderen?');
    if (confirmDelete) {
      await deleteCard(id);
    }
  } else if (e.target.classList.contains('toggle-btn')) {
    const id = e.target.dataset.id;
    const status = e.target.dataset.status;

    if (status === 'fout') {
      const confirmUndo = confirm('Weet je zeker dat je een betaling wilt verwijderen (x-1)?');
      if (!confirmUndo) return;
    }

    await toggleCard(id, status);
  }
});

document.getElementById('addCardForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('cardLabel');
  const label = input.value.trim();
  if (label) {
    addCard(label);
    input.value = '';
  }
});

render();
