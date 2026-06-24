// Run this ONCE to add the photos column to your existing database:
//   DATABASE_URL=your_url node migrate.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    // Add photos column — stores array of Cloudinary URLs as JSON
    await pool.query(`
      ALTER TABLE destinations
      ADD COLUMN IF NOT EXISTS photos TEXT NOT NULL DEFAULT '[]';
    `);
    console.log('✅ photos column added to destinations table');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
