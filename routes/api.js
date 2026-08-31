const express = require('express');
const bcrypt = require('bcryptjs');
const { readItems, addItem, deleteItem } = require('../lib/store');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── Publiek: kaartjes voor het spel ──────────────
router.get('/cards', (req, res) => {
  res.json(readItems());
});

// ── Auth ──────────────────────────────────────────
router.get('/session', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.user) });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const validUser = process.env.ADMIN_USERNAME;
  const validHash = process.env.ADMIN_PASSWORD_HASH;

  if (!validUser || !validHash) {
    return res.status(500).json({ error: 'Server niet geconfigureerd. Zie .env.example.' });
  }
  if (username !== validUser || !bcrypt.compareSync(String(password || ''), validHash)) {
    return res.status(401).json({ error: 'Ongeldige gebruikersnaam of wachtwoord' });
  }

  req.session.user = username;
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ── Admin: kaartjes beheren ──────────────────────
router.get('/admin/cards', requireAuth, (req, res) => {
  res.json(readItems());
});

router.post('/admin/cards', requireAuth, (req, res) => {
  const { type, question, videoId } = req.body || {};

  if (type === 'question') {
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Vraag mag niet leeg zijn' });
    }
    return res.status(201).json(addItem({ type: 'question', question: question.trim() }));
  }

  if (type === 'video') {
    if (!videoId || typeof videoId !== 'string' || !videoId.trim()) {
      return res.status(400).json({ error: 'Video-ID mag niet leeg zijn' });
    }
    return res.status(201).json(addItem({ type: 'video', videoId: videoId.trim() }));
  }

  return res.status(400).json({ error: 'Ongeldig type, gebruik "question" of "video"' });
});

router.delete('/admin/cards/:id', requireAuth, (req, res) => {
  const removed = deleteItem(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Niet gevonden' });
  res.json({ ok: true });
});

module.exports = router;
