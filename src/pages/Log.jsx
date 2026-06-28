import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GOOD_ACTIVITIES,
  BAD_ACTIVITIES,
  BONUS_ACTIVITIES,
  TRIGGER_OPTIONS,
  DAILY_BONUS_CAP,
  calculateGoodOrBadPoints,
} from '../data/activities'
import { CURRENT_USER, getTodayStats } from '../data/mockData'
import { addLog, getAllLogs } from '../data/logStore'
import { isSupabaseConfigured } from '../lib/supabase'
import { insertLog, getTodayBonusPoints } from '../lib/db'
import ResetPrompt from '../components/ResetPrompt'

const CATEGORIES = [
  { id: 'good', label: 'Good', hint: 'Earn points' },
  { id: 'bad', label: 'Bad', hint: 'Lose points' },
  { id: 'bonus', label: 'Bonus', hint: 'Small wins' },
]

export default function Log() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('good')
  const [activityId, setActivityId] = useState('')
  const [duration, setDuration] = useState('')
  const [caption, setCaption] = useState('')
  const [trigger, setTrigger] = useState('')
  const [photo, setPhoto] = useState(null)
  const [showReset, setShowReset] = useState(false)
  const [submittedPoints, setSubmittedPoints] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [bonusPointsToday, setBonusPointsToday] = useState(null)

  useEffect(() => {
    if (isSupabaseConfigured) {
      getTodayBonusPoints()
        .then(setBonusPointsToday)
        .catch(() => setBonusPointsToday(getTodayStats(CURRENT_USER.id, getAllLogs()).bonusPoints))
    } else {
      setBonusPointsToday(getTodayStats(CURRENT_USER.id, getAllLogs()).bonusPoints)
    }
  }, [])

  const activityList =
    category === 'good' ? GOOD_ACTIVITIES : category === 'bad' ? BAD_ACTIVITIES : BONUS_ACTIVITIES

  const selectedActivity = activityList.find((a) => a.id === activityId)

  // Live point preview
  let previewPoints = 0
  if (selectedActivity) {
    if (category === 'bonus') {
      previewPoints = selectedActivity.points
    } else if (duration) {
      previewPoints = calculateGoodOrBadPoints(selectedActivity, Number(duration))
    }
  }

  const bonusRemaining = DAILY_BONUS_CAP - (bonusPointsToday ?? 0)
  const bonusCapped = category === 'bonus' && selectedActivity && previewPoints > bonusRemaining

  const canSubmit =
    !submitting &&
    selectedActivity &&
    (category === 'bonus' || (duration && Number(duration) > 0))

  function handleCategoryChange(newCat) {
    setCategory(newCat)
    setActivityId('')
    setDuration('')
    setTrigger('')
    setPhoto(null)
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    // In demo mode we read the file into a local data URL so it shows in the
    // feed this session. With Supabase connected, you'd upload to Storage here
    // and save the returned public URL instead.
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!canSubmit) return

    const finalPoints = bonusCapped ? Math.max(0, bonusRemaining) : previewPoints
    setSubmittedPoints(finalPoints)
    setSubmitting(true)

    const logPayload = {
      userId: CURRENT_USER.id,
      category,
      activityName: selectedActivity.name,
      durationMinutes: category === 'bonus' ? null : Number(duration),
      points: finalPoints,
      caption: caption || undefined,
      trigger: trigger || undefined,
      photo: photo || undefined,
    }

    try {
      if (isSupabaseConfigured) {
        await insertLog(logPayload)
      }
    } catch (err) {
      console.error('Failed to save log:', err)
    }

    // Keep in-memory store updated so Feed/Home/Ranking see the new log this session
    addLog(logPayload)
    setSubmitting(false)

    if (category === 'bad') {
      setShowReset(true)
    } else {
      navigate('/feed', { state: { justLogged: true, points: finalPoints } })
    }
  }

  if (showReset) {
    return (
      <ResetPrompt
        points={submittedPoints}
        trigger={trigger}
        onDone={() => navigate('/feed', { state: { justLogged: true, points: submittedPoints } })}
      />
    )
  }

  return (
    <div className="screen log-screen">
      <h1>Log activity</h1>
      <p className="log-subtitle">Takes less than 30 seconds.</p>

      <div className="category-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab cat-${cat.id} ${category === cat.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.id)}
          >
            <span className="cat-label">{cat.label}</span>
            <span className="cat-hint">{cat.hint}</span>
          </button>
        ))}
      </div>

      <div className="field">
        <label className="field-label">Activity</label>
        <select value={activityId} onChange={(e) => setActivityId(e.target.value)}>
          <option value="">Choose an activity…</option>
          {activityList.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {category !== 'bonus' && (
        <div className="field">
          <label className="field-label">Duration (minutes)</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 30"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            max="600"
          />
        </div>
      )}

      {category === 'bad' && (
        <div className="field">
          <label className="field-label">What triggered it? <span className="optional">optional</span></label>
          <div className="trigger-chips">
            {TRIGGER_OPTIONS.map((t) => (
              <button
                key={t}
                className={`chip ${trigger === t ? 'active' : ''}`}
                onClick={() => setTrigger(trigger === t ? '' : t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {category !== 'bad' && (
        <div className="field">
          <label className="field-label">Caption <span className="optional">optional</span></label>
          <input
            type="text"
            placeholder="Add a note…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength="120"
          />
        </div>
      )}

      {category !== 'bad' && (
        <div className="field">
          <label className="field-label">Photo <span className="optional">optional</span></label>
          {photo ? (
            <div className="photo-preview">
              <img src={photo} alt="Activity proof" />
              <button className="photo-remove" onClick={() => setPhoto(null)} aria-label="Remove photo">×</button>
            </div>
          ) : (
            <label className="photo-picker">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              <span className="photo-picker-icon">📷</span>
              <span>Add a photo</span>
            </label>
          )}
        </div>
      )}

      {selectedActivity && (
        <div className={`point-preview ${previewPoints >= 0 ? 'positive' : 'negative'}`}>
          <span>You'll {previewPoints >= 0 ? 'earn' : 'lose'}</span>
          <span className="preview-value">
            {previewPoints > 0 ? '+' : ''}{bonusCapped ? Math.max(0, bonusRemaining) : previewPoints} pts
          </span>
        </div>
      )}

      {bonusCapped && (
        <p className="cap-warning">
          You've nearly hit today's {DAILY_BONUS_CAP}-point bonus cap. This still counts, but only {Math.max(0, bonusRemaining)} pts will be added.
        </p>
      )}

      <button className={`btn ${category === 'bad' ? 'btn-bad' : 'btn-primary'} submit-btn`} disabled={!canSubmit} onClick={handleSubmit}>
        {submitting ? 'Saving…' : category === 'bad' ? 'Log it honestly' : 'Log it'}
      </button>
    </div>
  )
}
