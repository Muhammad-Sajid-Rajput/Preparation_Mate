import api from './axiosInstance'

export const getQuizHistory = async () => {
  const res = await api.get('/quizzes/history')
  return res.data
}
export const generateQuiz = async (data) => {
  const res = await api.post('/quizzes/generate', data)
  return res.data
}
export const submitQuiz = async (id, answers) => {
  const res = await api.post(`/quizzes/submit/${id}`, { answers })
  return res.data
}
