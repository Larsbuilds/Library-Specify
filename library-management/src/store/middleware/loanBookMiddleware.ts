import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { addLoan, updateLoan } from '../slices/loansSlice';
import { updateAvailability } from '../slices/booksSlice';
import { RootState } from '..';
import { Loan } from '../../types';

type LoanAction = 
  | ReturnType<typeof addLoan>
  | ReturnType<typeof updateLoan>;

export const loanBookMiddleware: Middleware = (api) => (next) => (action) => {
  const result = next(action);
  const state = api.getState() as RootState;

  if (!isLoanAction(action)) {
    return result;
  }

  switch (action.type) {
    case addLoan.type: {
      // lib20: When a loan is requested, mark the book as unavailable
      const { bookId } = action.payload;
      api.dispatch(updateAvailability({
        id: bookId,
        available: false,
        operation: {
          type: 'inversion', // Matches spec lib07: book_available inversion operation
          name: 'book_available',
          constraintId: 'lib7'
        }
      }));
      break;
    }
    case updateLoan.type: {
      const { bookId, status } = action.payload;
      if (status === 'returned') {
        // lib07: When a loan is returned, mark the book as available again
        api.dispatch(updateAvailability({
          id: bookId,
          available: true,
          operation: {
            type: 'inversion', // Matches spec lib07: book_available inversion operation
            name: 'book_available',
            constraintId: 'lib7'
          }
        }));
      }
      break;
    }
  }

  return result;
};

function isLoanAction(action: unknown): action is LoanAction {
  if (!action || typeof action !== 'object' || !('type' in action)) {
    return false;
  }
  return action.type === addLoan.type || action.type === updateLoan.type;
}
