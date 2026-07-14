import api from './axiosInstance'
import { APP_CONFIG } from '../config/app.config'

export const getSessions = async (noteId = null) => {
  const url = noteId ? `/chat/sessions?noteId=${noteId}` : '/chat/sessions?noteId=null'
  const res = await api.get(url)
  return res.data
}
export const createSession = async (noteId = null) => {
  const res = await api.post('/chat/sessions', { noteId })
  return res.data
}
export const deleteSession = async (id) => {
  const res = await api.delete(`/chat/sessions/${id}`)
  return res.data
}
export const sendMessage = async (sessionId, text, noteId) => {
  // Returns a Response with ReadableStream for SSE
  let token = ''
  try {
    const raw = localStorage.getItem('pm_token')
    token = raw ? JSON.parse(raw) : ''
  } catch (err) {
    token = localStorage.getItem('pm_token') || ''
  }

  return fetch(`${APP_CONFIG.apiBaseUrl}/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionId, text, noteId }),
  })
}
