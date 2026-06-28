import { supabase } from './supabase'

const USER_KEY = 'ff_user_id'
const GROUP_KEY = 'ff_group_id'

async function ensureUser() {
  const cached = localStorage.getItem(USER_KEY)
  if (cached) return cached

  const { data, error } = await supabase
    .from('users')
    .insert({ name: 'You', avatar_letter: 'Y' })
    .select('id')
    .single()
  if (error) throw error

  localStorage.setItem(USER_KEY, data.id)
  return data.id
}

async function ensureGroup() {
  const cached = localStorage.getItem(GROUP_KEY)
  if (cached) return cached

  const { data: existing } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', 'SQUAD-2026')
    .maybeSingle()

  if (existing) {
    localStorage.setItem(GROUP_KEY, existing.id)
    return existing.id
  }

  const { data, error } = await supabase
    .from('groups')
    .insert({ name: 'The Squad', invite_code: 'SQUAD-2026' })
    .select('id')
    .single()
  if (error) throw error

  localStorage.setItem(GROUP_KEY, data.id)
  return data.id
}

export async function insertLog({ category, activityName, durationMinutes, points, caption, trigger }) {
  const [userId, groupId] = await Promise.all([ensureUser(), ensureGroup()])

  const { data, error } = await supabase
    .from('logs')
    .insert({
      user_id: userId,
      group_id: groupId,
      category,
      activity_name: activityName,
      duration_minutes: durationMinutes ?? null,
      points,
      caption: caption ?? null,
      trigger: trigger ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTodayBonusPoints() {
  const userId = localStorage.getItem(USER_KEY)
  if (!userId) return 0

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('logs')
    .select('points')
    .eq('user_id', userId)
    .eq('category', 'bonus')
    .gte('created_at', todayStart.toISOString())

  if (error) throw error
  return (data ?? []).reduce((sum, l) => sum + l.points, 0)
}
