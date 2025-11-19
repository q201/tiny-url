-- SQL init script for TinyLink

CREATE TABLE IF NOT EXISTS links (
  id SERIAL PRIMARY KEY,
  code VARCHAR(8) NOT NULL UNIQUE,
  long_url TEXT NOT NULL,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  last_clicked_time TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
