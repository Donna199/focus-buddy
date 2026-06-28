// ── SUPABASE SETUP — currently INACTIVE ──────────────────────────────────
// The app runs entirely on mock data (src/data/mockData.js) until you do this:
//
// 1. Create a free project at https://supabase.com
// 2. In Project Settings > API, copy your "Project URL" and "anon public" key
// 3. Create a file named `.env.local` in the project root with:
//      VITE_SUPABASE_URL=https://your-project.supabase.co
//      VITE_SUPABASE_ANON_KEY=your-anon-key-here
// 4. Run the SQL in `supabase_schema.sql` (project root) in the Supabase
//    SQL Editor to create the tables.
// 5. In each page file, swap the `mockData` import for `lib/db.js` functions
//    (each mock function has a matching real one with the same shape).
//
// Nothing breaks if you skip this — the app just stays in demo mode.
// ───────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info(
    '[Focus Buddy] Running in demo mode with mock data. ' +
    'Add .env.local with Supabase credentials to go live — see src/lib/supabase.js'
  )
}
