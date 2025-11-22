import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: '',
    phone: '',
    address: ''
  });

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

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement profile update API call
    console.log('Profile update:', formData);
    setIsEditing(false);
  };

  return (
    <>
      <Navigation />
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your account information</p>
        </div>

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar-section">
              <div
                className="profile-avatar-large"
                style={{ background: getRoleColor(user?.role) }}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h2>{user?.email}</h2>
                <div
                  className="profile-role-badge"
                  style={{ background: getRoleColor(user?.role) }}
                >
                  {getRoleDisplay(user?.role)}
                </div>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{user?.email}</span>
              </div>

              {user?.hospital && (
                <div className="detail-row">
                  <span className="detail-label">Hospital:</span>
                  <span className="detail-value">{user.hospital}</span>
                </div>
              )}

              {user?.departmentId && (
                <div className="detail-row">
                  <span className="detail-label">Department:</span>
                  <span className="detail-value">{user.departmentId}</span>
                </div>
              )}

              <div className="detail-row">
                <span className="detail-label">User ID:</span>
                <span className="detail-value">{user?.sub}</span>
              </div>

              {user?.username && (
                <div className="detail-row">
                  <span className="detail-label">Username:</span>
                  <span className="detail-value">{user.username}</span>
                </div>
              )}
            </div>
          </div>

          <div className="profile-card">
            <div className="card-header">
              <h3>Additional Information</h3>
              <button
                className="edit-button"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter your address"
                  />
                </div>

                <button type="submit" className="save-button">
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="profile-details">
                <div className="detail-row">
                  <span className="detail-label">Full Name:</span>
                  <span className="detail-value">{formData.name || 'Not set'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{formData.phone || 'Not set'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{formData.address || 'Not set'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="profile-card">
            <h3>Security Settings</h3>
            <div className="security-options">
              <button className="security-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Change Password
              </button>
              <button className="security-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Two-Factor Authentication
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
