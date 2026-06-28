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
import { useAuth } from '../context/AuthContext'
import { insertLog, uploadActivityPhoto, getTodayBonusPoints } from '../lib/db'
import ActivityTimer from '../components/ActivityTimer'
import ResetPrompt from '../components/ResetPrompt'

const CATEGORIES = [
  { id: 'good',  label: 'Good',  hint: 'Earn points' },
  { id: 'bad',   label: 'Bad',   hint: 'Lose points' },
  { id: 'bonus', label: 'Bonus', hint: 'Small wins'  },
]

export default function Log() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()

  const [category, setCategory]   = useState('good')
  const [activityId, setActivityId] = useState('')
  const [inputMode, setInputMode] = useState(null) // null | 'timer' | 'manual'
  const [duration, setDuration]   = useState('')
  const [caption, setCaption]     = useState('')
  const [trigger, setTrigger]     = useState('')
  const [photo, setPhoto]         = useState(null)   // base64 preview
  const [photoFile, setPhotoFile] = useState(null)   // File object for upload
  const [showReset, setShowReset] = useState(false)
  const [submittedPoints, setSubmittedPoints] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [bonusPointsToday, setBonusPointsToday] = useState(0)

  useEffect(() => {
    if (!userProfile?.id) return
    getTodayBonusPoints(userProfile.id)
      .then(setBonusPointsToday)
      .catch(() => setBonusPointsToday(0))
  }, [userProfile])

  const activityList =
    category === 'good' ? GOOD_ACTIVITIES
    : category === 'bad' ? BAD_ACTIVITIES
    : BONUS_ACTIVITIES

  const selectedActivity = activityList.find(a => a.id === activityId)

  // Whether to show the full review section (caption / photo / trigger / submit)
  const inReview =
    category === 'bonus' ||
    inputMode === 'manual' ||
    (inputMode === 'timer' && duration !== '')

  // Live point preview
  let previewPoints = 0
  if (selectedActivity) {
    if (category === 'bonus') {
      previewPoints = selectedActivity.points
    } else if (duration) {
      previewPoints = calculateGoodOrBadPoints(selectedActivity, Number(duration))
    }
  }

  const bonusRemaining = DAILY_BONUS_CAP - bonusPointsToday
  const bonusCapped    = category === 'bonus' && selectedActivity && previewPoints > bonusRemaining

  const canSubmit =
    !submitting &&
    selectedActivity &&
    (category === 'bonus' || (duration && Number(duration) > 0))

  function handleCategoryChange(newCat) {
    setCategory(newCat)
    setActivityId('')
    setInputMode(null)
    setDuration('')
    setTrigger('')
    setPhoto(null)
    setPhotoFile(null)
  }

  function handleActivityChange(newId) {
    setActivityId(newId)
    setInputMode(null)
    setDuration('')
  }

  function handleModeSelect(mode) {
    setInputMode(mode)
    if (mode === 'timer') setDuration('')
  }

  function handleTimerComplete(elapsedMinutes) {
    setDuration(String(Math.round(elapsedMinutes)))
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!canSubmit || !userProfile?.id) return

    const finalPoints = bonusCapped ? Math.max(0, bonusRemaining) : previewPoints
    setSubmittedPoints(finalPoints)
    setSubmitting(true)

    try {
      let photoUrl
      if (photoFile) {
        photoUrl = await uploadActivityPhoto(photoFile, userProfile.id)
      }

      await insertLog({
        userId:          userProfile.id,
        category,
        activityName:    selectedActivity.name,
        durationMinutes: category === 'bonus' ? null : Number(duration),
        points:          finalPoints,
        caption:         caption   || undefined,
        trigger:         trigger   || undefined,
        photoUrl,
      })
    } catch (err) {
      console.error('Failed to save log:', err)
    }

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

      {/* Category tabs */}
      <div className="category-tabs">
        {CATEGORIES.map(cat => (
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

      {/* Activity picker */}
      <div className="field">
        <label className="field-label">Activity</label>
        <select value={activityId} onChange={e => handleActivityChange(e.target.value)}>
          <option value="">Choose an activity…</option>
          {activityList.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Input-mode picker — Good and Bad only, once an activity is selected */}
      {selectedActivity && category !== 'bonus' && (
        <div className="input-mode-picker">
          <button
            className={`mode-btn ${inputMode === 'timer' ? 'active' : ''}`}
            onClick={() => handleModeSelect('timer')}
          >
            <span className="mode-btn-icon">⏱</span>
            Time it live
          </button>
          <button
            className={`mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
            onClick={() => handleModeSelect('manual')}
          >
            <span className="mode-btn-icon">✏️</span>
            Enter manually
          </button>
        </div>
      )}

      {/* Timer — visible while running (no duration set yet) */}
      {inputMode === 'timer' && duration === '' && selectedActivity && (
        <ActivityTimer
          activity={selectedActivity}
          category={category}
          onComplete={handleTimerComplete}
        />
      )}

      {/* Duration field — manual mode, or after timer finishes (editable pre-fill) */}
      {category !== 'bonus' && inReview && (
        <div className="field">
          <label className="field-label">Duration (minutes)</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 30"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min="1"
            max="600"
          />
        </div>
      )}

      {/* Review section — shown once duration is known */}
      {inReview && (
        <>
          {category === 'bad' && (
            <div className="field">
              <label className="field-label">What triggered it? <span className="optional">optional</span></label>
              <div className="trigger-chips">
                {TRIGGER_OPTIONS.map(t => (
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
                onChange={e => setCaption(e.target.value)}
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

          <button
            className={`btn ${category === 'bad' ? 'btn-bad' : 'btn-primary'} submit-btn`}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? 'Saving…' : category === 'bad' ? 'Log it honestly' : 'Log it'}
          </button>
        </>
      )}
    </div>
  )
}
