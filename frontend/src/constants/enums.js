export const DIFFICULTY = {
  EASY:   'Easy',
  MEDIUM: 'Medium',
  HARD:   'Hard',
}

export const EXPERIENCE_LEVEL = {
  ENTRY:  'Entry',
  MID:    'Mid',
  SENIOR: 'Senior',
}

export const MASTERY_LEVEL = {
  CRITICAL:    { label: 'Critical',    max: 40,  color: '#DC2626' },
  NEEDS_WORK:  { label: 'Needs work',  max: 60,  color: '#D97706' },
  GOOD:        { label: 'Good',        max: 80,  color: '#0E2F76' },
  MASTERED:    { label: 'Mastered',    max: 100, color: '#16A34A' },
}

export const getMasteryLevel = (pct) => {
  if (pct < 40) return MASTERY_LEVEL.CRITICAL
  if (pct < 60) return MASTERY_LEVEL.NEEDS_WORK
  if (pct < 80) return MASTERY_LEVEL.GOOD
  return MASTERY_LEVEL.MASTERED
}

export const SCORE_COLOR = (score) => {
  if (score >= 80) return '#16A34A'
  if (score >= 60) return '#D97706'
  return '#DC2626'
}

export const ACTIVITY_TYPE = {
  QUIZ:   'quiz',
  NOTE:   'note',
  CHAT:   'chat',
  PLAN:   'plan',
}

export const FILE_TYPE = {
  PDF:  'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
