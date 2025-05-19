// Loan status type
export type LoanStatus = 'requested' | 'approved' | 'returned' | 'overdue' | 'current';

// Operation types
export type LoanOperationType = 'insertion' | 'deletion' | 'amendment' | 'read-only' | 'normal';
export type LoanOperationName = 'loan_request' | 'loan_approved' | 'loan_returned' | 'loan_current' | 'loan_modify' | 'loan_delete';

export interface LoanOperation {
  type: LoanOperationType;
  name: LoanOperationName;
  constraintId: string;
}

export interface Loan {
  id: string;
  bookId: string;
  memberId: string;
  requestDate: Date;
  approvalDate?: Date;
  returnDate?: Date;
  status: LoanStatus;
  operation?: LoanOperation;
}
