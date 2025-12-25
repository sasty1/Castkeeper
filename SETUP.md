# CastKeeper Setup Guide

## Issue Fixed: Scheduled Posts Not Publishing

### What Was Wrong
The app had two scheduling systems that weren't synchronized:
1. **QStash** - Scheduled the API call but didn't save to database
2. **Database** - Expected posts to be stored but they never were
3. **Frontend** - Only saved to localStorage, not the database

### What Was Fixed
✅ Updated `schedule-qstash` route to save posts to PostgreSQL database
✅ Frontend now passes `userFid` when scheduling
✅ Frontend fetches scheduled posts from database instead of localStorage
✅ Delete operations now work with the database
✅ Created database schema for `scheduled_posts` table

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `env.example` to `.env.local`:
```bash
cp env.example .env.local
```

Fill in the required values:
- **NEYNAR_API_KEY**: Get from https://neynar.com/
- **QSTASH_TOKEN**: Get from https://upstash.com/
- **POSTGRES_PRISMA_URL**: Provided by Vercel Postgres
- **DATABASE_URL**: Provided by Vercel Postgres

### 3. Set Up Database
Run the SQL schema to create the `scheduled_posts` table:

```bash
# If using Vercel Postgres, run this in the Vercel dashboard SQL editor
# Or connect to your database and run:
psql $DATABASE_URL -f schema.sql
```

The schema creates:
- `scheduled_posts` table with all required columns
- Indexes for efficient querying
- Support for embeds (images), channels, and status tracking

### 4. Run Development Server
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
vercel deploy
```

Make sure to:
1. Add all environment variables in Vercel dashboard
2. Connect Vercel Postgres to your project
3. Run the schema.sql in Vercel Postgres SQL editor

---

## How Scheduling Works Now

1. **User schedules a post** → Frontend calls `/api/schedule-qstash`
2. **API saves to database** → Post stored with status='pending'
3. **QStash schedules delivery** → Will call `/api/cast` at scheduled time
4. **Post publishes** → QStash triggers the cast
5. **Database updates** → Status changes to 'published'

### Backup System (Optional)
The `/api/cron/publish` endpoint can be used as a backup cron job to publish any pending posts that QStash might have missed.

Set up a Vercel Cron Job:
```json
{
  "crons": [{
    "path": "/api/cron/publish",
    "schedule": "*/5 * * * *"
  }]
}
```

---

## Troubleshooting

### Posts not publishing?
1. Check QStash dashboard for failed deliveries
2. Verify `QSTASH_TOKEN` is correct
3. Check database - posts should have status='pending'
4. Ensure your deployment URL matches in `schedule-qstash/route.ts` (line 68)

### Database errors?
1. Verify `POSTGRES_PRISMA_URL` is set
2. Run `schema.sql` to create the table
3. Check Vercel Postgres logs

### Can't see scheduled posts?
1. Check browser console for errors
2. Verify `/api/scheduled?fid=YOUR_FID` returns data
3. Clear localStorage and refresh
