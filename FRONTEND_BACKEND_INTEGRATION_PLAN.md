# Frontend-Backend Integration Plan
## Chime SDK Telehealth Platform

---

## 📊 Current State Analysis

### Backend (Express Server - Port 4000)
✅ **Completed Features:**
- AWS Chime SDK meeting management (create, join, delete, transcription)
- Appointment CRUD operations with MongoDB
- JWT-based meeting tokens for secure joining
- Email invitation system (confirmation, reminder, meeting invitation)
- Role-based access control (patient, doctor, hospital-admin, department-admin)
- AWS Cognito JWT authentication middleware
- Scheduler service (15-minute join window validation)

### Frontend (React + Vite - Port 5173)
✅ **Working Features:**
- Basic Chime SDK video conferencing UI
- Manual meeting creation and joining
- Video tile management with local/remote participants
- Meeting transcription controls
- Mobile-responsive design

❌ **Critical Issues:**
1. **Missing `amazon-chime-sdk-js` package** - Imported but not installed
2. **No authentication** - All API calls are unauthenticated
3. **Wrong API URL** - Hardcoded to port 3000 (backend runs on 4000)
4. **No token-based joining** - Backend creates JWT tokens but frontend doesn't use them
5. **No appointment integration** - Users can't see or join scheduled appointments

---

## 🎯 Integration Phases

### **Phase 1: Critical Fixes & Configuration** ✅ COMPLETED
**Priority: IMMEDIATE**

#### Tasks:
- [x] Install missing `amazon-chime-sdk-js` package -> npm install --save amazon-chime-sdk-js@2
- [x] Update default API base URL to `http://localhost:4000`
- [x] Create `.env` file for environment variables
- [x] Install `react-router-dom` for routing
- [x] Install `axios` for better API handling
- [x] Fix all backend import issues (.js extensions)
- [x] Both servers running successfully (Backend: port 4000, Frontend: port 3001)

#### Files to Create/Modify:
```
real-time-calling/
├── .env                          # NEW - Environment variables
├── .env.example                  # NEW - Template for deployment
├── package.json                  # MODIFY - Add dependencies
└── src/
    ├── App.jsx                   # MODIFY - Update API URL
    └── utils/
        └── api.js                # NEW - Centralized API client
```

#### Dependencies to Install:
```bash
npm install --save amazon-chime-sdk-js@2 react-router-dom axios
```

#### Environment Variables:
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_APP_NAME=Evergreen Glow Telehealth
```

---

### **Phase 2: Authentication Layer** ✅ COMPLETED
**Priority: HIGH**

#### Authentication API:
```
Login Endpoint: https://api.dev.omidnetcare.com/auth/login
Method: POST
Payload:
{
  "email": "muhcoder@gmail.com",
  "password": "Omidnetcare@123!",
  "lat": 23.8250779,
  "long": 90.3600579
}

Response:
{
  "accessToken": "eyJraWQi...",  // Use for API calls (Bearer token)
  "idToken": "eyJraWQi...",       // Contains user info
  "expiresIn": 86400,             // Token expires in 24 hours
  "refreshToken": "eyJjdHki..."   // Use to refresh access token
}
```

#### ID Token Decoded Payload:
```json
{
  "sub": "085e9852-8012-4943-a9e0-ce5cfd1394b0",
  "email_verified": true,
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_R7QmBsezJ",
  "cognito:username": "085e9852-8012-4943-a9e0-ce5cfd1394b0",
  "custom:hospital": "muhcoder@gmail.com",
  "custom:role": "hospital-admin",
  "email": "muhcoder@gmail.com",
  "token_use": "id"
}
```

#### Tasks:
- [x] Create authentication context for global JWT state
- [x] Build login component (token input for testing, Cognito later)
- [x] Create protected route wrapper component
- [x] Update all API calls to include `Authorization: Bearer <token>` header
- [x] Add token storage (localStorage/sessionStorage)
- [x] Handle 401 errors and redirect to login

#### Files to Create:
```
src/
├── contexts/
│   └── AuthContext.jsx           # Global auth state + JWT management
├── components/
│   ├── Login.jsx                 # Login form/token input
│   └── ProtectedRoute.jsx        # Route guard for authenticated pages
├── utils/
│   ├── api.js                    # UPDATE - Add auth headers
│   └── auth.js                   # JWT decode/validation helpers
└── App.jsx                       # UPDATE - Wrap with AuthProvider
```

#### API Client Structure:
```javascript
// src/utils/api.js
import axios from 'axios';

