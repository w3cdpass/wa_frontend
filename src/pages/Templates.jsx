import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Stack, Typography, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip, Menu, MenuItem,
  ListItemIcon, CircularProgress,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { useToast } from '../context/ToastContext';
import api from '../api/api';

const STATUS_COLORS = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'error',
  DRAFT: 'default',
  PAUSED: 'info',
};

const CATEGORY_COLORS = {
  MARKETING: '#7C4DFF',
  UTILITY: '#00897B',
  AUTHENTICATION: '#F57C00',
};

export default function Templates() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [menu, setMenu] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listTemplates();
      setTemplates(res.templates || []);
    } catch (e) {
      showToast(e.message || 'Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.syncTemplates();
      showToast(`Synced: ${res.created || 0} new, ${res.updated || 0} updated${res.errors ? `, ${res.errors} failed` : ''}`, res.errors ? 'warning' : 'success');
      await load();
    } catch (e) {
      showToast(e.message || 'Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (t) => {
    setMenu(null);
    try {
      await api.submitTemplate(t._id);
      showToast(`"${t.name}" submitted to Meta for approval`, 'success');
      await load();
    } catch (e) {
      showToast(e.message || 'Submission failed', 'error');
    }
  };

  const handleDelete = async (t) => {
    setMenu(null);
    if (!window.confirm(`Delete template "${t.name}"? This also removes it from Meta if it was submitted.`)) return;
    try {
      await api.deleteTemplate(t._id);
      showToast('Template deleted', 'success');
      await load();
    } catch (e) {
      showToast(e.message || 'Delete failed', 'error');
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Message templates</Typography>
          <Typography variant="body2" color="text.secondary">
            Pre-approved WhatsApp messages for campaigns. Create → submit → wait for Meta approval → send.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<SyncRoundedIcon sx={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />} onClick={handleSync} disabled={syncing}>
            Sync from Meta
          </Button>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/templates/new')}>
            Create template
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Language</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Updated</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No templates yet.</Typography>
                    <Button startIcon={<AddRoundedIcon />} onClick={() => navigate('/templates/new')} sx={{ mt: 1 }}>
                      Create your first template
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((t) => (
                  <TableRow key={t._id} hover>
                    <TableCell>
                      <Typography fontWeight={700}>{t.name}</Typography>
                      {t.submissionError && (
                        <Tooltip title={t.submissionError}><Typography variant="caption" color="error">submission error</Typography></Tooltip>
                      )}
                    </TableCell>
                    <TableCell>{t.language}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t.category} sx={{ bgcolor: `${CATEGORY_COLORS[t.category]}22`, color: CATEGORY_COLORS[t.category], fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{(t.templateType || 'standard').replace('_', ' ')}</TableCell>
                    <TableCell><Chip size="small" label={t.status || 'DRAFT'} color={STATUS_COLORS[t.status] || 'default'} variant={t.status === 'APPROVED' ? 'filled' : 'outlined'} /></TableCell>
                    <TableCell>{new Date(t.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => setMenu({ templateId: t._id, anchorEl: e.currentTarget })}>
                        <MoreVertRoundedIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Row actions */}
        <Menu
          open={Boolean(menu)}
          anchorEl={menu?.anchorEl}
          onClose={() => setMenu(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {menu && templates.filter((t) => t._id === menu.templateId).map((t) => (
            <Box key={t._id}>
              {['DRAFT', 'REJECTED'].includes(t.status) && !t.metaTemplateId && (
                <MenuItem onClick={() => handleSubmit(t)}>
                  <ListItemIcon><SendRoundedIcon fontSize="small" /></ListItemIcon>Submit for approval
                </MenuItem>
              )}
              <MenuItem onClick={() => handleDelete(t)} sx={{ color: 'error.main' }}>
                <ListItemIcon><DeleteOutlineRoundedIcon fontSize="small" color="error" /></ListItemIcon>Delete
              </MenuItem>
            </Box>
          ))}
        </Menu>
      </Card>
    </Box>
  );
}
