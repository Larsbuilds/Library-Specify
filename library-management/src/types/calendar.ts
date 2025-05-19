// Calendar types as defined in the Prolog spec
export interface CalendarEntry {
  id: string;
  date: string;
  type: 'due_date' | 'holiday' | 'system_maintenance';
  description: string;
  affectedServices?: string[];  // e.g., ['loans', 'returns']
  operation: CalendarOperation;
}

// Operation types from spec (lib42-47)
export type CalendarOperation = 
  | { type: 'read-only'; name: 'sys_calendar_current'; constraintId: 'lib42' | 'lib43' | 'lib44' }
  | { type: 'insertion'; name: 'sys_calendar_add'; constraintId: 'lib45' }
  | { type: 'amendment'; name: 'sys_calendar_modify'; constraintId: 'lib46' }
  | { type: 'deletion'; name: 'sys_calendar_delete'; constraintId: 'lib47' };

// Calendar state type
export interface CalendarState {
  currentCalendar: {
    currentDate: string; // ISO string
    lastModified: string;
    lastOperation: CalendarOperation | null;
  };
  entries: CalendarEntry[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}
