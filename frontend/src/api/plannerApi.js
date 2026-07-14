import api from './axiosInstance'

export const getSuggestedTopics = async () => {
  const res = await api.get('/planner/suggested-topics')
  return res.data
}
export const getTodaysMission = async () => {
  const res = await api.get('/planner/mission')
  return res.data
}
export const getReadinessScore = async () => {
  const res = await api.get('/planner/readiness')
  return res.data
}
export const getPlan = async () => {
  const res = await api.get('/planner/plan')
  return res.data
}
export const createPlan = async (data) => {
  const res = await api.post('/planner/plan', data)
  return res.data
}
export const recalculatePlan = async () => {
  const res = await api.post('/planner/recalculate')
  return res.data
}
export const updateTask = async (taskId, completed, confidenceBefore = null, confidenceAfter = null) => {
  const res = await api.patch(`/planner/tasks/${taskId}`, { completed, confidenceBefore, confidenceAfter })
  return res.data
}
