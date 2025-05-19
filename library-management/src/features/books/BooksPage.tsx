import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Grid,
  Box,
} from '@mui/material';
import { RootState } from '../../store';
import { BookCard } from '../../components/BookCard';
import { addBook, updateBook, deleteBook } from '../../store/slices/booksSlice';
import { Book } from '../../types';
import { ExternalOperation } from '../../types/operations';

export const BooksPage: React.FC = () => {
  const dispatch = useDispatch();
  const books = useSelector((state: RootState) => state.books.items);
  const [open, setOpen] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    author: string;
    isbn: string;
    quantity: number;
    available: boolean;
    currentStatus: Book['currentStatus'];
  }>({
    title: '',
    author: '',
    isbn: '',
    quantity: 1,
    available: true,
    currentStatus: 'available',
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      quantity: 1,
      available: true,
      currentStatus: 'available' as const
    });
  };

  const handleSubmit = () => {
    const bookData: Book = {
      id: editBook?.id || Date.now().toString(),
      ...formData,
    };

    if (editBook) {
      dispatch(updateBook({
        ...bookData,
        operation: { 
          type: 'amendment',
          name: 'book_modify',
          constraintId: 'lib15'
        }
      }));
    } else {
      dispatch(addBook({
        ...bookData,
        operation: { 
          type: 'insertion',
          name: 'book_purchase',
          constraintId: 'lib1'
        }
      }));
    }
    handleClose();
  };

  const handleEdit = (book: Book) => {
    setEditBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      quantity: book.quantity,
      available: book.available,
      currentStatus: book.currentStatus,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    dispatch(deleteBook({
      id,
      operation: { 
        type: 'deletion',
        name: 'book_delete',
        constraintId: 'lib16'
      }
    }));
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <h1>Books Management</h1>
        <Button variant="contained" onClick={handleOpen}>
          Add New Book
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {books.map((book) => (
          <Box key={book.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1.5 }}>
            <BookCard
              book={book}
              onEdit={() => handleEdit(book)}
              onDelete={() => handleDelete(book.id)}
            />
          </Box>
        ))}
      </Grid>

      <Dialog 
        open={open} 
        onClose={handleClose}
        aria-labelledby="book-dialog-title"
        slotProps={{
          backdrop: {
            'aria-hidden': 'true'
          }
        }}
      >
        <DialogTitle id="book-dialog-title">{editBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editBook ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
