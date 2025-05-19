export * from './loanTypes';

export interface Book {
  id: string;
  title: string;
  isbn: string;
  available: boolean;
  currentStatus: 'available' | 'loaned' | 'deleted';
  operation?: {
    type: 'insertion' | 'deletion' | 'amendment' | 'read-only';
    name: 'book_purchase' | 'book_modify' | 'book_delete' | 'book_available';
    constraintId: string; // e.g., 'lib1', 'lib15', etc.
  };
}

/**
 * Member interface reflecting constraints from ichart.pl:
 * - lib29-31: Member borrowing status tracking
 * - lib34-35: Member under/over loan limits
 */
export interface Member {
  id: string;
  name: string;
  email: string;
  totalLoans: number;
  status: 'permitted' | 'restricted' | 'suspended' | 'borrowing'; // lib28-29: Includes borrowing status
  borrowingStatus: 'under' | 'over' | null; // lib30-31: Track if member is over/under loan limit
  currentLoans: number;
  operation?: {
    type: 'insertion' | 'deletion' | 'amendment' | 'read-only';
    name: 'member_add' | 'member_modify' | 'member_delete' | 'member_borrowing' | 'member_permitted' | 'member_current';
    constraintId: string; // e.g., 'lib8', 'lib9', etc.
  };
}

// Calendar types as defined in the Prolog spec
export interface SystemCalendar {
  id: string;
  currentDate: string; // ISO date string
  lastModified: string; // ISO date string
  entries: CalendarEntry[];
}

export interface CalendarEntry {
  id: string;
  date: string; // ISO date string
  type: 'due_date' | 'holiday' | 'system_maintenance';
  description: string;
  affectedServices?: string[]; // e.g., ['loans', 'returns']
  operation?: {
    type: 'insertion' | 'deletion' | 'amendment' | 'read-only';
    name: 'sys_calendar_add' | 'sys_calendar_modify' | 'sys_calendar_delete' | 'sys_calendar_current';
    constraintId: string; // e.g., 'lib42', 'lib43', etc.
  };
}

export interface TotalLoans {
  memberId: string;
  count: number;
  lastUpdated: Date;
}