const AUTH_API_URL = 'https://api.dev.omidnetcare.com';

// Separate auth client for login (different base URL)
export const authClient = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Main API client for backend (Chime + Appointments)
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add JWT token (uses accessToken from login response)
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
        username: decoded['cognito:username']
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

export default apiClient;
```

---

### **Phase 3: Token-Based Meeting Join Flow** ✅ COMPLETED
**Priority: HIGH**

#### Current Backend Flow:
```
1. POST /appointment/create (with is_calling_attached: true)
   → Creates Chime meeting
   → Generates JWT meeting token
   → Stores in SchedulerModel
   → Sends email with: ${FRONTEND_URL}/join-meeting?token=<JWT>

2. JWT Token Payload:
   {
     email: "patient@example.com",
     appointmentId: "mongo-object-id"
   }

3. GET /appointment/check-meeting?meetingToken=<JWT>
   → Validates token
   → Checks if within 15-minute window before appointment
   → Returns meeting details + Chime meeting info
```

#### Tasks:
- [x] Add React Router to App.jsx
- [x] Create `/join-meeting` route
- [x] Parse `?token=` query parameter
- [x] Call `/appointment/check-meeting` API
- [x] Extract Chime meeting details and auto-join
- [x] Show error if outside join window or invalid token

#### Files to Create:
```
src/
├── pages/
│   ├── JoinMeeting.jsx           # NEW - Token-based join page
│   └── Home.jsx                  # NEW - Move existing App content here
├── App.jsx                       # MODIFY - Add routing
└── utils/
    └── queryParams.js            # NEW - URL parameter helpers
```

#### Join Meeting Page Flow:
```jsx
// URL: http://localhost:5173/join-meeting?token=eyJhbGc...

1. Extract token from URL query params
2. Call GET /appointment/check-meeting?meetingToken=<token>
3. Response:
   {
     meeting: { Meeting: {...}, Attendee: {...} },
     appointment: { patient_name, doctor_name, start_time, ... },
     canJoin: true,
     message: "Meeting is ready to join"
   }
4. Auto-start Chime session with meeting + attendee info
5. Show appointment details in UI
```

---

### **Phase 4: Appointment Management Dashboard** 📅
**Priority: MEDIUM**

#### Features by Role:

**Patient View:**
- See list of their scheduled appointments
- "Join Meeting" button (enabled 15 min before appointment)
- View appointment details (doctor, date, time, package)

**Doctor View:**
- Calendar view of all their appointments
- Create new appointment form
- Patient search/selection
- Appointment CRUD operations
- "Join Meeting" button for their appointments

**Admin View (Hospital/Department):**
- See all appointments in their scope
- Create appointments for any doctor in their hospital/department
- Analytics dashboard
- Appointment reports

#### Tasks:
- [ ] Create appointments dashboard page
- [ ] Build appointment list component with role-based filtering
- [ ] Add "Join Meeting" button (checks 15-min window)
- [ ] Create appointment form for doctors/admins
- [ ] Add date/time picker component
- [ ] Implement appointment search/filter
- [ ] Add pagination for appointment list

#### Files to Create:
```
src/
├── pages/
│   ├── Dashboard.jsx             # Role-based dashboard
│   ├── Appointments.jsx          # Appointment list/calendar
│   └── CreateAppointment.jsx     # Appointment form
├── components/
│   ├── AppointmentCard.jsx       # Single appointment display
│   ├── AppointmentForm.jsx       # Form fields
│   ├── JoinButton.jsx            # Smart join button (checks time)
│   └── PatientSearch.jsx         # Patient autocomplete
└── hooks/
    ├── useAppointments.js        # Fetch appointments by role
    └── useCanJoinMeeting.js      # Check 15-min window
```

#### API Endpoints to Use:
```javascript
// Get appointments (role-based filtering)
GET /appointment/get-all
Headers: { Authorization: Bearer <JWT> }
Response: Returns appointments based on user's role

// Create appointment
POST /appointment/create
Body: {
  patient_email, patient_name, doctor_email, doctor_name,
  date, start_time, end_time, is_calling_attached: true
}

