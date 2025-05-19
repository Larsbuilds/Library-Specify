import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Book } from '../../types';
import { BookOperation } from '../../types/operations';

interface BooksState {
  items: Book[];
  loading: boolean;
  error: string | null;
  lastOperation: BookOperation | null;
}

const initialState: BooksState = {
  items: [],
  loading: false,
  error: null,
  lastOperation: null,
};

// Validation functions for book operations
const validateBookDelete = (book: Book | undefined) => {
  if (!book) {
    throw new Error('Book not found');
  }
  // lib21: Can only delete available books
  if (!book.available) {
    throw new Error('Cannot delete book that is currently loaned');
  }
};

const validateBookModify = (book: Book | undefined) => {
  if (!book) {
    throw new Error('Book not found');
  }
  // lib18: Check if book can be modified
  if (!book.available) {
    throw new Error('Cannot modify book that is currently loaned');
  }
};

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    setBooks: (state, action: PayloadAction<Book[]>) => {
      state.items = action.payload;
    },
    // lib01: Add book (book_purchase)
    addBook: (state, action: PayloadAction<Book & { operation: BookOperation }>) => {
      const { operation, ...bookData } = action.payload;
      
      if (operation.name !== 'book_purchase') {
        state.error = 'Invalid operation for adding book';
        return;
      }
      
      try {
        state.items.push({
          ...bookData,
          available: true // lib02: New books are always available
        });
        state.lastOperation = operation;
        state.error = null;
      } catch (error) {
        state.error = (error as Error).message;
      }
    },
    // lib15: Modify book
    updateBook: (state, action: PayloadAction<Book & { operation: BookOperation }>) => {
      const { operation, ...bookData } = action.payload;
      
      if (operation.name !== 'book_modify') {
        state.error = 'Invalid operation for modifying book';
        return;
      }
      
      try {
        const book = state.items.find(b => b.id === bookData.id);
        validateBookModify(book);
        
        const index = state.items.findIndex(b => b.id === bookData.id);
        if (index !== -1) {
          state.items[index] = {
            ...bookData,
            available: book!.available // Preserve availability status
          };
          state.lastOperation = operation;
          state.error = null;
        }
      } catch (error) {
        state.error = (error as Error).message;
      }
    },
    // lib16: Delete book
    deleteBook: (state, action: PayloadAction<{ id: string; operation: BookOperation }>) => {
      const { operation, id } = action.payload;
      
      if (operation.name !== 'book_delete') {
        state.error = 'Invalid operation for deleting book';
        return;
      }
      
      try {
        const book = state.items.find(b => b.id === id);
        validateBookDelete(book);
        
        state.items = state.items.filter(b => b.id !== id);
        state.lastOperation = operation;
        state.error = null;
      } catch (error) {
        state.error = (error as Error).message;
      }
    },
    // lib07: Update book availability (used by loan operations)
    updateAvailability: (state, action: PayloadAction<{ id: string; available: boolean; operation: BookOperation }>) => {
      const { operation, id, available } = action.payload;
      const index = state.items.findIndex(book => book.id === id);
      
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          available
        };
        state.lastOperation = operation;
        state.error = null;
      } else {
        state.error = 'Book not found';
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { 
  setBooks, 
  addBook, 
  updateBook, 
  deleteBook, 
  updateAvailability,
  setLoading, 
  setError 
} = booksSlice.actions;

export default booksSlice.reducer;
