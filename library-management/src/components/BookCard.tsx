import React from 'react';
import { Card, CardContent, Typography, Button, Stack } from '@mui/material';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  onLoan?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onLoan, onEdit, onDelete }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div">
          {book.title}
        </Typography>
        <Typography color="text.secondary">
          Status: {book.currentStatus}
        </Typography>
        <Stack direction="row" spacing={1} mt={2}>
          {book.available && onLoan && (
            <Button size="small" variant="contained" onClick={onLoan}>
              Request Loan
            </Button>
          )}
          {onEdit && (
            <Button size="small" variant="outlined" onClick={onEdit}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button size="small" variant="outlined" color="error" onClick={onDelete}>
              Delete
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
