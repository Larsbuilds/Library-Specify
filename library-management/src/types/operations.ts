// Operations and constraints as defined in the Prolog spec

// Base operation type
export interface BaseOperation {
  type: 'insertion' | 'deletion' | 'amendment' | 'read-only' | 'inversion' | 'normal';
  constraintId: string;
}

// lib1-lib5: Book operations
export interface BookOperation extends BaseOperation {
  name: 'book_purchase' | 'book_delete' | 'book_modify' | 'book_available' | 'book_current';
}

// Member operations from ichart.pl
export interface MemberOperation extends BaseOperation {
  name: 'member_add' |        // lib10
        'member_delete' |      // lib08
        'member_modify' |      // lib09
        'member_permitted' |   // lib34-35
        'member_current' |     // lib11-13
        'member_borrowing' |   // lib28-29
        'member_under' |       // lib30
        'member_over';         // lib31
}

// lib11-lib35: Loan operations
export interface LoanOperation extends BaseOperation {
  name: 'loan_request' | 'loan_delete' | 'loan_modify' | 'loan_returned' | 'loan_approved' | 'loan_current';
}

// lib36-lib41: Total loans operations
export interface TotalLoansOperation extends BaseOperation {
  name: 'total_loans_add' | 'total_loans_modify' | 'total_loans_delete' | 'total_loans_current';
}

// lib42-lib47: Calendar operations
export interface CalendarOperation extends BaseOperation {
  name: 'sys_calendar_add' | 'sys_calendar_modify' | 'sys_calendar_delete' | 'sys_calendar_current';
}

// Legacy operation types for backward compatibility
export type ExternalOperation = LibraryOperation;
export type InternalOperation = LibraryOperation;

// Combined operation type
export type LibraryOperation = 
  | BookOperation
  | MemberOperation
  | LoanOperation
  | TotalLoansOperation
  | CalendarOperation;



// Operation result types with constraint tracking
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  operation: LibraryOperation;
  constraintsSatisfied: string[]; // List of satisfied constraint IDs
  constraintsFailed: string[];   // List of failed constraint IDs
}
