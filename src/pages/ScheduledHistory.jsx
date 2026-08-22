import { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Stack, Table, TableHead, TableRow, TableCell, TableBody,
  Button, IconButton, Menu, MenuItem, LinearProgress, Chip,
} from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import StatusChip from '../components/StatusChip';
import ScheduleModal from '../components/ScheduleModal';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import dayjs from 'dayjs';

export default function ScheduledHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getScheduledCampaigns();
      setRows(res.scheduled || res);
    } catch (err) {
      showToast(err.message || 'Failed to load scheduled campaigns', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openMenu = (e, row) => {
    setMenuAnchor(e.currentTarget);
    setActiveRow(row);
  };
  const closeMenu = () => setMenuAnchor(null);

  const handleRunNow = async (row) => {
    closeMenu();
    try {
      await api.runScheduledNow(row.id);
      showToast(`"${row.name}" is now processing`, 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to run campaign', 'error');
    }
  };

  const handleCancel = async (row) => {
    closeMenu();
    try {
      await api.cancelSchedule(row.id);
      showToast(`"${row.name}" schedule cancelled`, 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to cancel schedule', 'error');
    }
  };

  const handleRescheduleConfirm = async (scheduledAt) => {
    setRescheduleOpen(false);
    try {
      await api.updateSchedule(activeRow.id, scheduledAt);
      showToast('Schedule updated', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to update schedule', 'error');
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Scheduled Campaigns</Typography>
          <Typography variant="body2" color="text.secondary">Upcoming broadcasts queued to send automatically.</Typography>
        </Box>
      </Stack>

      <Card sx={{ borderRadius: 3 }}>
        {loading && <LinearProgress />}
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Campaign</TableCell>
                <TableCell align="right">Contacts</TableCell>
                <TableCell>Scheduled for</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const soon = dayjs(row.scheduledAt).diff(dayjs(), 'hour') < 24;
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{row.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.id}</Typography>
                    </TableCell>
                    <TableCell align="right">{row.totalContacts}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EventRepeatRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2">{dayjs(row.scheduledAt).format('D MMM YYYY, h:mm A')}</Typography>
                          {soon && <Chip label="Sending soon" size="small" color="warning" sx={{ mt: 0.5 }} />}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell><StatusChip status={row.status} /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayArrowRoundedIcon />}
                          onClick={() => handleRunNow(row)}
                        >
                          Run now
                        </Button>
                        <IconButton size="small" onClick={(e) => openMenu(e, row)}>
                          <MoreVertRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No scheduled campaigns yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem onClick={() => { setRescheduleOpen(true); closeMenu(); }}>
          <EditRoundedIcon fontSize="small" sx={{ mr: 1.5 }} /> Reschedule
        </MenuItem>
        <MenuItem onClick={() => handleCancel(activeRow)} sx={{ color: 'error.main' }}>
          <CancelRoundedIcon fontSize="small" sx={{ mr: 1.5 }} /> Cancel schedule
        </MenuItem>
      </Menu>

      <ScheduleModal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        onConfirm={handleRescheduleConfirm}
        initialValue={activeRow?.scheduledAt}
      />
    </Box>
  );
}