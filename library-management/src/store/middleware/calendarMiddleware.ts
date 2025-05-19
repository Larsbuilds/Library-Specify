import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { addEntry, updateEntry, deleteEntry } from '../slices/calendarSlice';
import { Loan, Book } from '../../types';
import { CalendarEntry, CalendarOperation } from '../../types/calendar';
import { updateLoan } from '../slices/loansSlice';
import { RootState } from '..';

const LOAN_DURATION_DAYS = 14;
const REMINDER_BEFORE_DUE_DAYS = 2;

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const createCalendarEntry = (type: CalendarEntry['type'], description: string, date: string, affectedServices?: string[]): CalendarEntry => ({
  id: uuidv4(),
  type,
  description,
  date,
  affectedServices,
  operation: {
    type: 'insertion',
    name: 'sys_calendar_add',
    constraintId: 'lib45'
  }
});

type CalendarAction = 
  | PayloadAction<CalendarEntry & { operation: CalendarOperation }, 'calendar/addEntry'>
  | PayloadAction<CalendarEntry & { operation: CalendarOperation }, 'calendar/updateEntry'>
  | PayloadAction<{ id: string; operation: CalendarOperation }, 'calendar/deleteEntry'>
  | PayloadAction<{ date: string; operation: CalendarOperation }, 'calendar/updateCurrentDate'>
  | PayloadAction<Loan, 'loans/addLoan'>
  | PayloadAction<Loan, 'loans/updateLoan'>
  | PayloadAction<Book, 'books/addBook'>;

function isCalendarAction(action: unknown): action is CalendarAction {
  if (!action || typeof action !== 'object' || !('type' in action)) {
    return false;
  }

  const validTypes = [
    'calendar/addEntry',      // lib45
    'calendar/updateEntry',   // lib46
    'calendar/deleteEntry',   // lib47
    'calendar/updateCurrentDate', // lib42-44
    'loans/addLoan',
    'loans/updateLoan',
    'books/addBook'
  ];
  return validTypes.includes((action as { type: string }).type);
}

const validateCalendarAction = (state: RootState, action: CalendarAction) => {
  const { lastOperation, lastModified } = state.calendar.currentCalendar;
  const now = new Date();
  const lastModifiedDate = new Date(lastModified);
  const timeSinceLastModification = now.getTime() - lastModifiedDate.getTime();
  const MIN_ACTION_INTERVAL = 1000; // 1 second minimum between actions

  switch (action.type) {
    case 'calendar/addEntry': {
      // lib45: Validate add entry operation
      const operation = action.payload.operation || {
        type: 'insertion',
        name: 'sys_calendar_add',
        constraintId: 'lib45'
      };
      if (operation.type !== 'insertion') {
        throw new Error('Invalid operation type for calendar entry addition');
      }
      if (lastOperation?.type === 'insertion' && timeSinceLastModification < MIN_ACTION_INTERVAL) {
        throw new Error('Cannot perform consecutive additions');
      }
      break;
    }

    case 'calendar/updateEntry': {
      // lib46: Validate modify entry operation
      const operation = action.payload.operation || {
        type: 'amendment',
        name: 'sys_calendar_modify',
        constraintId: 'lib46'
      };
      if (operation.type !== 'amendment') {
        throw new Error('Invalid operation type for calendar entry modification');
      }
      if (lastOperation?.type === 'amendment' && timeSinceLastModification < MIN_ACTION_INTERVAL) {
        throw new Error('Cannot perform consecutive modifications');
      }
      break;
    }

    case 'calendar/deleteEntry': {
      // lib47: Validate delete entry operation
      const operation = action.payload.operation || {
        type: 'deletion',
        name: 'sys_calendar_delete',
        constraintId: 'lib47'
      };
      if (operation.type !== 'deletion') {
        throw new Error('Invalid operation type for calendar entry deletion');
      }
      if (lastOperation?.type === 'deletion' && timeSinceLastModification < MIN_ACTION_INTERVAL) {
        throw new Error('Cannot perform consecutive deletions');
      }
      break;
    }

    case 'calendar/updateCurrentDate': {
      // lib42-44: Validate current calendar state operations
      const operation = action.payload.operation || {
        type: 'read-only',
        name: 'sys_calendar_current',
        constraintId: 'lib42'
      };
      if (operation.type !== 'read-only') {
        throw new Error('Invalid operation type for calendar state update');
      }
      break;
    }
  }
};

export const calendarMiddleware: Middleware = (api) => (next) => (action) => {
  if (!isCalendarAction(action)) {
    return next(action);
  }

  const state = api.getState() as RootState;

  try {
    // Validate calendar actions before processing
    if (action.type.startsWith('calendar/')) {
      validateCalendarAction(state, action);
    }
  } catch (error) {
    console.error('Calendar constraint violation:', error);
    return;
  }

  const result = next(action);

  switch (action.type) {
    case 'loans/addLoan': {
      if (action.payload.approvalDate) {
        const dueDate = addDays(action.payload.approvalDate, LOAN_DURATION_DAYS);
        
        // Add due date entry with lib45 constraint
        api.dispatch(addEntry({
          ...createCalendarEntry(
            'due_date',
            `Loan due for ${action.payload.id}`,
            dueDate,
            ['loans', 'returns']
          ),
          operation: {
            type: 'insertion',
            name: 'sys_calendar_add',
            constraintId: 'lib45'
          }
        }));
      }
      return result;
    }
    case 'loans/updateLoan': {
      const { id, status, returnDate } = action.payload;
      const oldLoan = state.loans.items.find(loan => loan.id === id);

      if (oldLoan?.status !== status && status === 'returned' && returnDate) {
        // Add return entry with lib45 constraint
        api.dispatch(addEntry({
          ...createCalendarEntry(
            'due_date',
            `Loan returned for ${id}`,
            returnDate,
            ['returns']
          ),
          operation: {
            type: 'insertion',
            name: 'sys_calendar_add',
            constraintId: 'lib45'
          }
        }));
      }
      return result;
    }
    case 'books/addBook': {
      // Add book addition entry with lib45 constraint
      api.dispatch(addEntry({
        ...createCalendarEntry(
          'system_maintenance',
          `Book added: ${action.payload.id}`,
          new Date().toISOString(),
          ['books']
        ),
        operation: {
          type: 'insertion',
          name: 'sys_calendar_add',
          constraintId: 'lib45'
        }
      }));
      return result;
    }

    default:
      return result;
  }
};
