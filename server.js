const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initDb } = require('./database');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/photos', express.static(path.join(__dirname, 'photos')));
app.use(express.static(__dirname));

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/wishlist',     require('./routes/wishlist'));
app.use('/api/upload',       require('./routes/upload'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🌍 Roamly running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  });