// Check if can join meeting
POST /appointment/check-meeting
Body: { appointmentId }
Response: { canJoin: true/false, meeting, timeRemaining }
```

---

### **Phase 5: Role-Based UI Components** 👥
**Priority: MEDIUM**

#### User Roles & Permissions:
```javascript
// Extracted from JWT token
const userRoles = {
  'patient': {
    canView: ['own appointments'],
    canCreate: [],
    canJoin: ['own meetings'],
    canDelete: []
  },
  'doctor': {
    canView: ['own appointments', 'patient details'],
    canCreate: ['appointments'],
    canJoin: ['own meetings'],
    canDelete: ['own appointments']
  },
  'hospital-admin': {
    canView: ['all hospital appointments'],
    canCreate: ['appointments'],
    canJoin: ['all meetings'],
    canDelete: ['hospital appointments']
  },
  'department-admin': {
    canView: ['department appointments'],
    canCreate: ['appointments'],
    canJoin: ['department meetings'],
    canDelete: ['department appointments']
  }
};
```

#### Tasks:
- [ ] Create role-based navigation menu
- [ ] Add conditional rendering for features by role
- [ ] Build admin-only components (analytics, reports)
- [ ] Add permission checking utility functions
- [ ] Show/hide UI elements based on user role

#### Files to Create:
```
src/
├── components/
│   ├── Navigation.jsx            # Role-based nav menu
│   ├── AdminPanel.jsx            # Admin-only features
│   └── RoleGuard.jsx             # Component-level permission check
├── hooks/
│   └── usePermissions.js         # Check user permissions
└── utils/
    └── permissions.js            # Permission rules by role
```

#### Example Role Guard:
```jsx
<RoleGuard allowedRoles={['doctor', 'hospital-admin']}>
  <CreateAppointmentButton />
</RoleGuard>
```

---

### **Phase 6: Enhanced Features & Production Polish** 🚀
**Priority: LOW (Nice-to-have)**

#### Features:
- [ ] Real-time notifications (appointment reminders via WebSocket/polling)
- [ ] Enhanced video controls:
  - Mute/unmute audio
  - Switch camera (front/back on mobile)
  - Screen sharing
  - Virtual background
- [ ] Meeting history and recordings
- [ ] Appointment reminders (integrate with reminder system)
- [ ] Patient profile management
- [ ] Calendar integration (iCal export)
- [ ] Meeting notes/transcription viewer
- [ ] File sharing during meetings
- [ ] Waiting room feature
- [ ] Multi-language support
- [ ] Dark/light theme toggle

#### Files to Create:
```
src/
├── components/
│   ├── VideoControls.jsx         # Enhanced meeting controls
│   ├── Notifications.jsx         # Toast notifications
│   ├── MeetingHistory.jsx        # Past meetings list
│   └── WaitingRoom.jsx           # Pre-meeting lobby
├── hooks/
│   ├── useNotifications.js       # Real-time alerts
│   └── useMeetingControls.js    # Video/audio control hooks
└── services/
    └── websocket.js              # Real-time connection
```

---

## 🔧 Implementation Steps (Ordered)

### **Week 1: Foundation**
1. ✅ Install dependencies (Chime SDK, React Router, Axios)
2. ✅ Create `.env` file and API client utility
3. ✅ Update API base URL in App.jsx
4. ✅ Add React Router structure
5. ✅ Build authentication context and login page

### **Week 2: Core Features**
6. ✅ Implement token-based join meeting page
7. ✅ Test full flow: Create appointment → Email → Join via token
8. ✅ Build appointments dashboard
9. ✅ Add role-based filtering for appointment list
10. ✅ Create appointment form for doctors/admins

### **Week 3: Polish & Testing**
11. ✅ Add role-based navigation and permissions
12. ✅ Implement error handling and loading states
13. ✅ Mobile responsiveness testing
14. ✅ End-to-end testing (all user roles)
15. ✅ Documentation and deployment guide

---

## 📂 Final Project Structure

```
real-time-calling/
├── .env
├── .env.example
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx                    # Router setup
    ├── App.css
    ├── index.css
    │
    ├── contexts/
    │   └── AuthContext.jsx        # Global auth state
    │
    ├── pages/
    │   ├── Home.jsx               # Meeting demo (existing functionality)
    │   ├── Login.jsx              # Authentication
    │   ├── Dashboard.jsx          # Role-based landing page
    │   ├── Appointments.jsx       # Appointment list/calendar
    │   ├── CreateAppointment.jsx  # New appointment form
    │   └── JoinMeeting.jsx        # Token-based join
    │
    ├── components/
    │   ├── Navigation.jsx         # App navigation
    │   ├── ProtectedRoute.jsx     # Auth guard
    │   ├── RoleGuard.jsx          # Permission guard
    │   ├── AppointmentCard.jsx    # Appointment display
    │   ├── AppointmentForm.jsx    # Form fields
    │   ├── JoinButton.jsx         # Smart join button
    │   ├── PatientSearch.jsx      # Patient autocomplete
    │   ├── VideoControls.jsx      # Meeting controls
    │   └── Notifications.jsx      # Toast messages
    │
    ├── hooks/
    │   ├── useAppointments.js     # Appointment data fetching
    │   ├── usePermissions.js      # Role-based permissions
    │   ├── useCanJoinMeeting.js   # Join window validation
    │   └── useMeetingControls.js  # Video/audio controls
    │
    ├── utils/
    │   ├── api.js                 # Axios client with auth
    │   ├── auth.js                # JWT helpers
    │   ├── permissions.js         # Permission rules
    │   └── queryParams.js         # URL parsing
    │
    └── services/
        └── websocket.js           # Real-time notifications (optional)
