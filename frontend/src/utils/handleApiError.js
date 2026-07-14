export const handleApiError = (error) => {
  if (error.response) {
    return {
      message: error.response.data?.message
               || 'Something went wrong. Please try again.',
      status:  error.response.status,
      field:   error.response.data?.field   || null,
      code:    error.response.data?.code    || null,
    }
  }
  if (error.request) {
    return {
      message: 'Connection failed. Check your internet connection.',
      status:  0,
      field:   null,
      code:    'NETWORK_ERROR',
    }
  }
  return {
    message: error.message || 'An unexpected error occurred.',
    status:  -1,
    field:   null,
    code:    'UNKNOWN_ERROR',
  }
}
