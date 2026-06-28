// Activity library — point weights pulled directly from the PRD (section 9).
// This stays a config file for now (not a DB table) to keep v0 simple.
// Good and bad activities scale with duration; bonus activities are fixed.

export const GOOD_ACTIVITIES = [
  { id: 'deep_work', name: 'Deep work / lock-in', pointsPerMin: 2 },
  { id: 'self_study', name: 'Self-study', pointsPerMin: 2 },
  { id: 'reading', name: 'Reading book', pointsPerMin: 1.5 },
  { id: 'exercise', name: 'Exercise', pointsPerMin: 1.5 },
  { id: 'meditation', name: 'Meditation', pointsPerMin: 1.5 },
  { id: 'journaling', name: 'Journaling', pointsPerMin: 1 },
  { id: 'planning', name: 'Planning tomorrow', pointsPerMin: 1 },
  { id: 'creative_work', name: 'Coding / design / creative work', pointsPerMin: 2 },
  { id: 'skill_practice', name: 'Skill practice', pointsPerMin: 1.5 },
  { id: 'cleaning', name: 'Cleaning workspace', pointsPerMin: 1 },
  { id: 'conversation', name: 'Meaningful offline conversation', pointsPerMin: 1 },
]

export const BAD_ACTIVITIES = [
  { id: 'doomscrolling', name: 'Doomscrolling', pointsPerMin: -2 },
  { id: 'shortform', name: 'Short-form video scrolling', pointsPerMin: -2 },
  { id: 'casual_games', name: 'Casual low-stress games', pointsPerMin: -1.5 },
  { id: 'autoplay', name: 'Autoplay video binge', pointsPerMin: -1.5 },
  { id: 'youtube_hole', name: 'Random YouTube rabbit hole', pointsPerMin: -1.5 },
  { id: 'notif_checking', name: 'Repeated notification checking', pointsPerMin: -1 },
  { id: 'phone_in_bed', name: 'Phone in bed', pointsPerMin: -2 },
  { id: 'multitasking', name: 'Multitasking during focus session', pointsPerMin: -1.5 },
  { id: 'online_shopping', name: 'Online shopping/browsing without goal', pointsPerMin: -1 },
  { id: 'drama_scrolling', name: 'Comment-section / drama scrolling', pointsPerMin: -1.5 },
]

export const BONUS_ACTIVITIES = [
  { id: 'no_phone_break', name: 'No phone during break', points: 10 },
  { id: 'walk_no_music', name: 'Walk with no music', points: 10 },
  { id: 'shower_no_phone', name: 'Shower with no phone', points: 8 },
  { id: 'meal_no_screen', name: 'Meal with no screen', points: 10 },
  { id: 'no_screen_bed', name: 'No screen 30 min before bed', points: 20 },
  { id: 'phone_outside_bedroom', name: 'Phone outside bedroom', points: 15 },
  { id: 'breathing', name: '2-minute breathing exercise', points: 5 },
  { id: 'stare_wall', name: 'Stare at wall for 3 minutes', points: 5 },
  { id: 'sit_outside', name: 'Sit outside quietly for 5 minutes', points: 8 },
  { id: 'clean_desk', name: 'Clean desk before work', points: 8 },
  { id: 'grayscale', name: 'Turn phone grayscale', points: 10 },
  { id: 'phone_other_room', name: 'Put phone in another room during focus', points: 15 },
]

export const DAILY_BONUS_CAP = 60

export const TRIGGER_OPTIONS = ['Bored', 'Stressed', 'Avoiding work', 'Tired', 'Lonely', 'Habit', 'Other']

export function calculateGoodOrBadPoints(activity, durationMinutes) {
  return Math.round(activity.pointsPerMin * durationMinutes)
}
