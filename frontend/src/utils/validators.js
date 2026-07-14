import { APP_CONFIG } from '../config/app.config'

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return 'Email is required'
  if (!re.test(email)) return 'Enter a valid email address'
  return null
}

export const validatePassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Must be at least 8 characters'
  if (!/[A-Z]/.test(password)) return 'Must contain at least one uppercase letter'
  if (!/[a-z]/.test(password)) return 'Must contain at least one lowercase letter'
  if (!/\d/.test(password)) return 'Must contain at least one number'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Must contain at least one special character'
  return null
}

export const validatePasswordMatch = (password, confirm) => {
  if (password !== confirm) return 'Passwords do not match'
  return null
}

export const validateFile = (file, type = 'notes') => {
  const maxSize = type === 'resume'
    ? APP_CONFIG.maxFileSizeResume
    : APP_CONFIG.maxFileSizeNotes
  if (!file) return 'Please select a file'
  if (!APP_CONFIG.acceptedFileTypes.includes(file.type))
    return 'Only PDF files are accepted'
  if (file.size > maxSize)
    return `File must be under ${maxSize / (1024*1024)}MB`
  return null
}
