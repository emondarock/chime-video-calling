import { useAuth } from '../contexts/AuthContext';
import { appointmentAPI } from '../utils/api';
import './AppointmentCard.css';

const AppointmentCard = ({ appointment, onRefresh }) => {
  const { user } = useAuth();

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeUntilAppointment = () => {
    if (!appointment.start_time) return null;

    const now = new Date();
    const appointmentTime = new Date(appointment.start_time);
    const timeDiff = appointmentTime - now;
    const timeDiffSeconds = Math.floor(timeDiff / 1000);

    // Can join 15 minutes before
    const joinWindowSeconds = 15 * 60;

    if (timeDiffSeconds < 0) {
      return { status: 'ended', message: 'Ended', canJoin: false };
    } else if (timeDiffSeconds <= joinWindowSeconds) {
      return { status: 'ready', message: 'Join Now', canJoin: true };
    } else {
      const hours = Math.floor(timeDiffSeconds / 3600);
      const minutes = Math.floor((timeDiffSeconds % 3600) / 60);

      if (hours > 0) {
        return {
          status: 'upcoming',
          message: `In ${hours}h ${minutes}m`,
          canJoin: false
        };
      } else {
        return {
          status: 'upcoming',
          message: `In ${minutes}m`,
          canJoin: false
        };
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      await appointmentAPI.delete(appointment._id);
      alert('Appointment deleted successfully');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert(error.response?.data?.message || 'Failed to delete appointment');
    }
  };

  const handleJoinMeeting = () => {
    // Navigate to join meeting page with appointment ID
    window.location.href = `/join-meeting?appointmentId=${appointment._id}`;
  };

  const timeInfo = getTimeUntilAppointment();
  const canDelete = user?.role === 'doctor' || user?.role === 'hospital-admin' || user?.role === 'department-admin';
  const hasMeeting = appointment.is_calling_attached && appointment.meeting_id;

  return (
    <div className="appointment-card">
      <div className="appointment-header">
        <div className="appointment-date">
          <div className="date-day">{formatDate(appointment.start_time).split(' ')[1]}</div>
          <div className="date-month">{formatDate(appointment.start_time).split(' ')[0]}</div>
        </div>
        <div className="appointment-info">
          <h3 className="appointment-title">
            {user?.role === 'patient' ? appointment.doctor_name : appointment.patient_name}
          </h3>
          <div className="appointment-time">
            {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
          </div>
          {appointment.package_info?.name && (
            <div className="appointment-package">{appointment.package_info.name}</div>
          )}
        </div>
      </div>

      <div className="appointment-details">
        <div className="detail-item">
          <span className="detail-label">Patient:</span>
          <span className="detail-value">{appointment.patient_name}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Doctor:</span>
          <span className="detail-value">{appointment.doctor_name}</span>
        </div>
        {appointment.patient_mrn && (
          <div className="detail-item">
            <span className="detail-label">MRN:</span>
            <span className="detail-value">{appointment.patient_mrn}</span>
          </div>
        )}
        {appointment.location && (
          <div className="detail-item">
            <span className="detail-label">Location:</span>
            <span className="detail-value">{appointment.location}</span>
          </div>
        )}
      </div>

      <div className="appointment-actions">
        {hasMeeting && timeInfo && (
          <button
            onClick={handleJoinMeeting}
            disabled={!timeInfo.canJoin}
            className={`join-button ${timeInfo.status}`}
          >
            {timeInfo.canJoin ? '🎥 Join Meeting' : timeInfo.message}
          </button>
        )}

        {canDelete && (
          <button onClick={handleDelete} className="delete-button">
            Delete
          </button>
        )}
      </div>

      {hasMeeting && !timeInfo?.canJoin && timeInfo?.status === 'upcoming' && (
        <div className="join-info">
          Meeting opens 15 minutes before appointment
        </div>
      )}
    </div>
  );
};

export { AppointmentCard };
export default AppointmentCard;
