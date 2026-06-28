// In-session log store for demo mode.
// Holds logs created during this browser session so they actually show up in
// the feed/home/ranking. Resets on page refresh (that's expected in demo mode).
// When Supabase is connected, these reads/writes become DB queries instead.

import { MOCK_LOGS } from './mockData'

let sessionLogs = [...MOCK_LOGS]
const listeners = new Set()

export function getAllLogs() {
  return sessionLogs
}

export function addLog(log) {
  const newLog = {
    id: `l${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...log,
  }
  sessionLogs = [newLog, ...sessionLogs]
  listeners.forEach((fn) => fn())
  return newLog
}

// Lets components re-render when a new log is added.
export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
