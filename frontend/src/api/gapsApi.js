import api from './axiosInstance'

export const getGapsReport = async () => {
  const res = await api.get('/gaps/report')
  return res.data
}
