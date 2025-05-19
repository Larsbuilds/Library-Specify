import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Typography,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
} from '@mui/material';
import { RootState } from '../../store';
import { addLoan, updateLoan, deleteLoan } from '../../store/slices/loansSlice';
import type { Loan, LoanStatus, LoanOperation } from '../../types/loanTypes';
import { ExternalOperation } from '../../types/operations';

interface LoanCardProps {
  loan: Loan;
  onEdit: (loan: Loan) => void;
  onDelete: (id: string) => void;
  bookTitle?: string;
  memberName?: string;
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const LoanCard: React.FC<LoanCardProps> = ({ loan, onEdit, onDelete, bookTitle, memberName }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" component="div">
        Loan Details
      </Typography>
      <Typography color="text.secondary">
        Book: {bookTitle || 'Unknown'}
      </Typography>
      <Typography color="text.secondary">
        Member: {memberName || 'Unknown'}
      </Typography>
      <Typography color="text.secondary">
        Status: {loan.status}
      </Typography>
      <Typography color="text.secondary">
        Request Date: {formatDate(loan.requestDate)}
      </Typography>
      {loan.approvalDate && (
        <Typography color="text.secondary">
          Approval Date: {formatDate(loan.approvalDate)}
        </Typography>
      )}
      {loan.returnDate && (
        <Typography color="text.secondary">
          Return Date: {formatDate(loan.returnDate)}
        </Typography>
      )}
      <Stack direction="row" spacing={1} mt={2}>
        <Button size="small" variant="outlined" onClick={() => onEdit(loan)}>
          Edit
        </Button>
        <Button size="small" variant="outlined" color="error" onClick={() => onDelete(loan.id)}>
          Delete
        </Button>
      </Stack>
    </CardContent>
  </Card>
);

export const LoansPage: React.FC = () => {
  const dispatch = useDispatch();
  const loans = useSelector((state: RootState) => state.loans.items);
  const books = useSelector((state: RootState) => state.books.items);
  const members = useSelector((state: RootState) => state.members.items);
  const [open, setOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  interface LoanFormData {
    bookId: string;
    memberId: string;
    requestDate: string;
    approvalDate?: string;
    returnDate?: string;
    status: LoanStatus;
  }

  const [formData, setFormData] = useState<LoanFormData>({
    bookId: '',
    memberId: '',
    status: 'requested' as Loan['status'],
    requestDate: new Date().toISOString(),
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingLoan(null);
    setFormData({
      bookId: '',
      memberId: '',
      status: 'requested',
      requestDate: new Date().toISOString(),
    });
  };

  type LoanWithDates = Omit<Loan, 'operation'> & {
    requestDate: Date;
    approvalDate?: Date;
    returnDate?: Date;
  };

  const createLoanWithOperation = (loan: LoanWithDates): Loan & { operation: LoanOperation } => ({
    ...loan,
    operation: {
      type: editingLoan ? 'amendment' : 'insertion',
      name: editingLoan ? 'loan_modify' : 'loan_request',
      constraintId: editingLoan ? 'lib5' : 'lib4'
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseLoanData = {
      ...formData,
      id: editingLoan?.id || Date.now().toString(),
    };

    const loanWithDates = {
      ...baseLoanData,
      requestDate: new Date(formData.requestDate),
      approvalDate: formData.approvalDate ? new Date(formData.approvalDate) : undefined,
      returnDate: formData.returnDate ? new Date(formData.returnDate) : undefined,
    };

    if (editingLoan) {
      dispatch(updateLoan(createLoanWithOperation(loanWithDates)));
    } else {
      dispatch(addLoan(createLoanWithOperation(loanWithDates)));
    }
    handleClose();
  };

  const handleEdit = (loan: Loan) => {
    const formattedLoan = {
      ...loan,
      requestDate: formatDate(loan.requestDate),
      approvalDate: loan.approvalDate ? formatDate(loan.approvalDate) : undefined,
      returnDate: loan.returnDate ? formatDate(loan.returnDate) : undefined
    };
    setEditingLoan(loan);
    setFormData({
      bookId: formattedLoan.bookId,
      memberId: formattedLoan.memberId,
      requestDate: formattedLoan.requestDate,
      approvalDate: formattedLoan.approvalDate,
      returnDate: formattedLoan.returnDate,
      status: formattedLoan.status
    });
    setFormData({
      bookId: '',
      memberId: '',
      status: loan.status as LoanStatus,
      requestDate: '',
      approvalDate: undefined,
      returnDate: undefined,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    const loan = loans.find(l => l.id === id);
    if (!loan) return;

    dispatch(deleteLoan({
      id,
      memberId: loan.memberId,
      operation: {
        type: 'deletion',
        name: 'loan_delete',
        constraintId: 'lib6'
      }
    }));
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <h1>Loans Management</h1>
        <Button variant="contained" onClick={handleOpen}>
          Create New Loan
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {loans.map((loan) => (
          <Box key={loan.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1.5 }}>
            <LoanCard
              loan={loan}
              onEdit={() => handleEdit(loan)}
              onDelete={() => handleDelete(loan.id)}
              bookTitle={books.find(b => b.id === loan.bookId)?.title}
              memberName={members.find(m => m.id === loan.memberId)?.name}
            />
          </Box>
        ))}
      </Grid>

      <Dialog 
        open={open} 
        onClose={handleClose}
        aria-labelledby="loan-dialog-title"
        slotProps={{
          backdrop: {
            'aria-hidden': 'true'
          }
        }}
      >
        <DialogTitle id="loan-dialog-title">{editingLoan ? 'Edit Loan' : 'Add Loan'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Book</InputLabel>
            <Select
              value={formData.bookId}
              label="Book"
              onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
            >
              {books.map((book) => (
                <MenuItem key={book.id} value={book.id}>
                  {book.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Member</InputLabel>
            <Select
              value={formData.memberId}
              label="Member"
              onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
            >
              {members.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Loan['status'] })}
            >
              <MenuItem value="requested">Requested</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="returned">Returned</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingLoan ? 'Save Changes' : 'Add Loan'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
