import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook to check if a meeting can be joined
 * Checks if current time is within 15 minutes before the appointment
 * @param {string} startTime - ISO 8601 datetime string
 * @returns {object} { canJoin: boolean, timeUntil: number (seconds), message: string }
 */
export const useCanJoinMeeting = (startTime) => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    // Update current time every 30 seconds
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const joinStatus = useMemo(() => {
    if (!startTime) {
      return {
        canJoin: false,
        timeUntil: null,
        message: 'No appointment time'
      };
    }

    const now = new Date(currentTime);
    const appointmentTime = new Date(startTime);
    const timeDiff = appointmentTime - now;
    const timeDiffSeconds = Math.floor(timeDiff / 1000);

    // Can join 15 minutes (900 seconds) before appointment
    const joinWindowSeconds = 15 * 60;

    if (timeDiffSeconds < 0) {
      // Appointment has passed
      return {
        canJoin: false,
        timeUntil: 0,
        message: 'Appointment has ended'
      };
    } else if (timeDiffSeconds <= joinWindowSeconds) {
      // Within join window
      return {
        canJoin: true,
        timeUntil: timeDiffSeconds,
        message: 'Ready to join'
      };
    } else {
      // Too early
      const minutesUntil = Math.ceil((timeDiffSeconds - joinWindowSeconds) / 60);
      return {
        canJoin: false,
        timeUntil: timeDiffSeconds,
        message: `Available in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`
      };
    }
  }, [startTime, currentTime]);

  return joinStatus;
};
