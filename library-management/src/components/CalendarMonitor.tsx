import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { initializeCalendar, updateCurrentDate } from '../store/slices/calendarSlice';

// Check calendar state every 1 hour
const CHECK_INTERVAL = 60 * 60 * 1000;

const CalendarMonitor: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize calendar system
    dispatch(initializeCalendar());

    // Initial update of current date
    dispatch(updateCurrentDate({
      date: new Date().toISOString(),
      operation: {
        type: 'read-only',
        name: 'sys_calendar_current',
        constraintId: 'lib42'
      }
    }));

    // Set up periodic date updates
    const intervalId = setInterval(() => {
      dispatch(updateCurrentDate({
        date: new Date().toISOString(),
        operation: {
          type: 'read-only',
          name: 'sys_calendar_current',
          constraintId: 'lib42'
        }
      }));
    }, CHECK_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [dispatch]);

  return null; // This is a utility component, it doesn't render anything
};

export default CalendarMonitor;
