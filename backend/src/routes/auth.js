const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty(),
  body('role').isIn(['admin', 'staff', 'manager'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name, role, cafeteria_id } = req.body;
    const hash = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      'INSERT INTO users (email, password_hash, name, role, cafeteria_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, name, role',
      [email, hash, name, role, cafeteria_id]
    );
    const token = jwt.sign({ id: rows[0].id, role: rows[0].role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ user: rows[0], token });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    next(err);
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows[0] || !await bcrypt.compare(password, rows[0].password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: rows[0].id, role: rows[0].role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ user: { id: rows[0].id, email, name: rows[0].name, role: rows[0].role }, token });
  } catch (err) { next(err); }
});

module.exports = router;
