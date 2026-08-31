function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'Niet ingelogd' });
}

module.exports = { requireAuth };
