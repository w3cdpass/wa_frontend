import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Stack, Typography, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip, Menu, MenuItem,
  ListItemIcon, CircularProgress, TextField, Pagination, Dialog, DialogTitle,
  DialogContent, DialogActions, InputAdornment,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import WhatsAppBubble from '../components/WhatsAppBubble';

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

const PAGE_SIZE = 10;

export default function Templates() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [menu, setMenu] = useState(null);

  // filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  // preview dialog
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendTest, setSendTest] = useState(null);
  const [sendTestPhone, setSendTestPhone] = useState('919878261754');
  const [sendTestLoading, setSendTestLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listTemplates({
        page,
        limit: PAGE_SIZE,
        ...(search && { search }),
        ...(status && { status }),
        ...(category && { category }),
      });
      setTemplates(res.templates || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (e) {
      showToast(e.message || 'Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status, category]);

  useEffect(() => { load(); }, [load]);

  // Keep review statuses fresh without manual "Sync" clicks:
  // - one sync right after mount
  // - every 30 s while any template is still PENDING at Meta
  // (covers cases where the template-status webhook isn't configured/missed)
  const latest = useRef({});
  latest.current = { load, hasPending: templates.some((t) => t.status === 'PENDING') };
  useEffect(() => {
    let cancelled = false;
    api.syncTemplates().catch(() => {});
    const iv = setInterval(async () => {
      if (cancelled || !latest.current.hasPending) return;
      try {
        await api.syncTemplates();
        if (!cancelled) latest.current.load();
      } catch { /* silent — next tick retries */ }
    }, 30000);
    return () => { cancelled = true; clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPreview = async (t) => {
    setMenu(null);
    setPreviewTemplate(null);
    setPreviewLoading(true);
    try {
      const full = await api.getTemplate(t._id);
      setPreviewTemplate(full);
    } catch {
      setPreviewTemplate(t); // fall back to the row we already have
    } finally {
      setPreviewLoading(false);
    }
  };

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

      {/* Filters */}
      <Card sx={{ borderRadius: 3, mb: 2.5, p: 1.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            size="small"
            placeholder="Search by name or text…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            select
            label="Status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {Object.keys(STATUS_COLORS).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField
            size="small"
            select
            label="Category"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="">All categories</MenuItem>
            {Object.keys(CATEGORY_COLORS).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Stack>
      </Card>

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
                    <Typography color="text.secondary">
                      No templates{search || status || category ? ' match your filters' : ' yet'}.
                    </Typography>
                    {!search && !status && !category && (
                      <Button startIcon={<AddRoundedIcon />} onClick={() => navigate('/templates/new')} sx={{ mt: 1 }}>
                        Create your first template
                      </Button>
                    )}
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
                    <TableCell>
                      <Tooltip
                        title={t.status === 'PENDING'
                          ? 'Meta is reviewing this template — usually done within minutes to a few hours (max 24 h). This page auto-refreshes every 30 s.'
                          : t.status || 'DRAFT'}
                        arrow
                      >
                        <Chip size="small" label={t.status || 'DRAFT'} color={STATUS_COLORS[t.status] || 'default'} variant={t.status === 'APPROVED' ? 'filled' : 'outlined'} />
                      </Tooltip>
                    </TableCell>
                    <TableCell>{new Date(t.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Preview as WhatsApp message">
                        <IconButton size="small" onClick={() => openPreview(t)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {t.status === 'APPROVED' && (
                        <Tooltip title="Send test to your phone">
                          <IconButton size="small" onClick={() => setSendTest({ templateId: t._id, templateName: t.name })}>
                            <SendRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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
              <MenuItem onClick={() => openPreview(t)}>
                <ListItemIcon><VisibilityOutlinedIcon fontSize="small" /></ListItemIcon>Preview
              </MenuItem>
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

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              {pagination.total} template(s) · page {pagination.page} of {pagination.totalPages}
            </Typography>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={(_, v) => setPage(v)}
              size="small"
            />
          </Stack>
        )}
      </Card>

      {/* Preview dialog */}
      <Dialog open={Boolean(previewTemplate)} onClose={() => setPreviewTemplate(null)} maxWidth="sm" fullWidth>
        {previewTemplate && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontWeight={800}>{previewTemplate.name}</Typography>
              <Chip size="small" label={previewTemplate.status || 'DRAFT'} color={STATUS_COLORS[previewTemplate.status] || 'default'} />
              <Chip size="small" label={previewTemplate.language} />
              <Box sx={{ flex: 1 }} />
              {previewLoading && <CircularProgress size={18} />}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ bgcolor: '#ECE5DD', borderRadius: 2, p: 2, minHeight: 260 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1, bgcolor: '#075E54', color: '#fff', borderRadius: 2, mb: 2 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#128C7E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>WA</Box>
                  <Typography fontSize={13} fontWeight={700}>Your Business</Typography>
                </Stack>
                <WhatsAppBubble template={previewTemplate} maxWidth={320} />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewTemplate(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Send Test dialog */}
      <Dialog open={Boolean(sendTest)} onClose={() => setSendTest(null)} maxWidth="xs" fullWidth>
        {sendTest && (
          <>
            <DialogTitle>
              <Typography fontWeight={800}>Send test: {sendTest.templateName}</Typography>
            </DialogTitle>
            <DialogContent>
              <TextField
                fullWidth size="small" label="Phone number with country code"
                value={sendTestPhone}
                onChange={(e) => setSendTestPhone(e.target.value)}
                placeholder="919878261754"
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSendTest(null)}>Cancel</Button>
              <Button
                variant="contained"
                disabled={sendTestLoading || !sendTestPhone}
                startIcon={sendTestLoading ? <CircularProgress size={16} /> : <SendRoundedIcon />}
                onClick={async () => {
                  setSendTestLoading(true);
                  try {
                    await api.sendTestTemplate(sendTest.templateId, sendTestPhone);
                    showToast('Template sent! Check your WhatsApp.', 'success');
                    setSendTest(null);
                  } catch (e) {
                    showToast(e.response?.data?.message || e.message || 'Send failed', 'error');
                  } finally {
                    setSendTestLoading(false);
                  }
                }}
              >
                Send Now
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
