import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Book, Loan, Member } from '../../types';
import { MemberBorrowingStatus } from '../../types/memberTypes';
import { ExternalOperation, InternalOperation, OperationResult } from '../../types/operations';
import { validateChartOperation } from '../../types/chartOperations';

// Constants from spec
const MAX_LOANS_ALLOWED = 5; // Maximum loans a member can have before being marked as 'over'

type ConstrainedAction = 
  | PayloadAction<Book & { operation: ExternalOperation }, 'books/addBook' | 'books/updateBook' | 'books/deleteBook'>
  | PayloadAction<MemberActionPayload, 'members/addMember' | 'members/updateMember' | 'members/deleteMember'>
  | PayloadAction<Loan & { operation: ExternalOperation }, 'loans/addLoan' | 'loans/updateLoan' | 'loans/deleteLoan'>;

// Helper function to create operation results
const createOperationResult = <T>(success: boolean, data?: T, error?: string, operation?: ExternalOperation | InternalOperation): OperationResult<T> => ({
  success,
  data,
  error,
  operation: operation || { type: 'read-only', name: 'book_current', constraintId: 'lib17' },
  constraintsSatisfied: [],
  constraintsFailed: []
});

const validateBookConstraints = (state: RootState, action: PayloadAction<Book & { operation: ExternalOperation }>) => {
  const book = state.books.items.find(b => b.id === action.payload.id);

  switch (action.type) {
    case 'books/addBook': {
      // lib17: Validate book purchase conditions
      const existingBook = state.books.items.find(
        b => b.isbn === action.payload.isbn
      );
      if (existingBook) {
        throw new Error('Book with this ISBN already exists');
      }

      // Validate chart operation (lib1)
      const chartOp = validateChartOperation('book_purchase', 'book_purchase', 'book_current');
      if (!chartOp) {
        throw new Error('Invalid book purchase operation');
      }
      break;
    }
    case 'books/updateBook': {
      // lib18: Validate book modification conditions
      if (!book) {
        throw new Error('Cannot modify non-existent book');
      }
      if (book.currentStatus === 'on_loan' && action.payload.currentStatus !== 'on_loan') {
        throw new Error('Cannot change status of book that is currently on loan');
      }

      // Validate chart operation (lib15)
      const chartOp = validateChartOperation('book_modify', 'book_modify', 'book_current');
      if (!chartOp) {
        throw new Error('Invalid book modification operation');
      }
      break;
    }
    case 'books/deleteBook': {
      // lib19, lib21: Validate book deletion conditions
      if (!book) {
        throw new Error('Cannot delete non-existent book');
      }
      if (book.available) {
        throw new Error('Cannot delete book while it is available for loans');
      }
      if (book.currentStatus === 'on_loan') {
        throw new Error('Cannot delete book that is currently on loan');
      }
      break;
    }
  }
};

interface MemberActionPayload extends Member {
  operation: ExternalOperation;
  borrowingStatus: MemberBorrowingStatus;
}

const validateMemberConstraints = (state: RootState, action: PayloadAction<MemberActionPayload>) => {
  const member = state.members.items.find(m => m.id === action.payload.id);

  switch (action.type) {
    case 'members/deleteMember': {
      // lib14: Cannot delete member with current loans
      const hasActiveLoans = state.loans.items.some(
        loan => loan.memberId === action.payload.id && 
        ['requested', 'approved', 'overdue'].includes(loan.status)
      );
      if (hasActiveLoans) {
        throw new Error('Cannot delete member with active loans');
      }
      break;
    }
    case 'members/updateMember': {
      // lib12: Validate member modification conditions
      if (!member) {
        throw new Error('Cannot modify non-existent member');
      }
      // Check if member has active loans when changing status
      const currentLoans = state.loans.items.filter(
        loan => loan.memberId === member.id &&
        ['requested', 'approved', 'overdue'].includes(loan.status)
      ).length;

      if (currentLoans > 0 && action.payload.borrowingStatus === MemberBorrowingStatus.UNDER_LIMIT) {
        throw new Error('Cannot change member borrowing status with active loans');
      }
      break;
    }
  }
};

