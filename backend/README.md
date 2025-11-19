TinyLink Backend

Setup:
1. Copy `example.env` to `.env` and edit DATABASE_URL and BASE_URL.
2. Run the SQL in `sql/init.sql` against your PostgreSQL instance.
3. Install dependencies and start:

   npm install
   npm run dev

API Endpoints implemented:
- GET /healthz
- POST /api/links
- GET /api/links
- GET /api/links/:code
- DELETE /api/links/:code
- GET /:code (redirect)

All DB interactions use raw SQL via `pg`.
