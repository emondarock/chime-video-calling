import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { AppointmentCard } from '../components/AppointmentCard';
import { useAppointments } from '../hooks/useAppointments';
import './Appointments.css';

export const Appointments = () => {
  const { user } = useAuth();
  const { appointments, loading, error, refetch } = useAppointments();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, past

  // Remove this useEffect - useAppointments hook already fetches on mount
  // useEffect(() => {
  //   refetch();
  // }, [refetch]);

  const filteredAppointments = appointments.filter(appointment => {
    // Search filter
    const matchesSearch =
      searchTerm === '' ||
      appointment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.packageInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const isPast = appointmentTime < now;

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'upcoming' && !isPast) ||
      (filterStatus === 'past' && isPast);

    return matchesSearch && matchesStatus;
  });

  const handleAppointmentDeleted = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="appointments-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="appointments-container">
        <div className="error-state">
          <h2>Error Loading Appointments</h2>
          <p>{error}</p>
          <button onClick={refetch} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="appointments-container">
        <div className="appointments-header">
          <div className="header-content">
            <h1>My Appointments</h1>
            <p className="subtitle">
              {user?.role === 'patient'
                ? 'View and manage your upcoming consultations'
                : 'Manage patient appointments and consultations'
              }
            </p>
          </div>

          <div className="header-actions">
            {(user?.role === 'doctor' || user?.role === 'admin') && (
              <button
                className="create-appointment-button"
                onClick={() => window.location.href = '/create-appointment'}
              >
                + Create Appointment
              </button>
            )}
          </div>
        </div>

        <div className="appointments-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({appointments.length})
            </button>
            <button
              className={`filter-tab ${filterStatus === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilterStatus('upcoming')}
            >
              Upcoming ({appointments.filter(a => new Date(a.startTime) >= new Date()).length})
            </button>
            <button
              className={`filter-tab ${filterStatus === 'past' ? 'active' : ''}`}
              onClick={() => setFilterStatus('past')}
            >
              Past ({appointments.filter(a => new Date(a.startTime) < new Date()).length})
            </button>
          </div>
        </div>

        <div className="appointments-content">
          {filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h2>No Appointments Found</h2>
              <p>
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : user?.role === 'patient'
                    ? 'You don\'t have any appointments scheduled yet'
                    : 'No appointments have been created yet'
                }
              </p>
              {(user?.role === 'doctor' || user?.role === 'admin') && !searchTerm && filterStatus === 'all' && (
                <button
                  className="create-first-button"
                  onClick={() => window.location.href = '/create-appointment'}
                >
                  Create Your First Appointment
                </button>
              )}
            </div>
          ) : (
            <div className="appointments-grid">
              {filteredAppointments.map(appointment => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  onDeleted={handleAppointmentDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
