import { Middleware, PayloadAction, createListenerMiddleware } from '@reduxjs/toolkit';
import { RootState } from '..';
import { updateMember } from '../slices/membersSlice';
import { updateBook } from '../slices/booksSlice';
import { Member, Loan, Book } from '../../types';
import { MemberBorrowingStatus, MAX_LOANS_PER_MEMBER } from '../../types/memberTypes';
import { ExternalOperation, InternalOperation, OperationResult, BookOperation, MemberOperation } from '../../types/operations';
import { validateChartOperation } from '../../types/chartOperations';

const MAX_LOANS_THRESHOLD = 5;

type LoanAction = 
  | { type: 'loans/addLoan'; payload: Loan & { operation: ExternalOperation } }
  | { type: 'loans/updateLoan'; payload: Loan & { operation: ExternalOperation } }
  | { type: 'loans/deleteLoan'; payload: { id: string; operation: ExternalOperation } };

// Helper function to create operation results
const createOperationResult = <T>(success: boolean, data?: T, error?: string, operation?: ExternalOperation | InternalOperation): OperationResult<T> => ({
  success,
  data,
  error,
  operation: operation || { type: 'read-only', name: 'loan_current', constraintId: 'lib27' },
  constraintsSatisfied: [],
  constraintsFailed: []
});

// Helper function to determine member borrowing status
function getMemberBorrowingStatus(currentLoans: number): Member['status'] {
  if (currentLoans === 0) {
    return 'permitted';
  } else if (currentLoans >= MAX_LOANS_THRESHOLD) {
    return 'restricted';
  } else {
    return 'permitted';
  }
}

// Helper function to validate loan actions
function isLoanAction(action: unknown): action is LoanAction {
  const validTypes = ['loans/addLoan', 'loans/updateLoan', 'loans/deleteLoan'];
  return (
    action != null &&
    typeof action === 'object' &&
    'type' in action &&
    typeof action.type === 'string' &&
    validTypes.includes(action.type)
  );
}

const validateLoanStatus = (state: RootState, loan: Loan & { operation: ExternalOperation }) => {
  const oldLoan = state.loans.items.find(l => l.id === loan.id);
  
  switch (loan.status) {
    case 'requested': {
      // lib20: book_available -> loan_request (read-only)
      const book = state.books.items.find(b => b.id === loan.bookId);
      if (!book?.available) {
        throw new Error('Cannot request unavailable book');
      }
      break;
    }
    case 'approved': {
      // lib04: loan_request -> loan_approved (insertion)
      if (!oldLoan || oldLoan.status !== 'requested') {
        throw new Error('Can only approve requested loans');
      }
      break;
    }
    case 'returned': {
      // lib05: loan_approved -> loan_returned (read-only)
      if (!oldLoan || !['approved', 'overdue'].includes(oldLoan.status)) {
        throw new Error('Can only return approved or overdue loans');
      }
      break;
    }
    case 'overdue': {
      // Related to lib05: only approved loans can become overdue
      if (!oldLoan || oldLoan.status !== 'approved') {
        throw new Error('Can only mark approved loans as overdue');
      }
      break;
    }
  }
};

export const loanStatusMiddleware: Middleware = (api) => (next) => (action) => {
  const result = next(action);
  const state = api.getState() as RootState;

  if (!isLoanAction(action)) {
    return result;
  }

  try {
    switch (action.type) {
      case 'loans/addLoan': {
        const { memberId, bookId } = action.payload;
        
        // lib20: book_available -> loan_request (read-only)
        const book = state.books.items.find(b => b.id === bookId);
        
        // lib27: loan_approved -> loan_current (normal)
        // This is handled by updating the loans state automatically
        if (!book || !book.available) {
          throw new Error('Book is not available for loan');
        }

        // lib3: Check if member is permitted to borrow
        const member = state.members.items.find(m => m.id === memberId);
        if (!member || member.borrowingStatus !== 'under') {
          throw new Error('Member is over loan limit and not permitted to borrow');
        }

        // lib32-33: Check total loans for member
        const totalLoans = state.totalLoans.items.find(t => t.memberId === memberId);
        if (totalLoans) {
          // lib30: Check if member is under limit
          if (totalLoans.count >= MAX_LOANS_THRESHOLD) {
            throw new Error('Member has reached maximum loan limit');
          }
        }

        // Update book availability (lib07)
        const chartOp = validateChartOperation('loan_approved', 'loan_approved', 'book_available');
        if (!chartOp) {
          throw new Error('Invalid book availability operation');
        }

        api.dispatch(updateBook({
          ...book,
          available: false,
          currentStatus: 'on_loan',
          operation: {
            type: 'amendment',
            name: 'book_modify',
            constraintId: 'lib7'
          }
        } as Book & { operation: BookOperation }));

        // lib28-31: Update member's borrowing status and loan count
        const currentLoans = state.loans.items.filter(
          loan => loan.memberId === memberId &&
          ['requested', 'approved', 'overdue'].includes(loan.status)
        ).length;

        // lib30, lib31: Update member status based on loan count
        const newStatus = getMemberBorrowingStatus(currentLoans + 1);

        api.dispatch(updateMember({
          ...member,
          currentLoans: currentLoans + 1,
          borrowingStatus: currentLoans + 1 >= MAX_LOANS_PER_MEMBER ? MemberBorrowingStatus.OVER_LIMIT : MemberBorrowingStatus.UNDER_LIMIT,
          updatedAt: new Date().toISOString(),
          operation: {
            type: 'amendment',
            name: 'member_modify',
            constraintId: 'lib31'
          }
        }));
        break;
      }
      case 'loans/updateLoan': {
        const { id, status } = action.payload;
        const loan = state.loans.items.find(l => l.id === id);
        if (!loan) {
          throw new Error('Loan not found');
        }

        // lib27: loan_approved -> loan_current (normal)
        if (status === 'approved') {
          // Update loan_current state automatically
          api.dispatch({
            type: 'loans/setCurrentLoan',
            payload: {
              loanId: id,
              operation: {
                type: 'normal',
                name: 'loan_current',
                constraintId: 'lib27'
              }
            }
          });

          // lib28: loan_current -> member_borrowing (insertion)
          api.dispatch({
            type: 'members/updateBorrowingStatus',
            payload: {
              memberId: loan.memberId,
              operation: {
                type: 'insertion',
                name: 'member_borrowing',
                constraintId: 'lib28'
              }
            }
          });
        }

        validateLoanStatus(state, action.payload);

        if (status === 'returned') {
          const member = state.members.items.find(m => m.id === loan.memberId);
          if (!member) {
            throw new Error('Member not found');
          }

          const currentLoans = state.loans.items.filter(
            loan => loan.memberId === member.id &&
            ['requested', 'approved', 'overdue'].includes(loan.status)
          ).length;

          const newStatus = getMemberBorrowingStatus(currentLoans - 1);

          api.dispatch(updateMember({
            ...member,
            currentLoans: currentLoans - 1,
            borrowingStatus: currentLoans - 1 >= MAX_LOANS_PER_MEMBER ? MemberBorrowingStatus.OVER_LIMIT : MemberBorrowingStatus.UNDER_LIMIT,
            updatedAt: new Date().toISOString(),
            operation: {
              type: 'amendment',
              name: 'member_modify',
              constraintId: 'lib31'
            }
          }));
        }
        break;
      }
    }
  } catch (error) {
    console.error('Loan status middleware error:', error);
    throw error;
  }

  return result;
};
