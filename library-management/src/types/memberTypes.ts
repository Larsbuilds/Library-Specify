import { MemberOperation } from './operations';

export type MemberStatus = 'permitted' | 'restricted' | 'suspended';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: MemberStatus;
  borrowingStatus: MemberBorrowingStatus;
  totalLoans: number;
  currentLoans: number;
  createdAt: string;
  updatedAt: string;
}

export enum MemberBorrowingStatus {
  UNDER_LIMIT = 'under',
  OVER_LIMIT = 'over',
}

export const MAX_LOANS_PER_MEMBER = 5; // lib32-33: Maximum loans allowed per member

export interface MemberState {
  items: Member[];
  loading: boolean;
  error: string | null;
  lastOperation: MemberOperation | null;
}
