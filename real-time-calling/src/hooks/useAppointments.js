import { useState, useEffect, useCallback } from 'react';
import { appointmentAPI } from '../utils/api';

/**
 * Custom hook to fetch and manage appointments
 * Automatically filters by user role on backend
 */
export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await appointmentAPI.getAll();
      setAppointments(response.data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const refetch = useCallback(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    refetch
  };
};
