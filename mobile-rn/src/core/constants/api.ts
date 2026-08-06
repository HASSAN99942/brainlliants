export const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://10.0.2.2:8000/api';
export const WS_BASE = process.env.EXPO_PUBLIC_WS_BASE ?? 'ws://10.0.2.2:8000/ws';

export const Endpoints = {
  // Auth
  registerStudent: '/auth/register/student/',
  registerTeacher: '/auth/register/teacher/',
  login: '/auth/login/',
  verifyOtp: '/auth/verify-otp/',
  resendOtp: '/auth/resend-otp/',
  refreshToken: '/auth/token/refresh/',
  logout: '/auth/logout/',
  profile: '/auth/profile/',
  changeLanguage: '/auth/language/',
  // AI
  aiChat: '/ai/chat/',
  aiSummarise: '/ai/summarise/',
  aiQuizResult: '/ai/quiz-result/',
  aiUsage: '/ai/usage/',
  aiSessions: '/ai/sessions/',
  // Content
  questions: '/content/questions/',
  notes: '/content/notes/',
  bookmarks: '/content/bookmarks/',
  bookmarkToggle: '/content/bookmarks/toggle/',
  specialties: '/content/specialties/',
  browseExams: '/content/browse/exams/',
  browseSpecialties: '/content/browse/specialties/',
  browseYears: '/content/browse/years/',
  // Forum
  forumPosts: '/forum/posts/',
  // Community
  groups: '/community/groups/',
  userSearch: '/community/users/search/',
  // Planner
  timetable: '/planner/timetable/',
  progress: '/planner/progress/',
  logSession: '/planner/log-session/',
  fcmToken: '/planner/fcm-token/',
  // Enrolment / schools
  schoolSearch: '/schools/search/',
  enrolments: '/enrolments/',
  enrolmentRequest: '/enrolments/request/',
  // Payments (Sprint 7 later)
  paymentInit: '/payments/initiate/',
  paymentStatus: '/payments/status/',
  subscription: '/payments/subscription/',
} as const;
