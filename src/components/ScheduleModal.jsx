import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Campaigns are only processed between 10:00 AM and 6:00 PM on working days,
// per the platform's operating rules — the picker nudges the user toward a
// valid slot but does not hard-block outside choices in this demo.
export default function ScheduleModal({ open, onClose, onConfirm, initialValue }) {
  const [value, setValue] = useState(initialValue ? dayjs(initialValue) : dayjs().add(1, 'day').hour(10).minute(0));

  const hour = value?.hour();
  const outsideWindow = hour !== null && (hour < 10 || hour >= 18);
  const isWeekend = value ? [0, 6].includes(value.day()) : false;

  const handleConfirm = () => {
    onConfirm(value.toISOString());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Schedule campaign</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose when this broadcast should start sending.
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            label="Send at"
            value={value}
            onChange={setValue}
            minDateTime={dayjs()}
            sx={{ width: '100%' }}
          />
        </LocalizationProvider>

        {(outsideWindow || isWeekend) && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Campaigns are processed between 10:00 AM – 6:00 PM on working days.
            This time may be queued until the next valid window.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleConfirm}>Confirm schedule</Button>
      </DialogActions>
    </Dialog>
  );
}
