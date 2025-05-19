import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Member, MemberBorrowingStatus, MAX_LOANS_PER_MEMBER, MemberState } from '../../types/memberTypes';
import { MemberOperation } from '../../types/operations';
import { RootState } from '..';

// Selectors
export const selectMemberById = (state: RootState, memberId: string) =>
  state.members.items.find((member) => member.id === memberId);

export const selectMemberBorrowingStatus = (state: RootState, memberId: string) => {
  const member = selectMemberById(state, memberId);
  return member?.borrowingStatus;
};

interface MembersState extends MemberState {}

const initialState: MembersState = {
  items: [],
  loading: false,
  error: null,
  lastOperation: null,
};

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    setMembers: (state, action: PayloadAction<Member[]>) => {
      state.items = action.payload;
    },
    // lib10: Add member
    addMember: (state, action: PayloadAction<Member & { operation: MemberOperation }>) => {
      if (action.payload.operation.name !== 'member_add') {
        throw new Error('Invalid operation for adding member');
      }
      const { operation, ...memberData } = action.payload;
      state.items.push({
        ...memberData,
        borrowingStatus: MemberBorrowingStatus.UNDER_LIMIT,
        totalLoans: 0
      });
      state.lastOperation = operation;
    },
    // lib9: Modify member
    updateMember: (state, action: PayloadAction<Member & { operation: MemberOperation }>) => {
      if (action.payload.operation.name !== 'member_modify') {
        throw new Error('Invalid operation for modifying member');
      }
      const index = state.items.findIndex(member => member.id === action.payload.id);
      if (index !== -1) {
        const { operation, ...memberData } = action.payload;
        // lib28-31: Update borrowing status based on total loans
        const borrowingStatus = memberData.totalLoans >= MAX_LOANS_PER_MEMBER
          ? MemberBorrowingStatus.OVER_LIMIT
          : MemberBorrowingStatus.UNDER_LIMIT;

        state.items[index] = {
          ...memberData,
          borrowingStatus
        };
        state.lastOperation = operation;
      }
    },
    // lib8, lib14: Delete member (with active loans check)
    deleteMember: (state, action: PayloadAction<{ id: string; operation: MemberOperation; hasActiveLoans: boolean }>) => {
      if (action.payload.operation.name !== 'member_delete') {
        throw new Error('Invalid operation for deleting member');
      }
      
      // lib14: Check for active loans before deletion
      if (action.payload.hasActiveLoans) {
        throw new Error('Cannot delete member with active loans');
      }
      
      state.items = state.items.filter(member => member.id !== action.payload.id);
      state.lastOperation = action.payload.operation;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setMembers, addMember, updateMember, deleteMember, setLoading, setError } = membersSlice.actions;
export default membersSlice.reducer;
