const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();
router.use(authenticate);

// Log waste entry (from IoT scale or manual)
router.post('/', [
  body('meal_id').isUUID(),
  body('weight_kg').isFloat({ min: 0 }),
  body('cafeteria_id').isUUID(),
  body('source').isIn(['scale', 'manual']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { meal_id, weight_kg, cafeteria_id, source, notes } = req.body;
    const { rows } = await db.query(
      `INSERT INTO waste_logs (meal_id, weight_kg, cafeteria_id, logged_by, source, notes)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [meal_id, weight_kg, cafeteria_id, req.user.id, source, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// Get waste logs with filters
router.get('/', [
  query('cafeteria_id').optional().isUUID(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
], async (req, res, next) => {
  try {
    const { cafeteria_id, from, to, limit = 100 } = req.query;
    let sql = `SELECT wl.*, m.name AS meal_name, m.category
               FROM waste_logs wl
               JOIN meals m ON wl.meal_id = m.id
               WHERE 1=1`;
    const params = [];

    if (cafeteria_id) { params.push(cafeteria_id); sql += ` AND wl.cafeteria_id=$${params.length}`; }
    if (from)         { params.push(from);          sql += ` AND wl.created_at>=$${params.length}`; }
    if (to)           { params.push(to);            sql += ` AND wl.created_at<=$${params.length}`; }
    params.push(limit); sql += ` ORDER BY wl.created_at DESC LIMIT $${params.length}`;

    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// Daily waste summary
router.get('/summary/daily', async (req, res, next) => {
  try {
    const { cafeteria_id } = req.query;
    const { rows } = await db.query(
      `SELECT DATE(created_at) AS date,
              SUM(weight_kg) AS total_kg,
              COUNT(*) AS entries,
              AVG(weight_kg) AS avg_kg_per_entry
       FROM waste_logs
       WHERE ($1::uuid IS NULL OR cafeteria_id=$1)
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [cafeteria_id || null]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
