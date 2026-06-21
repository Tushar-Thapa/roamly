const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { run, get } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'roamly-secret-change-in-production';
const ADMIN_CODE = process.env.ADMIN_CODE || 'roamly-admin-2026';

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, adminCode } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await get('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const role = (adminCode && adminCode === ADMIN_CODE) ? 'admin' : 'user';
    const hashed = bcrypt.hashSync(password, 10);

    const inserted = await get(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashed, role]
    );

    const token = jwt.sign({ id: inserted.id, role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: inserted.id, name, email, role } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Something went wrong during signup' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await get('SELECT * FROM users WHERE email = $1', [email]);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong during login' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await get('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PUT /api/auth/me — update name and/or email
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).json({ error: 'Name and email are required' });

    const existing = await get('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
    if (existing) return res.status(409).json({ error: 'Another account already uses this email' });

    await run('UPDATE users SET name = $1, email = $2 WHERE id = $3', [name, email, req.user.id]);
    const user = await get('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PUT /api/auth/password
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Current and new password are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = await get('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!user || !bcrypt.compareSync(currentPassword, user.password))
      return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = bcrypt.hashSync(newPassword, 10);
    await run('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = router;
module.exports.requireAuth = requireAuth;
