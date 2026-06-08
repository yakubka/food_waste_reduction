const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { cafeteria_id, category } = req.query;
    let sql = 'SELECT * FROM meals WHERE is_active=true';
    const params = [];
    if (cafeteria_id) { params.push(cafeteria_id); sql += ` AND cafeteria_id=$${params.length}`; }
    if (category)     { params.push(category);     sql += ` AND category=$${params.length}`; }
    sql += ' ORDER BY name';
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', authorize('admin', 'manager'), [
  body('name').trim().notEmpty(),
  body('category').isIn(['breakfast', 'lunch', 'dinner', 'snack']),
  body('cafeteria_id').isUUID(),
  body('serving_size_g').isInt({ min: 1 }),
  body('cost_per_serving').isFloat({ min: 0 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, category, cafeteria_id, serving_size_g, cost_per_serving, description } = req.body;
    const { rows } = await db.query(
      `INSERT INTO meals (name, category, cafeteria_id, serving_size_g, cost_per_serving, description)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, category, cafeteria_id, serving_size_g, cost_per_serving, description]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.get('/:id/waste-trend', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT DATE(created_at) AS date, SUM(weight_kg) AS total_waste_kg
       FROM waste_logs
       WHERE meal_id=$1 AND created_at >= NOW() - INTERVAL '14 days'
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
