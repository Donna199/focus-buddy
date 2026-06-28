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

async function getFriendIds(userId) {
  const { data } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
  return (data ?? []).map(f => f.user_id === userId ? f.friend_id : f.user_id)
}

// ── Photos ────────────────────────────────────────────────────────────────────

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

// ── Logs ─────────────────────────────────────────────────────────────────────

export async function insertLog({
  userId, category, activityName,
  durationMinutes, points, caption, trigger, photoUrl,
}) {
  const { data, error } = await supabase
    .from('logs')
    .insert({
      user_id:          userId,
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

// Feed: logs from user + all friends, newest first
export async function getFeedLogs(userId) {
  const friendIds = await getFriendIds(userId)
  const allIds = [userId, ...friendIds]

  const { data, error } = await supabase
    .from('logs')
    .select('*, users(name, avatar_letter)')
    .in('user_id', allIds)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(normalizeLog)
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getUserTodayStats(userId) {
  const { data, error } = await supabase
    .from('logs')
    .select('points, category, duration_minutes')
    .eq('user_id', userId)
    .gte('created_at', todayStart())

  if (error) throw error
  return computeStats(data ?? [])
}

export async function getTodayBonusPoints(userId) {
  const { data, error } = await supabase
    .from('logs')
    .select('points')
    .eq('user_id', userId)
    .eq('category', 'bonus')
    .gte('created_at', todayStart())

  if (error) throw error
  return (data ?? []).reduce((s, l) => s + l.points, 0)
}

// ── Ranking ───────────────────────────────────────────────────────────────────

export async function getFriendRanking(userId) {
  const friendIds = await getFriendIds(userId)
  const allIds = [userId, ...friendIds]

  const [{ data: members, error: mErr }, { data: logs, error: lErr }] = await Promise.all([
    supabase.from('users').select('id, name, avatar_letter').in('id', allIds),
    supabase.from('logs')
      .select('user_id, points, category, duration_minutes')
      .in('user_id', allIds)
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

// ── Friends ───────────────────────────────────────────────────────────────────

export async function addFriend(userId, friendCode) {
  const { data: friend, error: findErr } = await supabase
    .from('users')
    .select('id, name')
    .eq('friend_code', friendCode.trim().toUpperCase())
    .maybeSingle()

  if (findErr) throw findErr
  if (!friend) throw new Error('No user found with that code.')
  if (friend.id === userId) throw new Error("That's your own code!")

  const { error: insertErr } = await supabase
    .from('friendships')
    .insert({ user_id: userId, friend_id: friend.id })

  if (insertErr) {
    if (insertErr.code === '23505') throw new Error('Already friends with this person!')
    throw insertErr
  }

  return friend
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
