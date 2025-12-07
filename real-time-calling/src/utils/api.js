import axios from 'axios';

const AUTH_API_URL = 'https://api.dev.omidnetcare.com';
const API_BASE_URL = 'https://api.dev.omidnetcare.com';

// Separate auth client for login (different base URL)
export const authClient = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Main API client for backend (Chime + Appointments)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add JWT token (uses idToken from login response)
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('idToken');
    if (token) {
      config.headers.Authorization = API_BASE_URL === 'https://api.dev.omidnetcare.com' ? `${token}` : `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor to handle 401 errors (token expired)
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      authAPI.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth helper functions
export const authAPI = {
  login: (email, password, lat, long) =>
    authClient.post('/auth/login', { email, password, lat, long }),

  // Store tokens after successful login
  saveTokens: (accessToken, idToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  // Get decoded user info from idToken
  getUserInfo: () => {
    const idToken = localStorage.getItem('idToken');
    if (!idToken) return null;

    try {
      const payload = idToken.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return {
        email: decoded.email,
        role: decoded['custom:role'],
        hospital: decoded['custom:hospital'],
        departmentId: decoded['custom:departmentId'],
        sub: decoded.sub,
        username: decoded['cognito:username'],
        emailVerified: decoded.email_verified
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
  }
};

// Chime SDK API endpoints
export const chimeAPI = {
  createMeeting: (userId) =>
    apiClient.post('/create-meeting', userId ? { userId } : {}),

  addAttendee: (meetingId, userId) =>
    apiClient.post('/add-attendee', { meetingId, userId }),

  getMeeting: (meetingId) =>
    apiClient.get('/get-meeting', { params: { meetingId } }),

  deleteMeeting: (meetingId) =>
    apiClient.post('/delete-meeting', { meetingId }),

  listAttendees: (meetingId) =>
    apiClient.get('/list-attendees', { params: { meetingId } }),

  startTranscription: (meetingId) =>
    apiClient.post('/start-meeting-transcription', { meetingId }),

  stopTranscription: (meetingId) =>
    apiClient.post('/stop-meeting-transcription', { meetingId })
};

// Appointment API endpoints
export const appointmentAPI = {
  getAll: () =>
    apiClient.get('/appointment/get-all'),

  create: (appointmentData) =>
    apiClient.post('/appointment/create', appointmentData),

  update: (appointmentId, updateInfo) =>
    apiClient.post('/appointment/update', { appointmentId, updateInfo }),

  delete: (appointmentId) =>
    apiClient.delete('/appointment/delete', { params: { appointmentId } }),

  checkMeeting: (meetingToken) =>
    apiClient.get('/appointment/check-meeting', { params: { meetingToken } }),

  getByDateRange: (startDate, endDate) =>
    apiClient.post('/appointment/get-by-date-range', { startDate, endDate }),

  getUpcoming: () =>
    apiClient.get('/appointment/get-upcoming'),

  sendReminder: (appointmentId) =>
    apiClient.post('/appointment/send-reminder', { appointmentId })
};

export default apiClient;
