import api from './axiosInstance'

export const setupInterview = async (data) => {
  const res = await api.post('/career/interview/setup', data)
  return res.data
}
export const evaluateAnswer = async (data) => {
  const res = await api.post('/career/interview/evaluate', data)
  return res.data
}
export const analyzeResume = async (formData, onProgress) => {
  const res = await api.post('/career/resume/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return res.data
}

export const getInterviewHistory = async () => {
  const res = await api.get('/career/interview/history')
  return res.data
}
