import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import { parseISO } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import { RootState } from '../../store';
import { initializeCalendar, addEntry, deleteEntry, updateCurrentDate } from '../../store/slices/calendarSlice';
import { CalendarEntry } from '../../types/calendar';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export const CalendarPage: React.FC = () => {
  const dispatch = useDispatch();
  const currentDateStr = useSelector((state: RootState) => state.calendar.currentCalendar.currentDate);
  const isInitialized = useSelector((state: RootState) => state.calendar.initialized);
  const entries = useSelector((state: RootState) => state.calendar.entries);

  // Initialize calendar on component mount
  useEffect(() => {
    if (!isInitialized) {
      dispatch(initializeCalendar());
    }
  }, [dispatch, isInitialized]);

  const [open, setOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<Omit<CalendarEntry, 'id' | 'operation'>>({ 
    type: 'due_date',
    date: new Date().toISOString(),
    description: '',
    affectedServices: ['loans']
  });

  const handleAddEntry = () => {
    if (!isInitialized) {
      console.error('Calendar system not initialized');
      return;
    }
    dispatch(
      addEntry({
        id: uuidv4(),
        ...newEntry,
        operation: {
          type: 'insertion',
          name: 'sys_calendar_add',
          constraintId: 'lib45'
        }
      })
    );
    setOpen(false);
    setNewEntry({
      type: 'due_date',
      date: new Date().toISOString(),
      description: '',
      affectedServices: ['loans']
    });
  };

  const handleDeleteEntry = (id: string) => {
    if (!isInitialized) {
      console.error('Calendar system not initialized');
      return;
    }
    dispatch(deleteEntry({
      id,
      operation: {
        type: 'deletion',
        name: 'sys_calendar_delete',
        constraintId: 'lib47'
      }
    }));
  };

  const handleDateChange = (newDate: Date) => {
    if (!isInitialized) {
      console.error('Calendar system not initialized');
      return;
    }
    dispatch(updateCurrentDate({ date: newDate.toISOString() }));
  };

  // Interface for react-big-calendar events
  interface CalendarViewEvent {
    id?: string;
    title: string;
    start: Date;
    end: Date;
    resource: CalendarEntry;
    allDay?: boolean;
  }

  const formatDate = (dateStr: string): string => {
    return parseISO(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeLabel = (type: CalendarEntry['type']) => {
    switch (type) {
      case 'due_date':
        return 'Due Date';
      case 'holiday':
        return 'Holiday';
      case 'system_maintenance':
        return 'System Maintenance';
      default:
        return type;
    }
  };

  return (
    <Box p={3}>
      {!isInitialized && (
        <Box mb={2}>
          <Typography color="error" variant="subtitle1">
            Initializing calendar system...
          </Typography>
        </Box>
      )}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">System Calendar</Typography>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
          Add Event
        </Button>
      </Stack>

      <Paper elevation={2}>
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            Current Date: {formatDate(currentDateStr)}
          </Typography>
          <Calendar
            localizer={localizer}
            events={entries.map((entry): CalendarViewEvent => ({
              id: entry.id,
              title: `${getEventTypeLabel(entry.type)}: ${entry.description}`,
              start: parseISO(entry.date),
              end: parseISO(entry.date),
              allDay: false,
              resource: entry
            }))}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={(event: BigCalendarEvent) => {
              const calEvent = (event as CalendarViewEvent).resource;
              if (calEvent.id) {
                handleDeleteEntry(calEvent.id);
              }
            }}
            style={{ height: 500 }}
          />
        </Box>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Event</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={newEntry.type}
                label="Event Type"
                onChange={(e) =>
                  setNewEntry({ ...newEntry, type: e.target.value as CalendarEntry['type'] })
                }
              >
                <MenuItem value="due_date">Due Date</MenuItem>
                <MenuItem value="holiday">Holiday</MenuItem>
                <MenuItem value="system_maintenance">System Maintenance</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Date"
              type="datetime-local"
              value={newEntry.date ? format(parseISO(newEntry.date), "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => {
                setNewEntry({ ...newEntry, date: new Date(e.target.value).toISOString() });
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddEntry} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
