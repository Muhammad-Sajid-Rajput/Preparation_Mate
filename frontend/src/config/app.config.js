export const APP_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_URL
              || 'http://localhost:5000/api',
  appName: 'Preparation Mate',
  maxFileSizeNotes: 20 * 1024 * 1024,    // 20MB
  maxFileSizeResume: 5 * 1024 * 1024,    // 5MB
  acceptedFileTypes: ['application/pdf'],
  quizQuestionCounts: [5, 10, 15],
  difficultyLevels: ['Easy', 'Medium', 'Hard'],
  experienceLevels: ['Entry', 'Mid', 'Senior'],
  streakDays: 7,
  apiTimeout: 30000,
}
