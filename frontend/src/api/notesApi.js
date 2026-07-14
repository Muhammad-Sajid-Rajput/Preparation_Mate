import api from './axiosInstance'

export const getNotes = async () => {
  const res = await api.get('/notes')
  return res.data
}
export const getNoteById = async (id) => {
  const res = await api.get(`/notes/${id}`)
  return res.data
}
export const uploadNote = async (formData, onProgress) => {
  const res = await api.post('/notes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return res.data
}
export const deleteNote = async (id) => {
  const res = await api.delete(`/notes/${id}`)
  return res.data
}
