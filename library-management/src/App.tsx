import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  CssBaseline,
} from '@mui/material';
import { BooksPage } from './features/books/BooksPage';
import { MembersPage } from './features/members/MembersPage';
import { LoansPage } from './features/loans/LoansPage';
import { CalendarPage } from './features/calendar/CalendarPage';
import CalendarMonitor from './components/CalendarMonitor';

function App() {
  return (
    <Provider store={store}>
      <CalendarMonitor />
      <BrowserRouter>
        <Box 
          component="main"
          role="main"
          sx={{ 
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh'
          }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Library Management System
              </Typography>
              <Button color="inherit" component={Link} to="/">
                Books
              </Button>
              <Button color="inherit" component={Link} to="/members">
                Members
              </Button>
              <Button color="inherit" component={Link} to="/loans">
                Loans
              </Button>
              <Button color="inherit" component={Link} to="/calendar">
                Calendar
              </Button>
            </Toolbar>
          </AppBar>
          <Container sx={{ mt: 4 }}>
            <Routes>
              <Route path="/" element={<BooksPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/loans" element={<LoansPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
            </Routes>
          </Container>
        </Box>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
