const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');
const loginForm    = document.getElementById('login-form');
const loginError   = document.getElementById('login-error');
const logoutBtn    = document.getElementById('logout-btn');

const addForm       = document.getElementById('add-form');
const addType       = document.getElementById('add-type');
const questionField = document.getElementById('question-field');
const videoField    = document.getElementById('video-field');
const addQuestion   = document.getElementById('add-question');
const addVideoId    = document.getElementById('add-videoid');
const addError      = document.getElementById('add-error');

const itemList  = document.getElementById('item-list');
const itemCount = document.getElementById('item-count');

function showAdmin() {
  loginSection.hidden = true;
  adminSection.hidden = false;
  loadItems();
}

function showLogin() {
  loginSection.hidden = false;
  adminSection.hidden = true;
}

async function checkSession() {
  const res  = await fetch('/api/session');
  const data = await res.json();
  if (data.loggedIn) showAdmin();
  else showLogin();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;

  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (res.ok) {
    loginForm.reset();
    showAdmin();
  } else {
    const data = await res.json().catch(() => ({}));
    loginError.textContent = data.error || 'Inloggen mislukt';
    loginError.hidden = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  showLogin();
});

addType.addEventListener('change', () => {
  const isVideo = addType.value === 'video';
  questionField.hidden = isVideo;
  videoField.hidden = !isVideo;
});

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  addError.hidden = true;

  const type = addType.value;
  const body = type === 'question'
    ? { type, question: addQuestion.value }
    : { type, videoId: addVideoId.value };

  const res = await fetch('/api/admin/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    addForm.reset();
    questionField.hidden = false;
    videoField.hidden = true;
    loadItems();
  } else {
    const data = await res.json().catch(() => ({}));
    addError.textContent = data.error || 'Toevoegen mislukt';
    addError.hidden = false;
  }
});

async function loadItems() {
  const res = await fetch('/api/admin/cards');
  if (res.status === 401) return showLogin();
  renderItems(await res.json());
}

function renderItems(items) {
  itemCount.textContent = items.length;
  itemList.innerHTML = '';

  items.forEach((item) => {
    const li = document.createElement('li');

    const label = document.createElement('span');
    label.textContent = item.type === 'video'
      ? `🎬 Video: ${item.videoId}`
      : `❓ ${item.question}`;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = 'Verwijderen';
    delBtn.className = 'delete-btn';
    delBtn.addEventListener('click', () => deleteItem(item.id));

    li.append(label, delBtn);
    itemList.appendChild(li);
  });
}

async function deleteItem(id) {
  if (!confirm('Dit kaartje verwijderen?')) return;
  const res = await fetch(`/api/admin/cards/${id}`, { method: 'DELETE' });
  if (res.ok) loadItems();
}

checkSession();
