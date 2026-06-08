const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();
router.use(authenticate);

// Overall waste reduction stats
router.get('/overview', async (req, res, next) => {
  try {
    const { cafeteria_id } = req.query;
    const param = cafeteria_id || null;

    const [totals, topWaste, peakHours] = await Promise.all([
      db.query(
        `SELECT
           ROUND(SUM(weight_kg)::numeric, 2) AS total_waste_kg,
           ROUND(AVG(weight_kg)::numeric, 2) AS avg_waste_per_entry,
           COUNT(*) AS total_entries,
           ROUND(SUM(weight_kg * 2.5)::numeric, 2) AS estimated_cost_usd
         FROM waste_logs
         WHERE ($1::uuid IS NULL OR cafeteria_id=$1)
           AND created_at >= NOW() - INTERVAL '30 days'`,
        [param]
      ),
      db.query(
        `SELECT m.name, ROUND(SUM(wl.weight_kg)::numeric, 2) AS waste_kg
         FROM waste_logs wl JOIN meals m ON wl.meal_id=m.id
         WHERE ($1::uuid IS NULL OR wl.cafeteria_id=$1)
           AND wl.created_at >= NOW() - INTERVAL '30 days'
         GROUP BY m.name ORDER BY waste_kg DESC LIMIT 5`,
        [param]
      ),
      db.query(
        `SELECT EXTRACT(HOUR FROM created_at) AS hour, ROUND(SUM(weight_kg)::numeric, 2) AS waste_kg
         FROM waste_logs
         WHERE ($1::uuid IS NULL OR cafeteria_id=$1)
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY hour ORDER BY hour`,
        [param]
      )
    ]);

    res.json({
      summary: totals.rows[0],
      top_waste_meals: topWaste.rows,
      waste_by_hour: peakHours.rows
    });
  } catch (err) { next(err); }
});

// Predicted demand for next 7 days (stub — real model runs in ML service)
router.get('/demand-forecast', async (req, res, next) => {
  try {
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      return {
        date: date.toISOString().split('T')[0],
        predicted_servings: Math.round(200 + Math.random() * 100),
        confidence: +(0.75 + Math.random() * 0.2).toFixed(2)
      };
    });
    res.json(forecast);
  } catch (err) { next(err); }
});

// Waste reduction percentage vs baseline
router.get('/reduction', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT
         DATE_TRUNC('week', created_at) AS week,
         ROUND(SUM(weight_kg)::numeric, 2) AS total_kg
       FROM waste_logs
       WHERE created_at >= NOW() - INTERVAL '12 weeks'
       GROUP BY week ORDER BY week`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
