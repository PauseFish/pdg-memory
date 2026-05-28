const grid    = document.getElementById('card-grid');
const overlay = document.getElementById('overlay');

let activeWrapper = null;
let placeholder   = null;

// ── Build scattered cards ────────────────────────
CARDS.forEach((card) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'card-wrapper';

  // Random rotation + slight vertical scatter
  const rot = +(Math.random() * 28 - 14).toFixed(2);   // -14 … +14 deg
  const dy  = +(Math.random() * 20 - 10).toFixed(2);   // -10 … +10 px
  wrapper._rot = rot;
  wrapper._dy  = dy;
  wrapper.style.transform = `rotate(${rot}deg) translateY(${dy}px)`;

  wrapper.innerHTML = `
    <div class="card-inner">
      <div class="card-front"></div>
      <div class="card-back-face"></div>
    </div>
  `;

  wrapper.addEventListener('click', () => {
    if (!activeWrapper) openCard(wrapper, card);
  });

  grid.appendChild(wrapper);
});

// ── Open card ────────────────────────────────────
function openCard(wrapper, card) {
  const rect  = wrapper.getBoundingClientRect();
  const inner = wrapper.querySelector('.card-inner');

  // Keep the grid space with an invisible placeholder
  placeholder = document.createElement('div');
  placeholder.style.cssText =
    `width:${rect.width}px;height:${rect.height}px;flex-shrink:0;visibility:hidden;`;
  wrapper.parentNode.insertBefore(placeholder, wrapper);

  // Fill back face
  const backFace = wrapper.querySelector('.card-back-face');
  backFace.innerHTML = buildContent(card);
  backFace.querySelector('.card-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeCard();
  });

  // Switch to fixed at the card's current viewport position
  wrapper.classList.add('is-active');
  inner.style.transition = 'none';

  Object.assign(wrapper.style, {
    position:  'fixed',
    left:      `${rect.left}px`,
    top:       `${rect.top}px`,
    width:     `${rect.width}px`,
    height:    `${rect.height}px`,
    margin:    '0',
    zIndex:    '200',
    transform: `rotate(${wrapper._rot}deg) translateY(0px)`,
    transition: 'none',
  });

  overlay.classList.add('active');
  activeWrapper = wrapper;

  // Target dimensions
  const isVideo = card.type === 'video';
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const targetW = Math.min(isVideo ? 520 : 440, vw * 0.88);
  const targetH = isVideo
    ? Math.round(targetW * 9 / 16)
    : Math.min(300, vh * 0.62);
  const targetL = (vw - targetW) / 2;
  const targetT = (vh - targetH) / 2;

  // Animate: fly to center, straighten, grow — then flip
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const move = 'cubic-bezier(.4,0,.2,1)';
    wrapper.style.transition = [
      `left .5s ${move}`,
      `top .5s ${move}`,
      `width .5s ${move}`,
      `height .5s ${move}`,
      `transform .5s ${move}`,
    ].join(',');
    wrapper.style.left      = `${targetL}px`;
    wrapper.style.top       = `${targetT}px`;
    wrapper.style.width     = `${targetW}px`;
    wrapper.style.height    = `${targetH}px`;
    wrapper.style.transform = 'rotate(0deg)';

    // Flip starts just after movement begins
    inner.style.transition = `transform .55s cubic-bezier(.4,0,.2,1) .08s`;
    inner.style.transform  = 'rotateY(180deg)';
  }));
}

// ── Close card ───────────────────────────────────
function closeCard() {
  if (!activeWrapper || !placeholder) return;

  const wrapper = activeWrapper;
  const inner   = wrapper.querySelector('.card-inner');

  // Stop any playing video
  const iframe = inner.querySelector('iframe');
  if (iframe) iframe.src = '';

  // Return to original position (read from placeholder)
  const pr   = placeholder.getBoundingClientRect();
  const move = 'cubic-bezier(.4,0,.2,1)';
  wrapper.style.transition = [
    `left .45s ${move}`,
    `top .45s ${move}`,
    `width .45s ${move}`,
    `height .45s ${move}`,
    `transform .45s ${move}`,
  ].join(',');
  wrapper.style.left      = `${pr.left}px`;
  wrapper.style.top       = `${pr.top}px`;
  wrapper.style.width     = `${pr.width}px`;
  wrapper.style.height    = `${pr.height}px`;
  wrapper.style.transform = `rotate(${wrapper._rot}deg)`;

  inner.style.transition = `transform .4s ${move}`;
  inner.style.transform  = 'rotateY(0deg)';

  overlay.classList.remove('active');

  // After animation: restore card to normal flow
  setTimeout(() => {
    wrapper.classList.remove('is-active');
    wrapper.style.cssText  = '';           // clear all inline
    wrapper.style.transform = `rotate(${wrapper._rot}deg) translateY(${wrapper._dy}px)`;
    inner.style.transition  = '';
    inner.style.transform   = '';
    wrapper.querySelector('.card-back-face').innerHTML = '';
    placeholder.remove();
    placeholder   = null;
    activeWrapper = null;
  }, 460);
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

// ── Global close events ───────────────────────────
overlay.addEventListener('click', closeCard);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCard();
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}
