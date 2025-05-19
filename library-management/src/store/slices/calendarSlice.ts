import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CalendarEntry, CalendarOperation } from '../../types/calendar';

interface CalendarState {
  // lib42-44: Current calendar state tracking
  currentCalendar: {
    currentDate: string; // ISO string
    lastModified: string;
    lastOperation: CalendarOperation | null;
  };
  // lib45-47: Calendar entries management
  entries: CalendarEntry[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: CalendarState = {
  currentCalendar: {
    currentDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    lastOperation: null,
  },
  entries: [],
  loading: false,
  error: null,
  initialized: false,
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    // Initialize calendar system
    initializeCalendar: (state) => {
      state.initialized = true;
      state.currentCalendar.lastOperation = {
        type: 'read-only',
        name: 'sys_calendar_current',
        constraintId: 'lib42'
      };
    },

    // lib45: Add calendar entry
    addEntry: (state, action: PayloadAction<Omit<CalendarEntry, 'operation'> & { operation?: CalendarOperation }>) => {
      const operation: CalendarOperation = action.payload.operation || {
        type: 'insertion',
        name: 'sys_calendar_add',
        constraintId: 'lib45'
      };
      
      const entry = {
        ...action.payload,
        operation
      };
      
      state.entries.push(entry);
      state.entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      state.currentCalendar.lastModified = new Date().toISOString();
      state.currentCalendar.lastOperation = operation;
    },

    // lib46: Modify calendar entry
    updateEntry: (state, action: PayloadAction<Omit<CalendarEntry, 'operation'> & { operation?: CalendarOperation }>) => {
      const operation: CalendarOperation = action.payload.operation || {
        type: 'amendment',
        name: 'sys_calendar_modify',
        constraintId: 'lib46'
      };
      
      const index = state.entries.findIndex(entry => entry.id === action.payload.id);
      if (index !== -1) {
        state.entries[index] = {
          ...action.payload,
          operation
        };
        state.entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        state.currentCalendar.lastModified = new Date().toISOString();
        state.currentCalendar.lastOperation = operation;
      }
    },

    // lib47: Delete calendar entry
    deleteEntry: (state, action: PayloadAction<{ id: string; operation?: CalendarOperation }>) => {
      const operation: CalendarOperation = action.payload.operation || {
        type: 'deletion',
        name: 'sys_calendar_delete',
        constraintId: 'lib47'
      };
      
      state.entries = state.entries.filter(entry => entry.id !== action.payload.id);
      state.currentCalendar.lastModified = new Date().toISOString();
      state.currentCalendar.lastOperation = operation;
    },

    // lib42-44: Update current calendar state
    updateCurrentDate: (state, action: PayloadAction<{ date: string; operation?: CalendarOperation }>) => {
      const operation: CalendarOperation = action.payload.operation || {
        type: 'read-only',
        name: 'sys_calendar_current',
        constraintId: 'lib42'
      };
      
      state.currentCalendar.currentDate = action.payload.date;
      state.currentCalendar.lastModified = new Date().toISOString();
      state.currentCalendar.lastOperation = operation;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { 
  initializeCalendar,
  addEntry,
  updateEntry, 
  deleteEntry,
  updateCurrentDate,
  setLoading,
  setError
} = calendarSlice.actions;

export default calendarSlice.reducer;
