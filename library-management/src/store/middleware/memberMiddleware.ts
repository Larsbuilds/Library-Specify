import { Middleware, Action } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Member, MemberBorrowingStatus, MAX_LOANS_PER_MEMBER } from '../../types/memberTypes';
import { MemberOperation } from '../../types/operations';

// Define the shape of member actions
interface BaseMemberAction extends Action<`members/${string}`> {
  payload: Member & {
    operation: MemberOperation;
  };
}

// Type guard for member actions
const isMemberAction = (action: unknown): action is BaseMemberAction => {
  if (!action || typeof action !== 'object') return false;
  if (!('type' in action) || !('payload' in action)) return false;
  
  const { type, payload } = action as any;
  
  return (
    typeof type === 'string' &&
    type.startsWith('members/') &&
    payload &&
    typeof payload === 'object' &&
    'operation' in payload
  );
};

/**
 * Validates member actions against constraints from ichart.pl
 * Handles member state transitions and borrowing status
 */
const validateMemberAction = (state: RootState, action: BaseMemberAction): void => {
  const { loans } = state;
  const { payload } = action;

  switch (action.type) {
    case 'members/add': {
      // lib32-33: Check initial borrowing status
      if (payload.borrowingStatus !== MemberBorrowingStatus.UNDER_LIMIT) {
        throw new Error('New members must start with UNDER_LIMIT status');
      }
      break;
    }
    
    case 'members/delete': {
      // lib14: Cannot delete member with active loans
      const memberLoans = loans.items.filter(loan => loan.memberId === payload.id);
      if (memberLoans.length > 0) {
        throw new Error('Cannot delete member with active loans');
      }
      break;
    }
    
    case 'members/update': {
      const member = state.members.items.find(m => m.id === payload.id);
      if (!member) {
        throw new Error('Member not found');
      }

      // lib28-29: Handle borrowing status transitions
      if (member.borrowingStatus !== payload.borrowingStatus) {
        const currentLoans = loans.items.filter(loan => loan.memberId === payload.id).length;
        
        if (currentLoans > MAX_LOANS_PER_MEMBER && payload.borrowingStatus !== MemberBorrowingStatus.OVER_LIMIT) {
          throw new Error('Member must be marked as OVER_LIMIT');
        }
        
        if (currentLoans <= MAX_LOANS_PER_MEMBER && payload.borrowingStatus !== MemberBorrowingStatus.UNDER_LIMIT) {
          throw new Error('Member must be marked as UNDER_LIMIT');
        }
      }
      break;
    }
  }
};

// Middleware implementation
export const memberMiddleware: Middleware = 
  store => 
  next => 
  (action: unknown): ReturnType<typeof next> => {
    if (!isMemberAction(action)) {
      return next(action);
    }

    try {
      validateMemberAction(store.getState(), action);
      return next(action);
    } catch (error) {
      console.error('Member constraint violation:', error);
      return next({ type: 'members/error', payload: error });
    }
  };
