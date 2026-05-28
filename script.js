const grid    = document.getElementById('card-grid');
const overlay = document.getElementById('overlay');

const CARD_W = 110;
const CARD_H = 154;

let activeWrapper = null;

// ── Layout ───────────────────────────────────────
function layoutCards(wrappers) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const cols = Math.max(2, Math.floor(vw / (CARD_W * 1.7)));
  const rows = Math.ceil(wrappers.length / cols);

  const cellW = vw / cols;
  const cellH = Math.max(CARD_H + 40, vh / rows);

  grid.style.height = `${Math.max(vh, rows * cellH)}px`;

  wrappers.forEach((wrapper, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const margin = 12;
    const maxX = Math.max(0, cellW - CARD_W - margin * 2);
    const maxY = Math.max(0, cellH - CARD_H - margin * 2);

    const x = col * cellW + margin + Math.random() * maxX;
    const y = row * cellH + margin + Math.random() * maxY;

    wrapper.style.left = `${x}px`;
    wrapper.style.top  = `${y}px`;
    wrapper._absLeft   = x;
    wrapper._absTop    = y;
  });
}

// ── Build cards ──────────────────────────────────
const wrappers = CARDS.map((card) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'card-wrapper';

  const rot = +(Math.random() * 28 - 14).toFixed(2);
  wrapper._rot = rot;
  wrapper.style.transform = `rotate(${rot}deg)`;

  wrapper.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <span class="cf-corner cf-tl">PDG</span>
        <div class="cf-oval">
          <span class="cf-label">PDG<em>memories</em></span>
        </div>
        <span class="cf-corner cf-br">PDG</span>
      </div>
      <div class="card-back-face"></div>
    </div>
  `;

  wrapper.addEventListener('click', () => {
    if (!activeWrapper) openCard(wrapper, card);
  });

  grid.appendChild(wrapper);
  return wrapper;
});

layoutCards(wrappers);
window.addEventListener('resize', () => layoutCards(wrappers));

// ── Open card ────────────────────────────────────
// Aanpak: 2-fasen flip op card-inner (geen preserve-3d nodig)
//   t=0      : wrapper begint te vliegen naar midden (500ms)
//   t=300ms  : fase 1 — card-inner roteert naar de kant (200ms ease-in)
//   t=500ms  : wissel zijden, fase 2 — roteert terug (200ms ease-out)
function openCard(wrapper, card) {
  const rect      = wrapper.getBoundingClientRect();
  const inner     = wrapper.querySelector('.card-inner');
  const frontFace = wrapper.querySelector('.card-front');
  const backFace  = wrapper.querySelector('.card-back-face');

  // Sla viewport-positie op voor terugvlucht
  wrapper._origViewport = { left: rect.left, top: rect.top };

  // Vul achterkant
  backFace.innerHTML = buildContent(card);
  backFace.querySelector('.card-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeCard();
  });

  // Kaart naar fixed op huidige positie (geen zichtbare sprong)
  inner.style.transition = 'none';
  inner.style.transform  = '';
  wrapper.classList.add('is-active');
  Object.assign(wrapper.style, {
    position:   'fixed',
    left:       `${rect.left}px`,
    top:        `${rect.top}px`,
    width:      `${CARD_W}px`,
    height:     `${CARD_H}px`,
    zIndex:     '200',
    transform:  `rotate(${wrapper._rot}deg)`,
    transition: 'none',
  });

  overlay.classList.add('active');
  activeWrapper = wrapper;

  // Doelafmetingen
  const isVideo = card.type === 'video';
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const targetW = Math.min(isVideo ? 520 : 440, vw * 0.88);
  const targetH = isVideo ? Math.round(targetW * 9 / 16) : Math.min(300, vh * 0.62);

  // Vlieg naar midden
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const ease = 'cubic-bezier(.4,0,.2,1)';
    wrapper.style.transition = [
      `left .5s ${ease}`, `top .5s ${ease}`,
      `width .5s ${ease}`, `height .5s ${ease}`,
      `transform .5s ${ease}`,
    ].join(',');
    wrapper.style.left      = `${(vw - targetW) / 2}px`;
    wrapper.style.top       = `${(vh - targetH) / 2}px`;
    wrapper.style.width     = `${targetW}px`;
    wrapper.style.height    = `${targetH}px`;
    wrapper.style.transform = 'rotate(0deg)';
  }));

  // Flip fase 1: roteer naar de kant
  setTimeout(() => {
    inner.style.transition = 'transform 0.2s ease-in';
    inner.style.transform  = 'rotateY(90deg)';
  }, 300);

  // Flip fase 2: wissel zijden en roteer terug
  setTimeout(() => {
    frontFace.style.visibility = 'hidden';
    backFace.style.display     = 'flex';
    inner.style.transition     = 'none';
    inner.style.transform      = 'rotateY(-90deg)';
    requestAnimationFrame(() => {
      inner.style.transition = 'transform 0.2s ease-out';
      inner.style.transform  = 'rotateY(0deg)';
    });
  }, 500);
}

// ── Close card ───────────────────────────────────
// t=0    : flip fase 1 (200ms ease-in)
// t=200ms: wissel zijden, flip fase 2 (200ms ease-out), start terugvlucht (450ms)
// t=700ms: cleanup
function closeCard() {
  if (!activeWrapper) return;

  const wrapper   = activeWrapper;
  const inner     = wrapper.querySelector('.card-inner');
  const frontFace = wrapper.querySelector('.card-front');
  const backFace  = wrapper.querySelector('.card-back-face');

  // Flip fase 1
  inner.style.transition = 'transform 0.2s ease-in';
  inner.style.transform  = 'rotateY(90deg)';

  setTimeout(() => {
    // Stop video
    const iframe = inner.querySelector('iframe');
    if (iframe) iframe.src = '';

    // Wissel zijden
    backFace.style.display     = 'none';
    frontFace.style.visibility = 'visible';

    // Flip fase 2
    inner.style.transition = 'none';
    inner.style.transform  = 'rotateY(-90deg)';
    requestAnimationFrame(() => {
      inner.style.transition = 'transform 0.2s ease-out';
      inner.style.transform  = 'rotateY(0deg)';
    });

    // Vlieg terug naar originele positie
    const { left, top } = wrapper._origViewport;
    const ease = 'cubic-bezier(.4,0,.2,1)';
    wrapper.style.transition = [
      `left .45s ${ease}`, `top .45s ${ease}`,
      `width .45s ${ease}`, `height .45s ${ease}`,
      `transform .45s ${ease}`,
    ].join(',');
    wrapper.style.left      = `${left}px`;
    wrapper.style.top       = `${top}px`;
    wrapper.style.width     = `${CARD_W}px`;
    wrapper.style.height    = `${CARD_H}px`;
    wrapper.style.transform = `rotate(${wrapper._rot}deg)`;

    overlay.classList.remove('active');
  }, 200);

  // Herstel naar flow
  setTimeout(() => {
    wrapper.classList.remove('is-active');
    Object.assign(wrapper.style, {
      position:   'absolute',
      left:       `${wrapper._absLeft}px`,
      top:        `${wrapper._absTop}px`,
      width:      `${CARD_W}px`,
      height:     `${CARD_H}px`,
      zIndex:     '',
      transition: '',
      transform:  `rotate(${wrapper._rot}deg)`,
    });
    inner.style.transition     = '';
    inner.style.transform      = '';
    frontFace.style.visibility = '';
    backFace.innerHTML         = '';
    backFace.style.display     = 'none';
    activeWrapper = null;
  }, 700);
}

// ── Content builders ─────────────────────────────
function buildContent(card) {
  const btn = `<button class="card-close" aria-label="Sluiten">✕</button>`;

  if (card.type === 'question') {
    return `${btn}<p class="card-text">${escapeHtml(card.question)}</p>`;
  }
  if (card.type === 'video') {
    const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(card.videoId)}?autoplay=1`;
    return `${btn}
      <div class="card-video-wrapper">
        <iframe src="${src}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>`;
  }
  return '';
}

// ── Global events ─────────────────────────────────
overlay.addEventListener('click', closeCard);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCard();
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
