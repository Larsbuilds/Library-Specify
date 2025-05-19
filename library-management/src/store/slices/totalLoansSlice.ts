import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { TotalLoansOperation } from '../../types/operations';

// Total loans tracking as defined in Prolog spec (lib36-41)
export interface TotalLoans {
  id: string;
  memberId: string;
  count: number;
  lastUpdated: string;
  operation?: {
    type: 'insertion' | 'deletion' | 'amendment' | 'read-only';
    name: 'total_loans_add' | 'total_loans_modify' | 'total_loans_delete' | 'total_loans_current';
    constraintId: string; // e.g., 'lib36', 'lib37', etc.
  };
}

interface TotalLoansState {
  items: TotalLoans[];
}

const initialState: TotalLoansState = {
  items: []
};

const totalLoansSlice = createSlice({
  name: 'totalLoans',
  initialState,
  reducers: {
    // lib36: Add total loans entry
    addTotalLoans: (state, action: PayloadAction<Omit<TotalLoans, 'id'> & { operation: TotalLoansOperation }>) => {
      if (action.payload.operation.name !== 'total_loans_add') {
        throw new Error('Invalid operation for adding total loans');
      }
      state.items.push({
        ...action.payload,
        id: uuidv4(),
        operation: {
          type: 'insertion',
          name: 'total_loans_add',
          constraintId: 'lib36'
        }
      });
    },
    // lib37: Modify total loans entry
    updateTotalLoans: (state, action: PayloadAction<TotalLoans & { operation: TotalLoansOperation }>) => {
      if (action.payload.operation.name !== 'total_loans_modify') {
        throw new Error('Invalid operation for modifying total loans');
      }
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...action.payload,
          operation: {
            type: 'amendment',
            name: 'total_loans_modify',
            constraintId: 'lib37'
          }
        };
      }
    },
    // lib38: Delete total loans entry
    deleteTotalLoans: (state, action: PayloadAction<{ id: string; operation: TotalLoansOperation }>) => {
      if (action.payload.operation.name !== 'total_loans_delete') {
        throw new Error('Invalid operation for deleting total loans');
      }
      state.items = state.items.filter(item => item.id !== action.payload.id);
    }
  }
});

export const { addTotalLoans, updateTotalLoans, deleteTotalLoans } = totalLoansSlice.actions;
export default totalLoansSlice.reducer;
