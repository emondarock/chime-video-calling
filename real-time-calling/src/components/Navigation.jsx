import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const { user, logout } = useAuth();
  const { canCreate, isAdmin, isDoctor } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
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

  const getRoleDisplay = (role) => {
    const roleMap = {
      'patient': 'Patient',
      'doctor': 'Doctor',
      'hospital-admin': 'Hospital Admin',
      'department-admin': 'Department Admin'
    };
    return roleMap[role] || role;
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => navigate('/dashboard')}>
          <div className="brand-logo">🏥</div>
          <div className="brand-text">
            <h1>Evergreen Glow</h1>
            <p>Telehealth Platform</p>
          </div>
        </div>

        <div className="nav-menu">
          <button
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-link ${isActive('/appointments') ? 'active' : ''}`}
            onClick={() => navigate('/appointments')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Appointments</span>
          </button>

          {(canCreate('appointments') || isDoctor() || isAdmin()) && (
            <button
              className={`nav-link ${isActive('/create-appointment') ? 'active' : ''}`}
              onClick={() => navigate('/create-appointment')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>Create Appointment</span>
            </button>
          )}

          <button
            className={`nav-link ${isActive('/meeting') ? 'active' : ''}`}
            onClick={() => navigate('/meeting')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>Meeting Room</span>
          </button>
        </div>

        <div className="nav-user">
          <div
            className="user-info"
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer' }}
          >
            <div
              className="user-avatar"
              style={{ background: getRoleColor(user?.role) }}
            >
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-email">{user?.email}</div>
              <div className="user-role" style={{ color: getRoleColor(user?.role) }}>
                {getRoleDisplay(user?.role)}
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className="logout-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
