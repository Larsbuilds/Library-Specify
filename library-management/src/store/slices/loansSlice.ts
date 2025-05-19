import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Loan, LoanStatus, LoanOperation } from '../../types/loanTypes';
import { Book } from '../../types';
import { RootState } from '..';
import { MAX_LOANS_PER_MEMBER } from '../../types/memberTypes';

/**
 * Loan Management Constraints from ichart.pl:
 * - lib03: Member permission check for loan requests
 * - lib04: Loan request → loan approved transition
 * - lib05: Loan approved → loan returned transition
 * - lib07: Book availability inversion on loan/return
 * - lib20: Book availability check for loan requests
 * - lib22: Loan current → loan modify (read-only)
 * - lib23: Loan current → loan delete (read-only)
 * - lib24: Loan modify → loan current (amendment)
 * - lib25: Loan delete → loan current (deletion)
 * - lib27: Loan approved → loan current (normal)
 * - lib28: Loan current → member borrowing (insertion)
 */

interface LoansState {
  items: Loan[];
  loading: boolean;
  error: string | null;
  lastOperation: LoanOperation | null;
  totalLoansByMember: Record<string, number>; // Track total loans per member for lib32-33
}

const initialState: LoansState = {
  items: [],
  loading: false,
  error: null,
  lastOperation: null,
  totalLoansByMember: {},
};

// Validation functions for loan state transitions
/**
 * lib20: Validate book is available for loan request
 * lib32-33: Check member's total loans against limits
 */
const validateLoanRequest = (state: LoansState, book: Book | undefined, memberId: string) => {
  if (!book) {
    throw new Error('Book not found');
  }
  
  // lib20: Validate book is available for loan request
  if (!book.available) {
    throw new Error('lib20: Book is not available for loan');
  }

  // lib32-33: Check total loans limit
  const memberTotalLoans = state.totalLoansByMember[memberId] || 0;
  if (memberTotalLoans >= MAX_LOANS_PER_MEMBER) {
    throw new Error('lib33: Member has reached maximum loan limit');
  }
};

const validateLoanApproval = (state: LoansState, loan: Loan) => {
  // lib04: Validate loan request → loan approved transition
  if (loan.status !== 'requested') {
    throw new Error('Only requested loans can be approved');
  }
  
  // lib27: After approval, loan should become current
  if (!loan.approvalDate) {
    throw new Error('Approval date is required');
  }
};

const validateLoanReturn = (state: LoansState, loan: Loan) => {
  // lib05: Validate loan approved → loan returned transition
  if (loan.status !== 'approved') {
    throw new Error('Only approved loans can be returned');
  }
};

const loansSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    setLoans: (state, action: PayloadAction<Loan[]>) => {
      state.items = action.payload;
    },
    // lib03: Add loan request
    /**
     * lib03: Add loan request
     * lib28: Update member borrowing status
     */
    addLoan: (state, action: PayloadAction<Loan & { operation: LoanOperation }>) => {
      const { operation, ...loan } = action.payload;
      
      try {
        // lib28-31: Update member borrowing tracking
        const memberId = loan.memberId;
        const currentLoans = state.totalLoansByMember[memberId] || 0;
        const newTotalLoans = currentLoans + 1;
        
        // lib32-33: Validate against maximum loans
        if (newTotalLoans > MAX_LOANS_PER_MEMBER) {
          throw new Error('Member would exceed maximum loan limit');
        }
        
        state.items.push(loan);
        state.lastOperation = operation;
        state.totalLoansByMember[memberId] = newTotalLoans;
      } catch (error) {
        state.error = (error as Error).message;
      }
    },
    // lib04, lib05, lib27: Update loan status (approval, current, or return)
    /**
     * lib04: Loan request → approved transition
     * lib05: Loan approved → returned transition
     * lib27: Loan approved → current transition
     */
    updateLoan: (state, action: PayloadAction<Omit<Loan, 'status'> & { status: LoanStatus; operation: LoanOperation }>) => {
      const { operation, ...loan } = action.payload;
      const index = state.items.findIndex((l) => l.id === loan.id);
      
      if (index !== -1) {
        const currentLoan = state.items[index];
        
        try {
          if (loan.status === 'approved') {
            validateLoanApproval(state, currentLoan);
            // lib27: Set loan to current after approval
            // lib27: Set loan to current after approval
            state.items[index] = {
              ...loan,
              status: 'current',
              operation: {
                type: 'normal',
                name: 'loan_current',
                constraintId: 'lib27'
              }
            };
          } else if (loan.status === 'returned') {
            validateLoanReturn(state, currentLoan);
          }
          
          state.lastOperation = operation;
          state.error = null;
        } catch (error) {
          state.error = (error as Error).message;
        }
      }
    },
    // lib25: Delete loan
    /**
     * lib25: Delete loan (only returned loans)
     * lib28: Update member borrowing status
     */
    deleteLoan: (state, action: PayloadAction<{ id: string; memberId: string; operation: LoanOperation }>) => {
      const { operation, id, memberId } = action.payload;
      const loan = state.items.find(l => l.id === id);
      
      if (!loan) {
        throw new Error('Loan not found');
      }
      
      if (loan.status === 'returned') {
        // lib28-31: Update member borrowing tracking
        const currentLoans = state.totalLoansByMember[memberId] || 0;
        if (currentLoans > 0) {
          state.totalLoansByMember[memberId] = currentLoans - 1;
        }
        
        state.items = state.items.filter(loan => loan.id !== id);
        state.lastOperation = operation;
        state.error = null;
      } else {
        state.error = 'Can only delete returned loans';
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setLoans, addLoan, updateLoan, deleteLoan, setLoading, setError } = loansSlice.actions;
export default loansSlice.reducer;
