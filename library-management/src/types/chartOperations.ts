// Operation types as defined in the Prolog spec (ichart.pl)
export type ChartOperationType = 'insertion' | 'deletion' | 'amendment' | 'normal' | 'read-only' | 'inversion';

export interface ChartOperation {
  type: ChartOperationType;
  sourceState: string;  // The state before the operation
  targetState: string;  // The state after the operation
  constraintId?: string; // e.g., 'lib01', 'lib02', etc.
}

// Map to track which operations are allowed between different states
export const CHART_OPERATIONS: Record<string, ChartOperation[]> = {
  // Book operations
  'book_purchase': [
    { type: 'insertion', sourceState: 'book_purchase', targetState: 'book_current', constraintId: 'lib01' }
  ],
  'book_modify': [
    { type: 'amendment', sourceState: 'book_modify', targetState: 'book_current', constraintId: 'lib15' }
  ],
  'book_delete': [
    { type: 'deletion', sourceState: 'book_delete', targetState: 'book_current', constraintId: 'lib16' }
  ],

  // Loan operations
  'loan_request': [
    { type: 'insertion', sourceState: 'loan_request', targetState: 'loan_approved', constraintId: 'lib04' }
  ],
  'loan_approved': [
    { type: 'read-only', sourceState: 'loan_approved', targetState: 'loan_returned', constraintId: 'lib05' },
    { type: 'inversion', sourceState: 'loan_approved', targetState: 'book_available', constraintId: 'lib07' }
  ],
  'loan_returned': [
    { type: 'deletion', sourceState: 'loan_returned', targetState: 'loan_approved', constraintId: 'lib06' }
  ],

  // Member operations
  'member_add': [
    { type: 'insertion', sourceState: 'member_add', targetState: 'member_current', constraintId: 'lib10' }
  ],
  'member_modify': [
    { type: 'amendment', sourceState: 'member_modify', targetState: 'member_current', constraintId: 'lib09' }
  ],
  'member_delete': [
    { type: 'deletion', sourceState: 'member_delete', targetState: 'member_current', constraintId: 'lib08' }
  ],
  'member_borrowing': [
    { type: 'normal', sourceState: 'member_borrowing', targetState: 'member_under', constraintId: 'lib30' },
    { type: 'normal', sourceState: 'member_borrowing', targetState: 'member_over', constraintId: 'lib31' }
  ]
};

// Helper function to validate operation transitions
export function validateChartOperation(
  operation: string,
  sourceState: string,
  targetState: string
): ChartOperation | undefined {
  const operations = CHART_OPERATIONS[operation];
  if (!operations) return undefined;

  return operations.find(
    op => op.sourceState === sourceState && op.targetState === targetState
  );
}
