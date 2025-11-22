import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { appointmentAPI } from '../utils/api';
import './CreateAppointment.css';

const CreateAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patient_email: '',
    patient_name: '',
    patient_mrn: '',
    doctor_email: user?.email || '',
    doctor_name: '',
    date: '',
    start_time: '',
    end_time: '',
    is_calling_attached: true,
    package_info: {
      name: 'Video Consultation'
    },
    location: 'inside'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'package_name') {
      setFormData(prev => ({
        ...prev,
        package_info: { name: value }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Combine date and times to create ISO timestamps
      const startDateTime = new Date(`${formData.date}T${formData.start_time}`).toISOString();
      const endDateTime = new Date(`${formData.date}T${formData.end_time}`).toISOString();

      const appointmentData = {
        patient_email: formData.patient_email,
        patient_name: formData.patient_name,
        patient_mrn: formData.patient_mrn || undefined,
        doctor_email: formData.doctor_email,
        doctor_name: formData.doctor_name,
        date: formData.date,
        start_time: startDateTime,
        end_time: endDateTime,
        is_calling_attached: formData.is_calling_attached,
        package_info: formData.package_info,
        location: formData.location
      };

      await appointmentAPI.create(appointmentData);

      setSuccess(true);

      // Reset form
      setFormData({
        patient_email: '',
        patient_name: '',
        patient_mrn: '',
        doctor_email: user?.email || '',
        doctor_name: '',
        date: '',
        start_time: '',
        end_time: '',
        is_calling_attached: true,
        package_info: { name: 'Video Consultation' },
        location: 'inside'
      });

      // Redirect to appointments after 2 seconds
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err.response?.data?.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="create-appointment-container">
        <div className="create-appointment-header">
          <button className="back-button" onClick={() => navigate('/appointments')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Appointments
          </button>
          <h1>Create New Appointment</h1>
          <p>Schedule a video consultation with a patient</p>
        </div>

        {success && (
          <div className="success-message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Appointment created successfully! Redirecting...</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="appointment-form">
          <div className="form-section">
            <h3>Patient Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="patient_name">Patient Name *</label>
                <input
                  type="text"
                  id="patient_name"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleChange}
                  required
                  placeholder="Enter patient full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="patient_email">Patient Email *</label>
                <input
                  type="email"
                  id="patient_email"
                  name="patient_email"
                  value={formData.patient_email}
                  onChange={handleChange}
                  required
                  placeholder="patient@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="patient_mrn">Patient MRN (Optional)</label>
                <input
                  type="text"
                  id="patient_mrn"
                  name="patient_mrn"
                  value={formData.patient_mrn}
                  onChange={handleChange}
                  placeholder="Medical Record Number"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Doctor Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="doctor_name">Doctor Name *</label>
                <input
                  type="text"
                  id="doctor_name"
                  name="doctor_name"
                  value={formData.doctor_name}
                  onChange={handleChange}
                  required
                  placeholder="Dr. Smith"
                />
              </div>

              <div className="form-group">
                <label htmlFor="doctor_email">Doctor Email *</label>
                <input
                  type="email"
                  id="doctor_email"
                  name="doctor_email"
                  value={formData.doctor_email}
                  onChange={handleChange}
                  required
                  placeholder="doctor@example.com"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Appointment Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="date">Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label htmlFor="start_time">Start Time *</label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_time">End Time *</label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="package_name">Package Type</label>
                <select
                  id="package_name"
                  name="package_name"
                  value={formData.package_info.name}
                  onChange={handleChange}
                >
                  <option value="Video Consultation">Video Consultation</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Initial Consultation">Initial Consultation</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <select
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                >
                  <option value="inside">Inside (Internal)</option>
                  <option value="outside">Outside (External/Evergreen Glow)</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_calling_attached"
                    checked={formData.is_calling_attached}
                    onChange={handleChange}
                  />
                  <span>Enable Video Calling</span>
                </label>
                <p className="help-text">Creates a video meeting link and sends invitation emails</p>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateAppointment;
