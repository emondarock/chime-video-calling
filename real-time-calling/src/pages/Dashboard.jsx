import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import RoleGuard from '../components/RoleGuard';
import AdminPanel from '../components/AdminPanel';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getRoleDisplay = (role) => {
    const roleMap = {
      'patient': 'Patient',
      'doctor': 'Doctor',
      'hospital-admin': 'Hospital Administrator',
      'department-admin': 'Department Administrator'
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role) => {
    const colorMap = {
      'patient': '#10b981',
      'doctor': '#3b82f6',
      'hospital-admin': '#8b5cf6',
      'department-admin': '#f59e0b'
    };
    return colorMap[role] || '#6b7280';
  };

  return (
    <>
      <Navigation />

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome back!</h2>
          <div className="user-card">
            <div className="user-avatar" style={{ background: getRoleColor(user?.role) }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <h3>{user?.email}</h3>
              <p className="user-role">{getRoleDisplay(user?.role)}</p>
              {user?.hospital && (
                <p className="user-meta">Hospital: {user.hospital}</p>
              )}
              {user?.departmentId && (
                <p className="user-meta">Department: {user.departmentId}</p>
              )}
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-grid">
            <button
              className="action-card"
              onClick={() => navigate('/meeting')}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <h4>Start Meeting</h4>
              <p>Create or join a video consultation</p>
            </button>

            <button
              className="action-card"
              onClick={() => navigate('/appointments')}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <h4>My Appointments</h4>
              <p>View and manage your schedule</p>
            </button>

            {(user?.role === 'doctor' || user?.role === 'hospital-admin' || user?.role === 'department-admin') && (
              <button
                className="action-card"
                onClick={() => navigate('/create-appointment')}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <h4>Create Appointment</h4>
                <p>Schedule a new consultation</p>
              </button>
            )}

            <button
              className="action-card"
              onClick={() => navigate('/profile')}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <h4>Profile</h4>
              <p>View and edit your information</p>
            </button>
          </div>
        </div>

        <RoleGuard allowedRoles={['hospital-admin', 'department-admin']}>
          <div className="admin-section">
            <h3>Admin Analytics</h3>
            <AdminPanel />
          </div>
        </RoleGuard>

        <div className="info-section">
          <div className="info-card">
            <h4>🎉 Welcome to Evergreen Glow!</h4>
            <p>Your telehealth platform is ready. Use the navigation above to access all features.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
