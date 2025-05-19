export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  available: boolean;
  currentStatus: 'available' | 'unavailable' | 'on_loan';
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'permitted' | 'restricted' | 'suspended';
  totalLoans: number;
  currentLoans: number;
}

export interface Loan {
  id: string;
  bookId: string;
  memberId: string;
  requestDate: string;
  approvalDate?: string;
  returnDate?: string;
  status: 'requested' | 'approved' | 'returned' | 'overdue';
}

export interface CalendarEvent {
  id: string;
  type: 'loan_due' | 'loan_return' | 'book_addition' | 'loan_reminder';
  relatedId: string;
  date: string;
}