```

---

## 🔌 Backend API Reference

### **Authentication**
```javascript
// All protected routes require:
Headers: {
  Authorization: "Bearer <JWT_TOKEN>"
}

// JWT decoded structure:
{
  email: "user@example.com",
  sub: "cognito-user-id",
  "custom:role": "doctor",
  "custom:hospital": "hospital-123",
  "custom:departmentId": "dept-456",
  "cognito:username": "username"
}
```

### **Appointment Endpoints**
```javascript
// Create appointment
POST /appointment/create
Body: {
  patient_email: "patient@example.com",
  patient_name: "John Doe",
  patient_mrn: "optional",
  doctor_email: "doctor@example.com",
  doctor_name: "Dr. Smith",
  date: "2025-11-21",
  start_time: "2025-11-21T14:00:00Z",
  end_time: "2025-11-21T14:30:00Z",
  is_calling_attached: true,
  package_info: { name: "Consultation" },
  location: "inside" // or "outside" for Evergreen Glow
}
Response: {
  _id: "appointment-id",
  meeting_id: "chime-meeting-id",
  patient_mrn: "generated-mrn",
  ...appointment details
}

// Get all appointments (role-based)
GET /appointment/get-all
Response: [{ _id, patient_name, doctor_name, date, start_time, ... }]

// Check if can join meeting (15-min window)
GET /appointment/check-meeting?meetingToken=<JWT>
Response: {
  canJoin: true,
  meeting: { Meeting: {...}, Attendee: {...} },
  appointment: { patient_name, doctor_name, start_time, ... },
  timeRemaining: 900 // seconds
}

// Update appointment
POST /appointment/update
Body: {
  appointmentId: "mongo-id",
  updateInfo: { start_time: "...", end_time: "..." }
}

// Delete appointment
DELETE /appointment/delete?appointmentId=<id>
```

### **Chime SDK Endpoints**
```javascript
// Create meeting
POST /create-meeting
Body: { userId: "optional-user-id" }
Response: { Meeting: {...}, Attendees: [{...}] }

// Add attendee
POST /add-attendee
Body: { meetingId: "chime-meeting-id", userId: "user-id" }
Response: { Attendee: {...} }

// Get meeting details
GET /get-meeting?meetingId=<id>

// Delete meeting
POST /delete-meeting
Body: { meetingId: "chime-meeting-id" }

// Start/stop transcription
POST /start-meeting-transcription
POST /stop-meeting-transcription
Body: { meetingId: "chime-meeting-id" }
```

---

## 🚀 Quick Start Guide

### **1. Install Frontend Dependencies**
```bash
cd real-time-calling
npm install amazon-chime-sdk-js react-router-dom axios
```

### **2. Create Environment File**
```bash
# real-time-calling/.env
VITE_API_BASE_URL=http://localhost:4000
VITE_APP_NAME=Evergreen Glow Telehealth
```

### **3. Update Backend .env**
```bash
# express-server/.env
FRONTEND_URL=http://localhost:5173
PORT=4000
```

### **4. Start Both Servers**
```bash
# Terminal 1 - Backend
cd express-server
npm run dev

