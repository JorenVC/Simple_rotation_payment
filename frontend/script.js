const BACKEND_URL = 'https://your-backend.onrender.com'; // Replace this

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
    <span>${card.label}</span>
    <button class="toggle-btn" data-id="${card.id}" data-status="on">ON</button>
    <button class="toggle-btn" data-id="${card.id}" data-status="off">OFF</button>
    <button class="delete-btn" data-id="${card.id}">🗑</button>
  `;
  return div;
}

function createLogItem(log) {
  const li = document.createElement('li');
  const date = new Date(log.timestamp);
  li.textContent = `Card ${log.card_id} → ${log.status.toUpperCase()} @ ${date.toLocaleString()}`;
  return li;
}

async function render() {
  const cards = await fetchCards();
  const logs = await fetchLogs();

  const cardList = document.getElementById('cardList');
  cardList.innerHTML = '';
  cards.forEach(card => cardList.appendChild(createCardElement(card)));

  const logList = document.getElementById('logList');
  logList.innerHTML = '';
  logs.slice(0, 10).forEach(log => logList.appendChild(createLogItem(log)));
}

document.getElementById('addCardForm').addEventListener('submit', async e => {
  e.preventDefault();
  const input = document.getElementById('cardLabel');
  const label = input.value.trim();
  if (label) {
    await addCard(label);
    input.value = '';
  }
});

document.getElementById('cardList').addEventListener('click', async e => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    await deleteCard(id);
  } else if (e.target.classList.contains('toggle-btn')) {
    const id = e.target.dataset.id;
    const status = e.target.dataset.status;
    await toggleCard(id, status);
  }
});

render();
