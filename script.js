const grid    = document.getElementById('card-grid');
const overlay = document.getElementById('overlay');
const modal   = document.getElementById('modal');
const content = document.getElementById('modal-content');
const closeBtn = document.getElementById('modal-close');

let activeCard = null;

function iconFor(card) {
  return card.type === 'video' ? '▶️' : '❓';
}

// Build the grid from CARDS (defined in cards.js)
CARDS.forEach((card, index) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'card-wrapper';
  wrapper.dataset.index = index;

  wrapper.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <span class="card-icon">${iconFor(card)}</span>
        <span class="card-label">${card.label}</span>
      </div>
      <div class="card-back-face"></div>
    </div>
  `;

  wrapper.addEventListener('click', () => openCard(wrapper, card));
  grid.appendChild(wrapper);
});

function openCard(wrapper, card) {
  // Flip the card
  if (activeCard && activeCard !== wrapper) {
    activeCard.classList.remove('flipped');
  }
  wrapper.classList.add('flipped');
  activeCard = wrapper;

  // Fill modal
  content.innerHTML = buildModalContent(card);

  // Wire up "toon antwoord" button if present
  const answerBtn = content.querySelector('.show-answer-btn');
  if (answerBtn) {
    answerBtn.addEventListener('click', () => {
      const answer = content.querySelector('.modal-answer');
      answer.classList.add('visible');
      answerBtn.style.display = 'none';
    });
  }

  overlay.classList.add('active');
}

function buildModalContent(card) {
  if (card.type === 'question') {
    const hasAnswer = card.answer && card.answer.trim() !== '';
    return `
      <span class="modal-type-badge">❓ Vraag</span>
      <p class="modal-question">${escapeHtml(card.question)}</p>
      ${hasAnswer ? `
        <button class="show-answer-btn">Toon antwoord</button>
        <div class="modal-answer">${escapeHtml(card.answer)}</div>
      ` : ''}
    `;
  }

  if (card.type === 'video') {
    return `
      <span class="modal-type-badge">▶️ Video</span>
      <p class="modal-video-title">${escapeHtml(card.title || 'Video')}</p>
      <div class="video-container">
        <iframe
          src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(card.videoId)}?autoplay=1"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    `;
  }

  return '<p>Onbekend kaarttype.</p>';
}

function closeModal() {
  overlay.classList.remove('active');
  // Stop any playing video by clearing the iframe src
  const iframe = content.querySelector('iframe');
  if (iframe) iframe.src = '';

  if (activeCard) {
    activeCard.classList.remove('flipped');
    activeCard = null;
  }
}

closeBtn.addEventListener('click', closeModal);

// Close on overlay background click
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
