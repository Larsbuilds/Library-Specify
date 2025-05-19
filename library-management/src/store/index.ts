import { configureStore, Middleware } from '@reduxjs/toolkit';
import booksReducer from './slices/booksSlice';
import membersReducer from './slices/membersSlice';
import loansReducer from './slices/loansSlice';
import calendarReducer from './slices/calendarSlice';
import totalLoansReducer from './slices/totalLoansSlice';
import { calendarMiddleware } from './middleware/calendarMiddleware';
import { constraintMiddleware } from './middleware/constraintMiddleware';
import { loanStatusMiddleware } from './middleware/loanStatusMiddleware';
import { totalLoansMiddleware } from './middleware/totalLoansMiddleware';
import { memberBorrowingMiddleware } from './middleware/memberBorrowingMiddleware';

export interface RootState {
  books: ReturnType<typeof booksReducer>;
  members: ReturnType<typeof membersReducer>;
  loans: ReturnType<typeof loansReducer>;
  calendar: ReturnType<typeof calendarReducer>;
  totalLoans: ReturnType<typeof totalLoansReducer>;
}

const rootReducer = {
  books: booksReducer,
  members: membersReducer,
  loans: loansReducer,
  calendar: calendarReducer,
  totalLoans: totalLoansReducer,
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      calendarMiddleware as Middleware,
      constraintMiddleware as Middleware,
      loanStatusMiddleware as Middleware,
      totalLoansMiddleware as Middleware,
      memberBorrowingMiddleware as Middleware
    ),
});

export type AppDispatch = typeof store.dispatch;
