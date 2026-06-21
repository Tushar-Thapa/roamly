const express = require('express');
const { run, get, all } = require('../database');
const { requireAuth } = require('./auth');

const router = express.Router();

function parse(row) {
  return {
    ...row,
    durations:  JSON.parse(row.durations  || '[]'),
    tags:       JSON.parse(row.tags       || '[]'),
    highlights: JSON.parse(row.highlights || '[]'),
    transport:  JSON.parse(row.transport  || '[]'),
    itinerary:  JSON.parse(row.itinerary  || '[]'),
    pack:       JSON.parse(row.pack       || '[]'),
    budget: { travel: row.budget_travel, stay: row.budget_stay, food: row.budget_food },
    distances: {
      chandigarh: { km: row.dist_chandigarh, hr: row.hr_chandigarh },
      amritsar:   { km: row.dist_amritsar,   hr: row.hr_amritsar },
      delhi:      { km: row.dist_delhi,       hr: row.hr_delhi },
    }
  };
}

// GET /api/wishlist
router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await all(`
      SELECT d.* FROM destinations d
      INNER JOIN wishlist w ON w.destination_id = d.id
      WHERE w.user_id = $1 AND d.published = 1
      ORDER BY w.created_at DESC
    `, [req.user.id]);
    res.json(rows.map(parse));
  } catch (err) {
    console.error('Get wishlist error:', err);
    res.status(500).json({ error: 'Something went wrong loading your wishlist' });
  }
});

// GET /api/wishlist/ids
router.get('/ids', requireAuth, async (req, res) => {
  try {
    const rows = await all('SELECT destination_id FROM wishlist WHERE user_id = $1', [req.user.id]);
    res.json(rows.map(r => r.destination_id));
  } catch (err) {
    console.error('Get wishlist ids error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/wishlist/:destinationId
router.post('/:destinationId', requireAuth, async (req, res) => {
  try {
    const dest = await get('SELECT id FROM destinations WHERE id = $1', [req.params.destinationId]);
    if (!dest) return res.status(404).json({ error: 'Destination not found' });

    const existing = await get('SELECT id FROM wishlist WHERE user_id = $1 AND destination_id = $2', [req.user.id, req.params.destinationId]);
    if (existing) return res.status(409).json({ error: 'Already in wishlist' });

    await run('INSERT INTO wishlist (user_id, destination_id) VALUES ($1, $2)', [req.user.id, req.params.destinationId]);
    res.status(201).json({ saved: true, destination_id: Number(req.params.destinationId) });
  } catch (err) {
    console.error('Add wishlist error:', err);
    res.status(500).json({ error: 'Something went wrong saving to your wishlist' });
  }
});

// DELETE /api/wishlist/:destinationId
router.delete('/:destinationId', requireAuth, async (req, res) => {
  try {
    await run('DELETE FROM wishlist WHERE user_id = $1 AND destination_id = $2', [req.user.id, req.params.destinationId]);
    res.json({ saved: false, destination_id: Number(req.params.destinationId) });
  } catch (err) {
    console.error('Remove wishlist error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
