const { Pool } = require('pg');

// Render injects DATABASE_URL automatically when you link a Postgres
// instance to this web service. Locally, set DATABASE_URL in a .env file
// or export it in your shell if you want to test against Postgres directly.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set. Add it in Render → Environment, or in a local .env file.');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString && connectionString.includes('render.com')
    ? { rejectUnauthorized: false }
    : false,
});

const SQL_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    region          TEXT NOT NULL,
    budget_travel   INTEGER NOT NULL DEFAULT 0,
    budget_stay     INTEGER NOT NULL DEFAULT 0,
    budget_food     INTEGER NOT NULL DEFAULT 0,
    durations       TEXT NOT NULL DEFAULT '[]',
    tags            TEXT NOT NULL DEFAULT '[]',
    highlights      TEXT NOT NULL DEFAULT '[]',
    transport       TEXT NOT NULL DEFAULT '[]',
    itinerary       TEXT NOT NULL DEFAULT '[]',
    best_time       TEXT NOT NULL DEFAULT '',
    pack            TEXT NOT NULL DEFAULT '[]',
    dist_chandigarh INTEGER NOT NULL DEFAULT 0,
    hr_chandigarh   REAL NOT NULL DEFAULT 0,
    dist_amritsar   INTEGER NOT NULL DEFAULT 0,
    hr_amritsar     REAL NOT NULL DEFAULT 0,
    dist_delhi      INTEGER NOT NULL DEFAULT 0,
    hr_delhi        REAL NOT NULL DEFAULT 0,
    published       INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS wishlist (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, destination_id)
  );
