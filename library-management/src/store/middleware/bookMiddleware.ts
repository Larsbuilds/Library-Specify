import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { Book } from '../../types';
import { BookOperation } from '../../types/operations';
import { RootState } from '..';

type BookAction = 
  | PayloadAction<Book & { operation: BookOperation }, 'books/addBook'>
  | PayloadAction<Book & { operation: BookOperation }, 'books/updateBook'>
  | PayloadAction<{ id: string; operation: BookOperation }, 'books/deleteBook'>
  | PayloadAction<{ id: string; available: boolean; operation: BookOperation }, 'books/setBookAvailability'>;

function isBookAction(action: unknown): action is BookAction {
  if (!action || typeof action !== 'object' || !('type' in action)) {
    return false;
  }

  const validTypes = [
    'books/addBook',           // lib1
    'books/updateBook',        // lib15
    'books/deleteBook',        // lib16
    'books/setBookAvailability' // lib2
  ];
  return validTypes.includes((action as { type: string }).type);
}

const validateBookAction = (state: RootState, action: BookAction) => {
  const { loans } = state;

  switch (action.type) {
    case 'books/deleteBook': {
      // lib19: Check if book can be deleted
      const hasActiveLoans = loans.items.some(loan => 
        loan.bookId === action.payload.id && 
        ['pending', 'approved'].includes(loan.status)
      );
      if (hasActiveLoans) {
        throw new Error('Cannot delete book with active loans');
      }
      break;
    }

    case 'books/updateBook': {
      // lib18: Check if book can be modified
      const book = state.books.items.find(b => b.id === action.payload.id);
      if (!book) {
        throw new Error('Book not found');
      }
      // lib20: Check if book is available for modification
      const hasActiveLoans = loans.items.some(loan => 
        loan.bookId === action.payload.id && 
        ['pending', 'approved'].includes(loan.status)
      );
      if (hasActiveLoans) {
        throw new Error('Cannot modify book with active loans');
      }
      break;
    }

    case 'books/setBookAvailability': {
      // lib2: Check book availability transition
      const book = state.books.items.find(b => b.id === action.payload.id);
      if (!book) {
        throw new Error('Book not found');
      }
      // lib7: Check loan status for availability change
      if (!action.payload.available) {
        const hasActiveLoans = loans.items.some(loan => 
          loan.bookId === action.payload.id && 
          loan.status === 'approved'
        );
        if (!hasActiveLoans) {
          throw new Error('Cannot mark book as unavailable without active loan');
        }
      } else {
        const hasActiveLoans = loans.items.some(loan => 
          loan.bookId === action.payload.id && 
          loan.status === 'approved'
        );
        if (hasActiveLoans) {
          throw new Error('Cannot mark book as available with active loan');
        }
      }
      break;
    }

    case 'books/addBook': {
      // lib17: Check if book can be added
      const existingBook = state.books.items.find(
        b => b.isbn === (action.payload as Book).isbn
      );
      if (existingBook) {
        throw new Error('Book with this ISBN already exists');
      }
      break;
    }
  }
};

export const bookMiddleware: Middleware = (api) => (next) => (action) => {
  if (!isBookAction(action)) {
    return next(action);
  }

  const state = api.getState() as RootState;

  try {
    validateBookAction(state, action);
  } catch (error) {
    console.error('Book constraint violation:', error);
    return;
  }

  return next(action);
};
