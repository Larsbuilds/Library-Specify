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
  Box,
} from '@mui/material';
import { RootState } from '../../store';
import { addMember, updateMember, deleteMember } from '../../store/slices/membersSlice';
import { Member, MemberStatus, MemberBorrowingStatus } from '../../types/memberTypes';

const MemberCard: React.FC<{
  member: Member;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ member, onEdit, onDelete }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" component="div">
        {member.name}
      </Typography>
      <Typography color="text.secondary">
        Status: {member.status}
      </Typography>
      <Typography color="text.secondary">
        Total Loans: {member.totalLoans}
      </Typography>
      <Typography color="text.secondary">
        Current Loans: {member.currentLoans}
      </Typography>
      <Stack direction="row" spacing={1} mt={2}>
        <Button size="small" variant="outlined" onClick={onEdit}>
          Edit
        </Button>
        <Button size="small" variant="outlined" color="error" onClick={onDelete}>
          Delete
        </Button>
      </Stack>
    </CardContent>
  </Card>
);

export const MembersPage: React.FC = () => {
  const dispatch = useDispatch();
  const members = useSelector((state: RootState) => state.members.items);
  const [open, setOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    totalLoans: 0,
    currentLoans: 0,
    status: 'permitted' as Member['status'],
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMember(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      totalLoans: 0,
      currentLoans: 0,
      status: 'permitted',
    });
  };

  const handleSubmit = () => {
    const memberData: Member = {
      id: editMember?.id || Date.now().toString(),
      ...formData,
      borrowingStatus: editMember?.borrowingStatus || MemberBorrowingStatus.UNDER_LIMIT,
      createdAt: editMember?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editMember) {
      dispatch(updateMember({
        ...memberData,
        operation: {
          type: 'amendment',
          name: 'member_modify',
          constraintId: 'lib9'
        }
      }));
    } else {
      dispatch(addMember({
        ...memberData,
        operation: {
          type: 'insertion',
          name: 'member_add',
          constraintId: 'lib10'
        }
      }));
    }
    handleClose();
  };

  const handleEdit = (member: Member) => {
    setEditMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      totalLoans: member.totalLoans,
      currentLoans: member.currentLoans,
      status: member.status,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    // Check for active loans
    const member = members.find(m => m.id === id);
    if (!member) return;

    const hasActiveLoans = member.currentLoans > 0;

    dispatch(deleteMember({
      id,
      hasActiveLoans,
      operation: {
        type: 'deletion',
        name: 'member_delete',
        constraintId: 'lib8'
      }
    }));
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <h1>Members Management</h1>
        <Button variant="contained" onClick={handleOpen}>
          Add New Member
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {members.map((member) => (
          <Box key={member.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1.5 }}>
            <MemberCard
              member={member}
              onEdit={() => handleEdit(member)}
              onDelete={() => handleDelete(member.id)}
            />
          </Box>
        ))}
      </Grid>

      <Dialog 
        open={open} 
        onClose={handleClose}
        aria-labelledby="member-dialog-title"
        slotProps={{
          backdrop: {
            'aria-hidden': 'true'
          }
        }}
      >
        <DialogTitle id="member-dialog-title">{editMember ? 'Edit Member' : 'Add New Member'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMember ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
