const express = require('express');
const { run, get, all } = require('../database');
const { requireAuth } = require('./auth');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

function parse(row) {
  if (!row) return null;
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

// GET /api/destinations
router.get('/', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM destinations WHERE published = 1 ORDER BY id');
    res.json(rows.map(parse));
  } catch (err) {
    console.error('Get destinations error:', err);
    res.status(500).json({ error: 'Something went wrong loading destinations' });
  }
});

// GET /api/destinations/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await get('SELECT * FROM destinations WHERE id = $1 AND published = 1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Destination not found' });
    res.json(parse(row));
  } catch (err) {
    console.error('Get destination error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/destinations (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, region, budget_travel=0, budget_stay=0, budget_food=0,
      durations=[], tags=[], highlights=[], transport=[], itinerary=[],
      best_time='', pack=[], dist_chandigarh=0, hr_chandigarh=0,
      dist_amritsar=0, hr_amritsar=0, dist_delhi=0, hr_delhi=0, published=1 } = req.body;

    if (!name || !region) return res.status(400).json({ error: 'Name and region are required' });

    const inserted = await get(`INSERT INTO destinations (
      name,region,budget_travel,budget_stay,budget_food,
      durations,tags,highlights,transport,itinerary,best_time,pack,
      dist_chandigarh,hr_chandigarh,dist_amritsar,hr_amritsar,dist_delhi,hr_delhi,published
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    RETURNING id`,
    [name,region,budget_travel,budget_stay,budget_food,
      JSON.stringify(durations),JSON.stringify(tags),JSON.stringify(highlights),
      JSON.stringify(transport),JSON.stringify(itinerary),best_time,JSON.stringify(pack),
      dist_chandigarh,hr_chandigarh,dist_amritsar,hr_amritsar,dist_delhi,hr_delhi,published]);

    const row = await get('SELECT * FROM destinations WHERE id = $1', [inserted.id]);
    res.status(201).json(parse(row));
  } catch (err) {
    console.error('Create destination error:', err);
    res.status(500).json({ error: 'Something went wrong creating the destination' });
  }
});

// PUT /api/destinations/:id (admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existing = await get('SELECT * FROM destinations WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Destination not found' });
    const f = { ...existing, ...req.body };
    const toStr = v => typeof v === 'string' ? v : JSON.stringify(v || []);

    await run(`UPDATE destinations SET
      name=$1,region=$2,budget_travel=$3,budget_stay=$4,budget_food=$5,
      durations=$6,tags=$7,highlights=$8,transport=$9,itinerary=$10,best_time=$11,pack=$12,
      dist_chandigarh=$13,hr_chandigarh=$14,dist_amritsar=$15,hr_amritsar=$16,dist_delhi=$17,hr_delhi=$18,published=$19
      WHERE id=$20`,
    [f.name,f.region,f.budget_travel,f.budget_stay,f.budget_food,
      toStr(f.durations),toStr(f.tags),toStr(f.highlights),
      toStr(f.transport),toStr(f.itinerary),f.best_time,toStr(f.pack),
      f.dist_chandigarh,f.hr_chandigarh,f.dist_amritsar,f.hr_amritsar,f.dist_delhi,f.hr_delhi,f.published,
      req.params.id]);

    const row = await get('SELECT * FROM destinations WHERE id = $1', [req.params.id]);
    res.json(parse(row));
  } catch (err) {
    console.error('Update destination error:', err);
    res.status(500).json({ error: 'Something went wrong updating the destination' });
  }
});

// DELETE /api/destinations/:id (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existing = await get('SELECT id FROM destinations WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Destination not found' });
    await run('DELETE FROM destinations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete destination error:', err);
    res.status(500).json({ error: 'Something went wrong deleting the destination' });
  }
});

module.exports = router;
