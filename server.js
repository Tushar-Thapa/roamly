const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initDb } = require('./database');

const app  = express();
const PORT = process.env.PORT || 3001; // Render sets PORT automatically

app.use(cors());
app.use(express.json());

// Serve photos and frontend statically
app.use('/photos', express.static(path.join(__dirname, 'photos')));
app.use(express.static(__dirname));

// API routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/wishlist',     require('./routes/wishlist'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Fallback to index.html for any non-API route (so refreshes on the SPA work)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Start only after DB is ready
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🌍 Roamly running on port ${PORT}`);
      console.log(`📦 API ready at /api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start (database init failed):', err.message);
    process.exit(1);
  });
