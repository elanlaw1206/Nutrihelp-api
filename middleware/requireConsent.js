// middleware/requireConsent.js
// Enforces consent before allowing access to protected routes.
// Dependency-injected so tests can provide a fake getConsentFor().

module.exports = ({ getConsentFor }) => {
  return async (req, res, next) => {
    const userId = req.get('X-User-Id');
    if (!userId) return res.status(401).json({ error: 'Missing user id' });
    try {
      const consent = await getConsentFor(userId); // { granted: true/false }
      if (consent && consent.granted) return next();
      return res.status(403).json({ error: 'Consent required' });
    } catch (e) {
      return res.status(500).json({ error: 'Consent check failed' });
    }
  };
};
