const grid    = document.getElementById('card-grid');
const overlay = document.getElementById('overlay');

// Kaartafmetingen worden dynamisch bepaald door computeLayout()
let CARD_W = 165;
let CARD_H = 231;

let activeWrapper = null;

// ── Bepaal optimale kaartgrootte en rijindeling ──
// Probeert 1.5× (165×231), schaalt terug als het niet past.
function computeLayout(n, vw, vh) {
  const aspect = 110 / 154;
  for (let w = 165; w >= 88; w = Math.round(w * 0.88)) {
    const h = Math.round(w / aspect);
    for (let rows = 2; rows <= 5; rows++) {
      if (vh < rows * (h + 12)) continue;                 // past niet verticaal
      if (Math.floor(vw / (w + 12)) * rows >= n) {        // past horizontaal
        return { w, h, rows };
      }
    }
  }
  return { w: 110, h: 154, rows: 3 };
}

// ── Organische rijverdeling (meer kaarten in het midden) ──
function distributeUneven(total, rows) {
  if (rows === 1) return [total];
  const weights = Array.from({ length: rows }, (_, i) => {
    const pos = rows > 1 ? i / (rows - 1) : 0.5;
    const bell = Math.sin(pos * Math.PI);                  // piek in het midden
    return 0.45 + bell * 0.55 + (Math.random() - 0.5) * 0.25;
  });
  const wSum   = weights.reduce((a, b) => a + b, 0);
  const scaled = weights.map(w => (w / wSum) * total);
  const floors = scaled.map(Math.floor);
  let rem = total - floors.reduce((a, b) => a + b, 0);
  scaled.map((v, i) => [v - Math.floor(v), i])
        .sort(([a], [b]) => b - a)
        .forEach(([, i]) => { if (rem-- > 0) floors[i]++; });
  return floors;
}

// ── Kaartjes over het volledige scherm spreiden ──
function layoutCards(wrappers) {
  const n  = wrappers.length;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const layout = computeLayout(n, vw, vh);
  CARD_W = layout.w;
  CARD_H = layout.h;

  // Pas kaartgrootte aan in de DOM
  wrappers.forEach(w => {
    w.style.width  = `${CARD_W}px`;
    w.style.height = `${CARD_H}px`;
  });

  const rowCounts = distributeUneven(n, layout.rows);
  const rowH = vh / layout.rows;
  let idx = 0;

  rowCounts.forEach((count, rowIdx) => {
    const rowTop = rowIdx * rowH;

    for (let i = 0; i < count; i++) {
      const wrapper = wrappers[idx++];
      if (!wrapper) return;

      // X: verdeel de rij in zones, kaart willekeurig binnen zijn zone
      const zoneW = vw / count;
      const minX  = Math.max(2, i * zoneW + 4);
      const maxX  = Math.min(vw - CARD_W - 2, (i + 1) * zoneW - CARD_W - 4);
      const x     = minX + Math.random() * Math.max(0, maxX - minX);

      // Y: band loopt 50% van rowH buiten de rijgrenzen — kaarten uit
      // verschillende rijen overlappen verticaal voor een organisch effect.
      const minY = Math.max(2, rowTop - rowH * 0.25);
      const maxY = Math.min(vh - CARD_H - 2, rowTop + rowH * 1.25 - CARD_H);
      const y    = minY + Math.random() * Math.max(0, maxY - minY);

      wrapper.style.left = `${x}px`;
      wrapper.style.top  = `${y}px`;
      wrapper._absLeft   = x;
      wrapper._absTop    = y;
    }
  });

  grid.style.height = `${vh}px`;
}

// ── Build cards ──────────────────────────────────
const wrappers = CARDS.map((card) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'card-wrapper';

  const angle = +(5 + Math.random() * 20).toFixed(2);      // 5–25 graden
  const rot   = Math.random() < 0.5 ? angle : -angle;      // links of rechts
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
window.addEventListener('resize', () => { if (!activeWrapper) layoutCards(wrappers); });

// ── Open card ────────────────────────────────────
// Aanpak: 2-fasen flip op card-inner (geen preserve-3d nodig)
//   t=0      : wrapper begint te vliegen naar midden (500ms)
//   t=300ms  : fase 1 — card-inner roteert naar de kant (200ms ease-in)
//   t=500ms  : wissel zijden, fase 2 — roteert terug (200ms ease-out)
function openCard(wrapper, card) {
  const inner     = wrapper.querySelector('.card-inner');
  const frontFace = wrapper.querySelector('.card-front');
  const backFace  = wrapper.querySelector('.card-back-face');

  // Vul achterkant
  backFace.innerHTML = buildContent(card);
  backFace.querySelector('.card-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeCard();
  });

  // Gebruik _absLeft/_absTop als anker voor fixed, NIET getBoundingClientRect().
  // getBoundingClientRect() geeft de bounding box van het geroteerde element,
  // die afwijkt van de CSS left/top — dat veroorzaakt een positiesprong.
  const gridRect = grid.getBoundingClientRect();
  const fLeft = wrapper._absLeft + gridRect.left;
  const fTop  = wrapper._absTop  + gridRect.top;

  inner.style.transition = 'none';
  inner.style.transform  = '';
  wrapper.classList.add('is-active');
  Object.assign(wrapper.style, {
    position:   'fixed',
    left:       `${fLeft}px`,
    top:        `${fTop}px`,
    width:      `${CARD_W}px`,
    height:     `${CARD_H}px`,
    zIndex:     '200',
    transform:  `rotate(${wrapper._rot}deg)`,
    transition: 'none',
  });

  overlay.classList.add('active');
  activeWrapper = wrapper;

  // Doelafmetingen — altijd portret
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let targetW, targetH;

  if (card.type === 'video') {
    // YouTube Shorts zijn 9:16 portret
    targetH = Math.min(vh * 0.82, 600);
    targetW = Math.round(targetH * 9 / 16);
    if (targetW > vw * 0.88) {
      targetW = Math.round(vw * 0.88);
      targetH = Math.round(targetW * 16 / 9);
    }
  } else {
    // Tekst: kaartverhouding 110:154
    targetH = Math.min(vh * 0.72, 500);
    targetW = Math.round(targetH * (110 / 154));
    if (targetW > vw * 0.88) {
      targetW = Math.round(vw * 0.88);
      targetH = Math.round(targetW * (154 / 110));
    }
  }

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

    // Vlieg terug: gebruik hetzelfde gridRect-anker als bij openen,
    // zodat de eindpositie van fixed exact overeenkomt met de absolute positie.
    const gridRect = grid.getBoundingClientRect();
    const fLeft = wrapper._absLeft + gridRect.left;
    const fTop  = wrapper._absTop  + gridRect.top;
    const ease  = 'cubic-bezier(.4,0,.2,1)';
    wrapper.style.transition = [
      `left .45s ${ease}`, `top .45s ${ease}`,
      `width .45s ${ease}`, `height .45s ${ease}`,
      `transform .45s ${ease}`,
    ].join(',');
    wrapper.style.left      = `${fLeft}px`;
    wrapper.style.top       = `${fTop}px`;
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
    const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(card.videoId)}?autoplay=1&controls=0&disablekb=1`;
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
