import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import Dashboard from './pages/Dashboard';
import MeetingPage from './pages/MeetingPage';
import JoinMeeting from './pages/JoinMeeting';
import { Appointments } from './pages/Appointments';
import CreateAppointment from './pages/CreateAppointment';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <Appointments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-appointment"
        element={
          <ProtectedRoute>
            <CreateAppointment />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/meeting"
        element={
          <ProtectedRoute>
            <MeetingPage />
          </ProtectedRoute>
        }
      />

      <Route path="/join-meeting" element={<JoinMeeting />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