const validateLoanConstraints = (state: RootState, action: PayloadAction<Loan & { operation: ExternalOperation }>) => {
  const loan = state.loans.items.find(l => l.id === action.payload.id);

  switch (action.type) {
    case 'loans/addLoan': {
      // lib03: Check if member is permitted to request loans
      const member = state.members.items.find(m => m.id === action.payload.memberId);
      if (member?.borrowingStatus !== 'under') {
        throw new Error('Member is over loan limit and not permitted to request loans');
      }

      // lib20: Check if book is available
      const book = state.books.items.find(b => b.id === action.payload.bookId);
      if (!book?.available) {
        throw new Error('Book is not available for loan');
      }

      // Check member's loan count
      const memberLoans = state.loans.items.filter(
        loan => loan.memberId === action.payload.memberId &&
        ['requested', 'approved', 'overdue'].includes(loan.status)
      );
      if (memberLoans.length >= MAX_LOANS_ALLOWED) {
        throw new Error('Member has reached maximum number of allowed loans');
      }

      // Validate chart operation (lib04)
      const chartOp = validateChartOperation('loan_request', 'loan_request', 'loan_approved');
      if (!chartOp) {
        throw new Error('Invalid loan request operation');
      }
      break;
    }
    case 'loans/updateLoan': {
      // lib05: Only approved loans can be returned
      if (action.payload.status === 'returned') {
        const currentLoan = state.loans.items.find(l => l.id === action.payload.id);
        if (!currentLoan || currentLoan.status !== 'approved') {
          throw new Error('Only approved loans can be returned');
        }

        // Validate chart operation (lib05, lib06)
        const chartOp = validateChartOperation('loan_approved', 'loan_approved', 'loan_returned');
        if (!chartOp) {
          throw new Error('Invalid loan return operation');
        }
      } else if (action.payload.status === 'approved') {
        const currentLoan = state.loans.items.find(l => l.id === action.payload.id);
        if (!currentLoan || currentLoan.status !== 'requested') {
          throw new Error('Only requested loans can be approved');
        }

        // Validate chart operation (lib04)
        const chartOp = validateChartOperation('loan_request', 'loan_request', 'loan_approved');
        if (!chartOp) {
          throw new Error('Invalid loan approval operation');
        }
      }
      break;
    }
  }
};

export const constraintMiddleware: Middleware = (api) => (next) => (action) => {
  if (!isConstrainedAction(action)) {
    return next(action);
  }

  const state = api.getState() as RootState;

  // Add operation information if not present
  const addOperation = <T>(action: PayloadAction<T>): PayloadAction<T & { operation: ExternalOperation }> => ({
    ...action,
    payload: {
      ...action.payload,
      operation: (action.payload as any).operation || { 
        type: 'external',
        name: action.type.split('/')[1] as ExternalOperation['name']
      }
    }
  });

  const actionWithOperation = {
    ...action,
    payload: {
      ...action.payload,
      operation: action.payload.operation || { type: 'external', name: action.type.split('/')[1] }
    }
  } as ConstrainedAction;

  try {
    switch (true) {
      case action.type.startsWith('books/'): {
        const bookAction = addOperation(action as PayloadAction<Book>);
        validateBookConstraints(state, bookAction);
        break;
      }
      case action.type.startsWith('members/'): {
        const memberAction = addOperation(action as PayloadAction<MemberActionPayload>);
        validateMemberConstraints(state, memberAction);
        break;
      }
      case action.type.startsWith('loans/'): {
        const loanAction = addOperation(action as PayloadAction<Loan>);
        validateLoanConstraints(state, loanAction);
        break;
      }

    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Constraint violation:', error.message);
    } else {
      console.error('Constraint violation: Unknown error');
    }
    return;
  }

  return next(action);
};

function isConstrainedAction(action: unknown): action is ConstrainedAction {
  const hasOperation = (action: any): boolean => (
    action?.payload?.operation &&
    typeof action.payload.operation === 'object' &&
    'type' in action.payload.operation &&
    action.payload.operation.type === 'external' &&
    'name' in action.payload.operation
  );
  if (typeof action !== 'object' || !action || !('type' in action)) return false;
  const type = (action as { type: string }).type;
  return (
    (type.startsWith('books/') ||
    type.startsWith('members/') ||
    type.startsWith('loans/')) &&
    hasOperation(action)
  );
}