`;

const SEED_DATA = [
  { name:"Morni Hills", region:"Haryana", bt:300, bs:600, bf:300, durations:'["day","weekend"]', tags:'["hiking","nature","wildlife","camping"]', highlights:'["Tikkar Taal lake and boating","Birdwatching away from tourist crowds","Morni Fort and easy nature trails"]', transport:'[{"icon":"🚗","mode":"Own Vehicle","detail":"45 km from Chandigarh, ~1.5 hrs","cost":"Fuel ~₹200"},{"icon":"🚌","mode":"Local Bus","detail":"HRTC bus from Chandigarh to Morni","cost":"~₹80"}]', itinerary:'[{"day":"Day 1","plan":"Drive to Morni Hills. Explore Tikkar Taal, boat ride."},{"day":"Day 2","plan":"Trek to Morni Fort. Birdwatching. Head back."}]', bestTime:"October to March", pack:'["Water bottle","Binoculars","Walking shoes","Light jacket"]', dc:45,hc:1.5,da:275,ha:5.5,dd:290,hd:5.5 },
  { name:"Kasauli", region:"Himachal Pradesh", bt:400, bs:800, bf:400, durations:'["day","weekend"]', tags:'["relaxation","nature","hiking","cafes"]', highlights:'["Colonial-era churches and Gilbert Trail","Sunset Point valley views","Kasauli Brewery tour"]', transport:'[{"icon":"🚗","mode":"Own Vehicle","detail":"60 km from Chandigarh, ~1.5 hrs","cost":"Fuel ~₹250"},{"icon":"🚌","mode":"Bus","detail":"Chandigarh to Kasauli via Kalka","cost":"~₹100"}]', itinerary:'[{"day":"Day 1","plan":"Drive to Kasauli. Mall Road and Sunset Point."},{"day":"Day 2","plan":"Gilbert Trail walk. Kasauli Brewery. Head back."}]', bestTime:"October to June", pack:'["Light jacket","Walking shoes","Camera"]', dc:60,hc:1.5,da:290,ha:6,dd:300,hd:5.5 },
  { name:"Shimla", region:"Himachal Pradesh", bt:500, bs:1500, bf:600, durations:'["weekend","multi"]', tags:'["nightlife","nature","food","city"]', highlights:'["Mall Road and Ridge for shopping and food","Toy train from Kalka — UNESCO experience","Jakhu Temple viewpoint for panoramic views"]', transport:'[{"icon":"🚂","mode":"Toy Train","detail":"Kalka to Shimla (UNESCO heritage)","cost":"~₹400"},{"icon":"🚌","mode":"HRTC Bus","detail":"Chandigarh to Shimla direct","cost":"~₹200"},{"icon":"🚗","mode":"Own Vehicle","detail":"110 km, ~3 hrs","cost":"Fuel ~₹450"}]', itinerary:'[{"day":"Day 1","plan":"Drive or toy train. Evening Mall Road."},{"day":"Day 2","plan":"Jakhu Temple hike. Kufri snow activities."},{"day":"Day 3","plan":"Market shopping. Head back."}]', bestTime:"March to June for summer; Dec–Jan for snow", pack:'["Warm layers","Walking shoes","Rain jacket"]', dc:110,hc:3,da:340,ha:7,dd:350,hd:7 },
  { name:"Amritsar", region:"Punjab", bt:500, bs:1000, bf:500, durations:'["day","weekend"]', tags:'["culture","food","history","city"]', highlights:'["Golden Temple — one of India\'s most peaceful places","Wagah Border ceremony at sunset","Iconic Punjabi street food: kulcha, lassi, jalebi"]', transport:'[{"icon":"🚂","mode":"Train","detail":"Chandigarh to Amritsar Shatabdi","cost":"~₹350–600"},{"icon":"🚌","mode":"Bus","detail":"PRTC AC bus, ~4.5 hrs","cost":"~₹250"},{"icon":"🚗","mode":"Own Vehicle","detail":"230 km, ~5 hrs","cost":"Fuel ~₹900"}]', itinerary:'[{"day":"Day 1","plan":"Train or bus to Amritsar. Evening Golden Temple."},{"day":"Day 2","plan":"Jallianwala Bagh. Wagah Border ceremony. Street food."}]', bestTime:"October to March", pack:'["Modest clothing","Comfortable shoes","Camera"]', dc:230,hc:5,da:0,ha:0,dd:450,hd:7.5 },
  { name:"Dharamshala & McLeodganj", region:"Himachal Pradesh", bt:600, bs:1000, bf:500, durations:'["weekend","multi"]', tags:'["hiking","culture","cafes","relaxation"]', highlights:'["Tibetan culture and Dalai Lama Temple","Base for the Triund Trek","Bhagsu Falls and McLeodGanj cafes"]', transport:'[{"icon":"🚌","mode":"Overnight Bus","detail":"Chandigarh to Dharamshala","cost":"~₹600–900"},{"icon":"🚗","mode":"Own Vehicle","detail":"250 km from Chandigarh, ~6 hrs","cost":"Fuel ~₹1000"}]', itinerary:'[{"day":"Day 1","plan":"Overnight bus. Explore Dalai Lama Temple."},{"day":"Day 2","plan":"Trek to Bhagsu Falls. Cafes on Bhagsu Road."},{"day":"Day 3","plan":"Triund Trek or drive back."}]', bestTime:"March to June, Sept to Nov", pack:'["Warm layers","Trekking shoes","Rain jacket","Power bank"]', dc:250,hc:6,da:200,ha:4.5,dd:490,hd:9 },
  { name:"Manali", region:"Himachal Pradesh", bt:800, bs:1200, bf:600, durations:'["multi"]', tags:'["adventure","hiking","nightlife","nature","camping"]', highlights:'["Solang Valley paragliding and snow activities","Old Manali backpacker cafe scene","Gateway to Rohtang Pass and Spiti Valley"]', transport:'[{"icon":"🚌","mode":"Overnight Bus","detail":"Chandigarh to Manali Volvo","cost":"~₹800–1200"},{"icon":"🚗","mode":"Own Vehicle","detail":"310 km from Chandigarh, ~8 hrs","cost":"Fuel ~₹1200"}]', itinerary:'[{"day":"Day 1","plan":"Overnight bus. Check into Old Manali."},{"day":"Day 2","plan":"Solang Valley — paragliding or snow."},{"day":"Day 3","plan":"Rohtang Pass or Jogini Falls."},{"day":"Day 4","plan":"Old Manali market. Overnight bus back."}]', bestTime:"March to June; Dec–Feb for snow", pack:'["Warm layers","Trekking shoes","Sunscreen","ID for Rohtang permit"]', dc:310,hc:8,da:450,ha:10,dd:540,hd:10 },
  { name:"Kasol", region:"Himachal Pradesh", bt:700, bs:800, bf:400, durations:'["weekend","multi"]', tags:'["hiking","adventure","camping","cafes"]', highlights:'["Backpacker hub of the Parvati Valley","Riverside cafes and Chalal village trail","Base for Kheerganga Trek"]', transport:'[{"icon":"🚌","mode":"Overnight Bus","detail":"Delhi/Chandigarh to Bhuntar then taxi","cost":"~₹700 + ₹200"},{"icon":"🚗","mode":"Own Vehicle","detail":"290 km from Chandigarh, ~7.5 hrs","cost":"Fuel ~₹1150"}]', itinerary:'[{"day":"Day 1","plan":"Overnight bus. Morning cafes in Kasol."},{"day":"Day 2","plan":"Trek to Chalal. Visit Manikaran Sahib."},{"day":"Day 3","plan":"Kheerganga Trek or head back."}]', bestTime:"March to June, Oct to Nov", pack:'["Trekking shoes","Warm layers","Power bank","Cash"]', dc:290,hc:7.5,da:380,ha:8.5,dd:520,hd:10 },
  { name:"Rishikesh", region:"Uttarakhand", bt:600, bs:900, bf:500, durations:'["weekend","multi"]', tags:'["adventure","relaxation","culture"]', highlights:'["White-water rafting on the Ganga","Bungee jumping, cliff jumping and flying fox","Yoga capital with a laid-back riverside vibe"]', transport:'[{"icon":"🚂","mode":"Train","detail":"Delhi to Haridwar then taxi","cost":"~₹500 + ₹200"},{"icon":"🚌","mode":"Bus","detail":"Delhi to Rishikesh direct AC bus","cost":"~₹400"},{"icon":"🚗","mode":"Own Vehicle","detail":"240 km from Delhi, ~5 hrs","cost":"Fuel ~₹950"}]', itinerary:'[{"day":"Day 1","plan":"Drive/train. Evening Ganga Aarti."},{"day":"Day 2","plan":"Morning rafting. Afternoon bungee jumping."},{"day":"Day 3","plan":"Yoga class or Neer Garh Waterfall. Head back."}]', bestTime:"October to June", pack:'["Quick-dry clothes","Sunscreen","Adventure shoes"]', dc:245,hc:5.5,da:420,ha:8.5,dd:240,hd:5 },
  { name:"Mussoorie", region:"Uttarakhand", bt:700, bs:1000, bf:600, durations:'["weekend"]', tags:'["nature","relaxation","city"]', highlights:'["Mall Road and Gun Hill cable car views","Kempty Falls — most popular waterfall in North India","Colonial charm and great food scene"]', transport:'[{"icon":"🚂","mode":"Train","detail":"Delhi to Dehradun then cab","cost":"~₹500 + ₹400"},{"icon":"🚌","mode":"Bus","detail":"Delhi to Mussoorie direct","cost":"~₹500"},{"icon":"🚗","mode":"Own Vehicle","detail":"280 km from Delhi, ~5.5 hrs","cost":"Fuel ~₹1100"}]', itinerary:'[{"day":"Day 1","plan":"Drive/bus to Mussoorie. Evening Mall Road."},{"day":"Day 2","plan":"Gun Hill cable car. Kempty Falls. Head back."}]', bestTime:"March to June, Sept to Nov", pack:'["Warm jacket","Walking shoes","Camera"]', dc:250,hc:6,da:440,ha:9,dd:280,hd:5.5 },
  { name:"Jim Corbett National Park", region:"Uttarakhand", bt:800, bs:1500, bf:600, durations:'["multi"]', tags:'["wildlife","nature","adventure"]', highlights:'["India\'s oldest national park — Royal Bengal Tigers","Jeep and elephant safaris through jungle","Riverside jungle lodges"]', transport:'[{"icon":"🚂","mode":"Train","detail":"Delhi to Ramnagar direct then taxi","cost":"~₹300 + ₹400"},{"icon":"🚗","mode":"Own Vehicle","detail":"240 km from Delhi, ~5 hrs","cost":"Fuel ~₹950"}]', itinerary:'[{"day":"Day 1","plan":"Drive/train to Corbett. Evening safari."},{"day":"Day 2","plan":"Early morning jeep safari 6–9 AM. Afternoon walk."},{"day":"Day 3","plan":"Optional second safari. Head back."}]', bestTime:"November to June", pack:'["Neutral clothing","Binoculars","Camera with zoom","Insect repellent"]', dc:350,hc:7.5,da:530,ha:10,dd:240,hd:5 },
];

// ── Query helpers — pg is async, all callers must use await ────────────────
async function run(sql, params = []) {
  return pool.query(sql, params);
}

async function get(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0]; // undefined if no row found — correct by default in pg
}

async function all(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function lastInsertId(insertResult) {
  // With pg, prefer using "RETURNING id" in your INSERT and reading it
  // directly from the result instead of calling this. Kept for compatibility.
  return insertResult?.rows?.[0]?.id;
}

// ── Initialize DB: create tables + seed if empty ────────────────────────────
async function initDb() {
  await pool.query(SQL_SCHEMA);

  // Run safe migrations — IF NOT EXISTS means these only run once
  await pool.query("ALTER TABLE destinations ADD COLUMN IF NOT EXISTS photos TEXT NOT NULL DEFAULT '[]'");
  await pool.query("ALTER TABLE destinations ADD COLUMN IF NOT EXISTS budget_travel_max INTEGER");
  await pool.query("ALTER TABLE destinations ADD COLUMN IF NOT EXISTS budget_stay_max INTEGER");
  await pool.query("ALTER TABLE destinations ADD COLUMN IF NOT EXISTS budget_food_max INTEGER");

  console.log('✅ Tables ready');

  const countResult = await pool.query('SELECT COUNT(*) as c FROM destinations');
  const count = Number(countResult.rows[0].c);

  if (count === 0) {
    for (const d of SEED_DATA) {
      await pool.query(`
        INSERT INTO destinations (
          name, region, budget_travel, budget_stay, budget_food,
          durations, tags, highlights, transport, itinerary, best_time, pack,
          dist_chandigarh, hr_chandigarh, dist_amritsar, hr_amritsar, dist_delhi, hr_delhi
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      `, [d.name,d.region,d.bt,d.bs,d.bf,d.durations,d.tags,d.highlights,d.transport,d.itinerary,d.bestTime,d.pack,d.dc,d.hc,d.da,d.ha,d.dd,d.hd]);
    }
    console.log('✅ Database seeded with', SEED_DATA.length, 'destinations');
  } else {
    console.log(`✅ Database already has ${count} destinations, skipping seed`);
  }

  console.log('✅ Database ready');
}

module.exports = { initDb, run, get, all, lastInsertId, pool };
