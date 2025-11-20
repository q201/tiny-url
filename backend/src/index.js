require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || 'http://localhost:' + PORT;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Create a .env or example.env in backend/');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Health check with system details
app.get('/health', async (req, res, next) => {
  try {
    const totalLinks = await pool.query('SELECT COUNT(*) as count FROM links');
    const uptime = process.uptime();

    res.json({
      status: 'healthy',
      version: '1.0',
      uptime_seconds: uptime,
      uptime_formatted: formatUptime(uptime),
      total_links: parseInt(totalLinks.rows[0].count),
      server_platform: process.platform,
      server_pid: process.pid,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: 'Database error' });
  }
});

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Helpers
const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function randInt(n) { return Math.floor(Math.random() * n); }
function genCode() {
  const length = 6 + Math.floor(Math.random() * 3); // 6-8
  let s = '';
  for (let i = 0; i < length; i++) s += CHARS[randInt(CHARS.length)];
  return s;
}

async function codeExists(short_code) {
  const r = await pool.query('SELECT 1 FROM links WHERE short_code = $1 LIMIT 1', [short_code]);
  return r.rowCount > 0;
}

// Create link
app.post('/api/links', async (req, res, next) => {
  try {
    const { longUrl, customCode } = req.body || {};
    if (!longUrl) return res.status(400).json({ error: 'longUrl is required' });

    // Validate URL
    let normalizedUrl;
    try {
      const u = new URL(longUrl);
      normalizedUrl = u.toString();
    } catch (err) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }

    let short_code = customCode;
    if (short_code) {
      if (!CODE_REGEX.test(short_code)) return res.status(400).json({ error: 'customCode must match [A-Za-z0-9]{6,8}' });
      if (await codeExists(short_code)) return res.status(409).json({ error: 'Code already exists' });
    } else {
      // generate until unique (with safety limit)
      let attempts = 0;
      do {
        short_code = genCode();
        attempts++;
        if (attempts > 10) break;
      } while (await codeExists(short_code));

      if (await codeExists(short_code)) {
        return res.status(500).json({ error: 'Failed to generate unique short_code, try again' });
      }
    }

    const insert = await pool.query(
      'INSERT INTO links (short_code, target_url, total_clicks, last_clicked_time ) VALUES ($1, $2, 0, NULL) RETURNING  short_code, target_url, total_clicks, last_clicked_time',
      [short_code, normalizedUrl]
    );

    const row = insert.rows[0];
    // Add shortUrl property using BASE_URL
    row.shortUrl = `${BASE_URL}/${row.short_code}`;
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// List all links
app.get('/api/links', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT  short_code, target_url, total_clicks, last_clicked_time FROM links');
    const rows = r.rows.map(r => ({
      short_code: r.short_code,
      target_url: r.target_url,
      total_clicks: r.total_clicks,
      last_clicked_time: r.last_clicked_time,
    }));
    res.json(rows);
  } catch (err) { next(err); }
});

// Get single link stats
app.get('/api/links/:short_code', async (req, res, next) => {
  try {
    const { short_code } = req.params;
    const r = await pool.query('SELECT short_code, target_url, total_clicks, last_clicked_time  FROM links WHERE short_code = $1 LIMIT 1', [short_code]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    const row = r.rows[0];
    res.json({
      short_code: row.short_code,
      target_url: row.target_url,
      total_clicks: row.total_clicks,
      last_clicked_time: row.last_clicked_time,
    });
  } catch (err) { next(err); }
});

// Delete link
app.delete('/api/links/:short_code', async (req, res, next) => {
  try {
    const { short_code } = req.params;
    const r = await pool.query('DELETE FROM links WHERE short_code = $1 RETURNING short_code', [short_code]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});

// Redirect
app.get('/:short_code', async (req, res, next) => {
  try {
    const { short_code } = req.params;
    const r = await pool.query('SELECT target_url FROM links WHERE short_code = $1 LIMIT 1', [short_code]);
    if (r.rowCount === 0) return res.status(404).send('Not found');
    const longUrl = r.rows[0].target_url;
    await pool.query('UPDATE links SET total_clicks = total_clicks + 1, last_clicked_time = now() WHERE short_code = $1', [short_code]);
    res.redirect(302, longUrl);
  } catch (err) { next(err); }
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`TinyLink backend listening on port ${PORT}`);
});
