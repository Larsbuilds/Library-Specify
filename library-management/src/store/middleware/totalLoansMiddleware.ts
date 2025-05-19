import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { TotalLoans, addTotalLoans, updateTotalLoans, deleteTotalLoans } from '../slices/totalLoansSlice';
import { Loan } from '../../types';
import { ExternalOperation, InternalOperation, OperationResult } from '../../types/operations';

type LoanAction = 
  | PayloadAction<Loan & { operation: ExternalOperation }, 'loans/addLoan'>
  | PayloadAction<Loan & { operation: ExternalOperation }, 'loans/updateLoan'>
  | PayloadAction<Loan & { operation: ExternalOperation }, 'loans/deleteLoan'>;

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

// Helper function to create operation results
const createOperationResult = <T>(success: boolean, data?: T, error?: string, operation?: ExternalOperation | InternalOperation): OperationResult<T> => ({
  success,
  data,
  error,
  operation: operation || { type: 'read-only', name: 'total_loans_current', constraintId: 'lib36' },
  constraintsSatisfied: [],
  constraintsFailed: []
});

// lib36-41: Total loans tracking system
export const totalLoansMiddleware: Middleware = (api) => (next) => (action) => {
  const result = next(action);
  
  if (!isLoanAction(action)) {
    return result;
  }

  const state = api.getState() as RootState & {
    totalLoans: { items: TotalLoans[] }
  };

  switch (action.type) {
    case 'loans/addLoan': {
      // lib36: Handle total loans addition
      const { memberId } = action.payload;
      const existingTotal = state.totalLoans.items.find(
        (total: TotalLoans) => total.id === memberId
      );

      if (existingTotal) {
        api.dispatch(updateTotalLoans({
          ...existingTotal,
          count: existingTotal.count + 1,
          lastUpdated: new Date().toISOString(),
          operation: {
            type: 'amendment',
            name: 'total_loans_modify',
            constraintId: 'lib37'
          }
        }));
      } else {
        api.dispatch(addTotalLoans({
          memberId: memberId,
          count: 1,
          lastUpdated: new Date().toISOString(),
          operation: {
            type: 'insertion',
            name: 'total_loans_add',
            constraintId: 'lib36'
          }
        }));
      }
      break;
    }
    case 'loans/updateLoan': {
      // lib37: Handle total loans modification
      const { memberId, status } = action.payload;
      const oldLoan = state.loans.items.find(loan => loan.id === action.payload.id);
      
      if (oldLoan && oldLoan.status !== status) {
        const existingTotal = state.totalLoans.items.find(
          (total: TotalLoans) => total.id === memberId
        );

        if (existingTotal) {
          let countDelta = 0;
          if (status === 'returned' && ['approved', 'overdue'].includes(oldLoan.status)) {
            countDelta = -1;
          } else if (status === 'approved' && oldLoan.status === 'requested') {
            countDelta = 1;
          }

          api.dispatch(updateTotalLoans({
            ...existingTotal,
            count: Math.max(0, existingTotal.count + countDelta),
            lastUpdated: new Date().toISOString(),
            operation: {
              type: 'amendment',
              name: 'total_loans_modify',
              constraintId: 'lib37'
            }
          }));
        }
      }
      break;
    }
    case 'loans/deleteLoan': {
      // lib38: Handle total loans deletion
      const loan = state.loans.items.find(l => l.id === action.payload.id);
      if (loan && ['approved', 'overdue'].includes(loan.status)) {
        const existingTotal = state.totalLoans.items.find(
          (total: TotalLoans) => total.id === loan.memberId
        );

        if (existingTotal) {
          if (existingTotal.count <= 1) {
            api.dispatch(deleteTotalLoans({
              id: existingTotal.id,
              operation: {
                type: 'deletion',
                name: 'total_loans_delete',
                constraintId: 'lib38'
              }
            }));
          } else {
            api.dispatch(updateTotalLoans({
              ...existingTotal,
              count: existingTotal.count - 1,
              lastUpdated: new Date().toISOString(),
              operation: {
                type: 'amendment',
                name: 'total_loans_modify',
                constraintId: 'lib37'
              }
            }));
          }
        }
      }
      break;
    }
  }

  return result;
};