# Terminal 2 - Frontend
cd real-time-calling
npm run dev
```

### **5. Test Authentication**
```bash
# Login to get tokens
POST https://api.dev.omidnetcare.com/auth/login
Body:
{
  "email": "muhcoder@gmail.com",
  "password": "Omidnetcare@123!",
  "lat": 23.8250779,
  "long": 90.3600579
}

# Response will contain:
# - accessToken: Use for Authorization header in API calls
# - idToken: Contains user info (email, role, hospital)
# - refreshToken: Use to get new access token when expired
# - expiresIn: 86400 seconds (24 hours)

# Store accessToken in localStorage and use in all API calls:
# Authorization: Bearer <accessToken>
```

### **6. Test Token-Based Join Flow**
```bash
# 1. Create appointment with calling attached
POST http://localhost:4000/appointment/create
{
  "patient_email": "patient@test.com",
  "patient_name": "John Doe",
  "doctor_email": "doctor@test.com",
  "doctor_name": "Dr. Smith",
  "date": "2025-11-21",
  "start_time": "2025-11-21T14:00:00Z",
  "end_time": "2025-11-21T14:30:00Z",
  "is_calling_attached": true
}

# 2. Copy JWT token from response logs (console)
# 3. Visit: http://localhost:5173/join-meeting?token=<JWT>
# 4. Meeting should auto-join if within 15-min window
```

---

## 🔒 Security Considerations

### **Current Issues:**
- ❌ JWT signature verification not implemented (only base64 decode)
- ❌ AWS credentials in `.env` (should use IAM roles in production)
- ❌ No rate limiting on public endpoints
- ❌ CORS allows all origins
- ❌ Weak JWT secrets (placeholders)

### **Production Recommendations:**
1. Implement proper JWT signature verification with `jsonwebtoken` package
2. Use AWS IAM roles instead of hardcoded credentials
3. Add rate limiting middleware (express-rate-limit)
4. Configure CORS with specific allowed origins
5. Generate strong random secrets (64+ character hex strings)
6. Enable HTTPS in production
7. Add helmet.js for security headers
8. Implement refresh token mechanism
9. Add API request logging and monitoring
10. Use environment-specific `.env` files

---

## 📝 Testing Checklist

### **Manual Testing:**
- [ ] Patient can log in and see their appointments
- [ ] Patient can join meeting via email token link
- [ ] Doctor can create appointments with video calling
- [ ] Doctor receives meeting invitation email
- [ ] Join button only enables 15 min before appointment
- [ ] Invalid/expired tokens show error message
- [ ] Role-based permissions work correctly
- [ ] Video/audio works on both sides
- [ ] Meeting transcription starts/stops
- [ ] Mobile responsive on iOS/Android

### **Edge Cases:**
- [ ] Token used before 15-min window shows error
- [ ] Token used after appointment time shows error
- [ ] Multiple attendees can join same meeting
- [ ] User without camera/microphone can still join
- [ ] Network interruption during meeting recovers gracefully
- [ ] Meeting deleted while participants are joined

---

## 📚 Resources

### **Documentation:**
- [Amazon Chime SDK JS Docs](https://aws.github.io/amazon-chime-sdk-js/)
- [React Router v6 Docs](https://reactrouter.com/)
- [Axios Docs](https://axios-http.com/)
- [AWS Cognito JWT Docs](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)

### **Backend Code References:**
- `express-server/service/appointment.service.js` - Appointment creation with Chime meeting
- `express-server/service/scheduler.service.js` - 15-min join window validation
- `express-server/helper/email.helper.js` - Email invitation sending
- `express-server/server.js` - Authentication middleware

---

## 🎯 Success Metrics

**Phase 1 Complete:** Frontend can connect to backend and basic meeting works
**Phase 2 Complete:** Authentication working, protected routes functional
**Phase 3 Complete:** Token-based join works end-to-end
**Phase 4 Complete:** Appointments dashboard shows data by role
**Phase 5 Complete:** All user roles have appropriate UI/permissions
**Phase 6 Complete:** Production-ready with all polish features

---

## 📧 Contact & Support

For questions about this integration plan, refer to:
- Backend setup: `express-server/README.md`
- Frontend setup: `real-time-calling/README.md`
- API documentation: This file (Backend API Reference section)

---

**Last Updated:** November 21, 2025
**Version:** 1.0
**Status:** Planning Complete - Ready for Implementation
