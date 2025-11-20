-- SQL init script for TinyLink

CREATE TABLE links (
  short_code VARCHAR(8) NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  last_clicked_time TIMESTAMP NULL,
);
