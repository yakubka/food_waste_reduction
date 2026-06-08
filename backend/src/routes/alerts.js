const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM alerts WHERE cafeteria_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.query.cafeteria_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    await db.query('UPDATE alerts SET is_read=true WHERE id=$1 AND cafeteria_id=$2', [
      req.params.id, req.query.cafeteria_id
    ]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
