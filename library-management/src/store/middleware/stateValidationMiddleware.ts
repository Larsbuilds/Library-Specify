import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Book, Loan, Member } from '../../types';
import { updateBook } from '../slices/booksSlice';
import { updateMember } from '../slices/membersSlice';

// Constants from Prolog spec
const LOAN_DURATION_DAYS = 14;
const MAX_LOANS_ALLOWED = 5;

type ValidatedAction = 
  | PayloadAction<Book, 'books/addBook' | 'books/updateBook' | 'books/deleteBook'>
  | PayloadAction<Member, 'members/addMember' | 'members/updateMember' | 'members/deleteMember'>
  | PayloadAction<Loan, 'loans/addLoan' | 'loans/updateLoan' | 'loans/deleteLoan'>;

const validateBookState = (state: RootState, book: Book) => {
  // lib02: Book current state must be consistent with availability
  if (book.currentStatus === 'available' && !book.available) {
    throw new Error('Book state inconsistency: available status does not match availability');
  }

  // lib17: Book current state must be consistent with purchase history
  const bookExists = state.books.items.some(b => b.id === book.id);
  if (!bookExists && book.currentStatus !== 'available') {
    throw new Error('New book must be in available state');
  }
};

const validateMemberState = (state: RootState, member: Member) => {
  const activeLoans = state.loans.items.filter(
    loan => loan.memberId === member.id &&
    ['requested', 'approved', 'overdue'].includes(loan.status)
  ).length;

  // lib29: Member borrowing state must be consistent with current loans
  if (member.currentLoans !== activeLoans) {
    throw new Error('Member loan count inconsistency');
  }

  // lib30, lib31: Member under/over state must be consistent with loan count
  if (activeLoans >= MAX_LOANS_ALLOWED && member.status === 'permitted') {
    throw new Error('Member should be restricted due to loan count');
  }
  if (activeLoans < MAX_LOANS_ALLOWED && member.status === 'restricted') {
    throw new Error('Member should be permitted based on loan count');
  }
};

const validateLoanState = (state: RootState, loan: Loan) => {
  // lib27: Loan approved must transition to loan current
  if (loan.status === 'approved' && !loan.approvalDate) {
    throw new Error('Approved loan must have approval date');
  }

  // lib04: Loan request must be properly approved
  if (loan.status === 'approved') {
    const member = state.members.items.find(m => m.id === loan.memberId);
    const book = state.books.items.find(b => b.id === loan.bookId);

    if (!member || member.status !== 'permitted') {
      throw new Error('Loan cannot be approved for non-permitted member');
    }
    if (!book || !book.available) {
      throw new Error('Loan cannot be approved for unavailable book');
    }
  }

  // lib05, lib06: Loan return must be properly processed
  if (loan.status === 'returned' && !loan.returnDate) {
    throw new Error('Returned loan must have return date');
  }
};

export const stateValidationMiddleware: Middleware = (api) => (next) => (action) => {
  if (!isValidatedAction(action)) {
    return next(action);
  }

  const state = api.getState() as RootState;

  try {
    switch (true) {
      case action.type.startsWith('books/'):
        validateBookState(state, action.payload as Book);
        break;
      case action.type.startsWith('members/'):
        validateMemberState(state, action.payload as Member);
        break;
      case action.type.startsWith('loans/'):
        validateLoanState(state, action.payload as Loan);
        break;
    }
  } catch (error) {
    console.error('State validation error:', error instanceof Error ? error.message : 'Unknown error');
    return;
  }

  const result = next(action);

  // Post-action validation and state updates
  const newState = api.getState() as RootState;

  // Update book availability based on loan status changes
  if (action.type === 'loans/updateLoan') {
    const loan = action.payload as Loan;
    const book = newState.books.items.find(b => b.id === loan.bookId);
    if (book) {
      if (loan.status === 'returned') {
        api.dispatch(updateBook({
          ...book,
          available: true,
          currentStatus: 'available',
          operation: {
            type: 'amendment',
            name: 'book_modify',
            constraintId: 'lib7'
          }
        }));
      } else if (loan.status === 'approved') {
        api.dispatch(updateBook({
          ...book,
          available: false,
          currentStatus: 'on_loan',
          operation: {
            type: 'amendment',
            name: 'book_modify',
            constraintId: 'lib7'
          }
        }));
      }
    }
  }

  // Update member status based on loan count changes
  if (action.type.startsWith('loans/')) {
    const loan = action.payload as Loan;
    const member = newState.members.items.find(m => m.id === loan.memberId);
    if (member) {
      const activeLoans = newState.loans.items.filter(
        l => l.memberId === member.id &&
        ['requested', 'approved', 'overdue'].includes(l.status)
      ).length;

      const newStatus = activeLoans >= MAX_LOANS_ALLOWED ? 'restricted' : 'permitted';
      if (member.status !== newStatus) {
        api.dispatch(updateMember({
          ...member,
          status: newStatus,
          operation: {
            type: 'amendment',
            name: 'member_modify',
            constraintId: 'lib31'
          }
        }));
      }
    }
  }

  return result;
};

function isValidatedAction(action: unknown): action is ValidatedAction {
  if (typeof action !== 'object' || !action || !('type' in action)) return false;
  const type = (action as { type: string }).type;
  return (
    type.startsWith('books/') ||
    type.startsWith('members/') ||
    type.startsWith('loans/')
  );
}
