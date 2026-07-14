// Used as cache keys when React Query is added later
export const QUERY_KEYS = {
  USER:          ['user'],
  NOTES:         ['notes'],
  NOTE:          (id) => ['notes', id],
  QUIZZES:       ['quizzes'],
  QUIZ:          (id) => ['quizzes', id],
  GAPS:          ['gaps'],
  CHAT_SESSIONS: ['chat', 'sessions'],
  CHAT:          (id) => ['chat', id],
  PLAN:          ['plan'],
  ADMIN_STATS:   ['admin', 'stats'],
}
