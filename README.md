# Focus Friends

A social productivity game where friends compete to swap doomscrolling for focus.
This is the **v0 web app** — runs on mock data out of the box, ready to connect to a real backend.

---

## Part 1 — Run it on your laptop (5 minutes)

You already have Node.js installed (via Homebrew). Now:

1. Put this folder somewhere on your Mac (e.g. `~/Documents/focus-friends`).
2. Open it in VS Code: **File → Open Folder** → pick this folder.
3. Open the terminal in VS Code: **Terminal → New Terminal**.
4. Run these two commands, one at a time:

   ```bash
   npm install
   ```
   (downloads the libraries — takes 1–2 minutes, needs internet)

   ```bash
   npm run dev
   ```

5. It prints a link like `http://localhost:5173`. Open it in your browser.
   **You're running the app.** Click around — Home, Log, Feed, Ranking, Profile all work with sample data.

To see the onboarding flow, go to `http://localhost:5173/welcome`.

### See it on your phone (same wifi)
When you run `npm run dev`, it also prints a "Network" URL like `http://192.168.x.x:5173`.
Open **that** link on your phone's browser (phone must be on the same wifi as your laptop).

---

## Part 2 — Make it real (connect Supabase, ~15 min)

Right now everything is mock data. To let friends actually use it with saved data:

1. Create a free account at **supabase.com** and make a new project.
2. In the project, go to **SQL Editor**, paste in the contents of `supabase_schema.sql`
   (in this folder), and run it. This creates your tables.
3. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
4. In this project folder, create a file called `.env.local` with:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. Restart the dev server (`Ctrl+C`, then `npm run dev` again).

The Supabase client is already wired up in `src/lib/supabase.js`. The next step is
swapping the mock-data calls in each page for real Supabase queries — every mock
function in `src/data/mockData.js` has a comment showing the matching query. Ask
your AI assistant to "replace the mock data calls with Supabase queries" one page
at a time, starting with the Log screen.

---

## Part 3 — Put it online so friends can use it (~10 min, free)

1. Push this folder to a free **GitHub** repo.
2. Create a free account at **vercel.com**, click **Add New → Project**, and import
   your GitHub repo.
3. In Vercel's project settings, add the same two environment variables from `.env.local`.
4. Click **Deploy**. Vercel gives you a public link (e.g. `focus-friends.vercel.app`)
   that your friends open on their phones — no app install needed.

---

## Project structure

```
src/
  pages/        — the 5 main screens + onboarding
  components/   — reusable pieces (nav, log card, reset prompt)
  data/
    activities.js   — activity list + point weights (edit these freely)
    mockData.js     — sample data (replace with Supabase later)
  lib/
    supabase.js     — backend client (inactive until you add .env.local)
supabase_schema.sql — run this in Supabase to create your tables
```

## What's included in v0
- Onboarding (name + join group + rules)
- Home dashboard (today's points, rank, recent logs)
- Log activity (good / bad / bonus, live point preview, bonus cap)
- Reset exercises after bad activities (CBT-informed)
- Feed with filters
- Ranking (points / focus time / least bad time)
- Profile

## Saved for later (v1+)
Photo upload, custom activities, reporting/moderation, monthly recap, reactions,
real authentication, push notifications.

## To change activities or points
Edit `src/data/activities.js` — it's a plain list. Change names, add activities,
or tweak the point weights. No other code needs to change.
