export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PASSWORD_RESET_SUCCESS: '/password-reset-success',

  // App
  DASHBOARD: '/app/dashboard',
  NOTES: '/app/notes',
  NOTE_DETAIL: '/app/notes/:id',
  QUIZZES: '/app/quizzes',
  QUIZ_GENERATE: '/app/quizzes/generate',
  QUIZ_TAKING: '/app/quizzes/:id',
  QUIZ_RESULTS: '/app/quizzes/:id/results',
  GAPS: '/app/gaps',
  CHAT: '/app/chat',
  PLANNER: '/app/planner',
  PLANNER_CREATE: '/app/planner/create',
  INTERVIEW: '/app/interview',
  INTERVIEW_QA: '/app/interview/:id',
  INTERVIEW_HISTORY: '/app/interview/history',
  RESUME: '/app/resume',
  RESUME_RESULTS: '/app/resume/:id',
  PROFILE: '/app/profile',
  NOTIFICATIONS: '/app/notifications',
  SETTINGS: '/app/settings',

  // Admin
  ADMIN: '/admin/dashboard',
}

// Helper — builds route with params:
// buildRoute(ROUTES.NOTE_DETAIL, { id: '123' })
// → '/app/notes/123'
export const buildRoute = (route, params = {}) => {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, value),
    route
  )
}
