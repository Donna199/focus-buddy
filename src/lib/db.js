import { supabase } from './supabase'

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function computeStats(rows) {
  return {
    totalPoints:  rows.reduce((s, l) => s + l.points, 0),
    focusMinutes: rows.filter(l => l.category === 'good').reduce((s, l) => s + (l.duration_minutes || 0), 0),
    badMinutes:   rows.filter(l => l.category === 'bad').reduce((s, l) => s + (l.duration_minutes || 0), 0),
    bonusPoints:  rows.filter(l => l.category === 'bonus').reduce((s, l) => s + l.points, 0),
  }
}

// Convert snake_case DB row → camelCase shape that components expect
function normalizeLog(row) {
  return {
    id:              row.id,
    userId:          row.user_id,
    category:        row.category,
    activityName:    row.activity_name,
    durationMinutes: row.duration_minutes,
    points:          row.points,
    caption:         row.caption,
    trigger:         row.trigger,
    photo:           row.photo_url ?? null,
    createdAt:       row.created_at,
    userName:        row.users?.name         ?? null,
    userAvatar:      row.users?.avatar_letter ?? null,
  }
}

// ── Logs ─────────────────────────────────────────────────────────────────────

export async function uploadActivityPhoto(file, userId) {
  const ext  = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('activity-photos')
    .upload(path, file, { contentType: file.type })

  if (uploadErr) throw uploadErr

  const { data } = supabase.storage
    .from('activity-photos')
    .getPublicUrl(path)

  return data.publicUrl
}

export async function insertLog({
  userId, groupId, category, activityName,
  durationMinutes, points, caption, trigger, photoUrl,
}) {
  const { data, error } = await supabase
    .from('logs')
    .insert({
      user_id:          userId,
      group_id:         groupId,
      category,
      activity_name:    activityName,
      duration_minutes: durationMinutes ?? null,
      points,
      caption:          caption   ?? null,
      trigger:          trigger   ?? null,
      photo_url:        photoUrl  ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// All logs for a group, newest first, with embedded user name/avatar
export async function getGroupLogs(groupId) {
  const { data, error } = await supabase
    .from('logs')
    .select('*, users(name, avatar_letter)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(normalizeLog)
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getUserTodayStats(userId, groupId) {
  const { data, error } = await supabase
    .from('logs')
    .select('points, category, duration_minutes')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .gte('created_at', todayStart())

  if (error) throw error
  return computeStats(data ?? [])
}

export async function getTodayBonusPoints(userId, groupId) {
  const { data, error } = await supabase
    .from('logs')
    .select('points')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .eq('category', 'bonus')
    .gte('created_at', todayStart())

  if (error) throw error
  return (data ?? []).reduce((s, l) => s + l.points, 0)
}

// ── Ranking ───────────────────────────────────────────────────────────────────

export async function getGroupRanking(groupId) {
  const [{ data: members, error: mErr }, { data: logs, error: lErr }] = await Promise.all([
    supabase
      .from('users')
      .select('id, name, avatar_letter')
      .eq('group_id', groupId),
    supabase
      .from('logs')
      .select('user_id, points, category, duration_minutes')
      .eq('group_id', groupId)
      .gte('created_at', todayStart()),
  ])

  if (mErr) throw mErr
  if (lErr) throw lErr

  const byUser = {}
  for (const l of (logs ?? [])) {
    ;(byUser[l.user_id] ??= []).push(l)
  }

  return (members ?? []).map(u => ({
    id:     u.id,
    name:   u.name,
    avatar: u.avatar_letter,
    ...computeStats(byUser[u.id] ?? []),
  }))
}

// ── User / profile ────────────────────────────────────────────────────────────

export async function getTotalLogCount(userId) {
  const { count, error } = await supabase
    .from('logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw error
  return count ?? 0
}
