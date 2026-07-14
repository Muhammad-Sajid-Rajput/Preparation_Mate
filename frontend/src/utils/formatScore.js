import { SCORE_COLOR } from '../constants/enums'

export const formatPercent = (value) =>
  `${Math.round(value)}%`

export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Needs improvement'
  return 'Keep practicing'
}

export const getScoreColor = (score) => SCORE_COLOR(score)

export const calcStrokeDashoffset = (score, radius = 36) => {
  const circumference = 2 * Math.PI * radius
  return circumference - (score / 100) * circumference
}
