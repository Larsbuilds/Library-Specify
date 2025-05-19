import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { updateMember } from '../slices/membersSlice';
import { updateLoan } from '../slices/loansSlice';
import { Member, MemberBorrowingStatus, MAX_LOANS_PER_MEMBER } from '../../types/memberTypes';
import { Loan, LoanStatus } from '../../types/loanTypes';

type LoanUpdatePayload = Loan;

export const memberBorrowingMiddleware: Middleware = (api) => (next) => (action) => {
  const result = next(action);
  const state = api.getState() as RootState;

  // Type guard for loan update action
  const isLoanUpdateAction = (action: unknown): action is PayloadAction<LoanUpdatePayload> => {
    return action !== null && 
           typeof action === 'object' && 
           'type' in action && 
           action.type === updateLoan.type && 
           'payload' in action;
  };

  if (isLoanUpdateAction(action)) {
    const { memberId, status } = action.payload;
    const member = state.members.items.find(m => m.id === memberId);

    if (member) {
      // lib28, lib29: Update member borrowing status when loan becomes current
      const loanStatus = status as LoanStatus;
      if (loanStatus === 'current' || loanStatus === 'approved') {
        api.dispatch(updateMember({
          ...member,
          borrowingStatus: MemberBorrowingStatus.UNDER_LIMIT,
          currentLoans: member.currentLoans + 1,
          operation: {
            type: 'normal',
            name: 'member_permitted',
            constraintId: 'lib29'
          }
        }));
      }
      
      // Update member status when loan is returned
      if (status === 'returned') {
        const updatedLoans = member.currentLoans - 1;
        api.dispatch(updateMember({
          ...member,
          currentLoans: updatedLoans,
          borrowingStatus: updatedLoans >= MAX_LOANS_PER_MEMBER ? MemberBorrowingStatus.OVER_LIMIT : MemberBorrowingStatus.UNDER_LIMIT,
          operation: {
            type: 'normal',
            name: 'member_permitted',
            constraintId: 'lib29'
          }
        }));
      }
    }
  }

  return result;
};
