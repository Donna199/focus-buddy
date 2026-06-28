// Mock data — stands in for Supabase until you connect a real project.
// Shape matches the Supabase tables defined in src/lib/supabase.js so swapping
// to real data later means changing the *source*, not the components.

export const CURRENT_USER = { id: 'u1', name: 'You', avatar: 'Y' }

export const MOCK_USERS = [
  { id: 'u1', name: 'You', avatar: 'Y' },
  { id: 'u2', name: 'Minh', avatar: 'M' },
  { id: 'u3', name: 'Donna', avatar: 'D' },
  { id: 'u4', name: 'An', avatar: 'A' },
  { id: 'u5', name: 'Alex', avatar: 'X' },
]

const now = Date.now()
const minsAgo = (m) => new Date(now - m * 60000).toISOString()

export const MOCK_LOGS = [
  { id: 'l1', userId: 'u1', category: 'good', activityName: 'Self-study', durationMinutes: 30, points: 60, caption: 'Locked in before dinner.', createdAt: minsAgo(12) },
  { id: 'l2', userId: 'u2', category: 'bonus', activityName: 'Phone outside bedroom', points: 15, createdAt: minsAgo(28) },
  { id: 'l3', userId: 'u1', category: 'bad', activityName: 'Doomscrolling', durationMinutes: 15, points: -30, trigger: 'Bored', createdAt: minsAgo(45) },
  { id: 'l4', userId: 'u3', category: 'good', activityName: 'Exercise', durationMinutes: 40, points: 60, caption: 'Leg day 💪', createdAt: minsAgo(70) },
  { id: 'l5', userId: 'u4', category: 'good', activityName: 'Deep work / lock-in', durationMinutes: 50, points: 100, createdAt: minsAgo(95) },
  { id: 'l6', userId: 'u5', category: 'bad', activityName: 'Short-form video scrolling', durationMinutes: 22, points: -44, trigger: 'Avoiding work', createdAt: minsAgo(120) },
  { id: 'l7', userId: 'u2', category: 'good', activityName: 'Reading book', durationMinutes: 35, points: 53, createdAt: minsAgo(160) },
  { id: 'l8', userId: 'u3', category: 'bonus', activityName: 'No screen 30 min before bed', points: 20, createdAt: minsAgo(200) },
]

// Aggregate helper — used by Home and Ranking screens.
// In the real backend this becomes a SQL query (see lib/supabase.js comments).
export function getTodayStats(userId, logs = MOCK_LOGS) {
  const todayLogs = logs.filter((l) => l.userId === userId)
  const totalPoints = todayLogs.reduce((sum, l) => sum + l.points, 0)
  const focusMinutes = todayLogs
    .filter((l) => l.category === 'good')
    .reduce((sum, l) => sum + (l.durationMinutes || 0), 0)
  const badMinutes = todayLogs
    .filter((l) => l.category === 'bad')
    .reduce((sum, l) => sum + (l.durationMinutes || 0), 0)
  const bonusPoints = todayLogs
    .filter((l) => l.category === 'bonus')
    .reduce((sum, l) => sum + l.points, 0)
  return { totalPoints, focusMinutes, badMinutes, bonusPoints }
}

export function getRanking(logs = MOCK_LOGS, users = MOCK_USERS) {
  const ranked = users
    .map((u) => ({ ...u, ...getTodayStats(u.id, logs) }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
  return ranked
}
