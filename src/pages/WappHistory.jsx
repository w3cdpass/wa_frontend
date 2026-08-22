import { useEffect, useState } from 'react';
import {
  Box, Card, Typography, TextField, MenuItem, Stack, Table, TableHead, TableRow,
  TableCell, TableBody, LinearProgress, IconButton, Drawer, Divider, Chip,
  InputAdornment, Button, Alert, Skeleton,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import StatusChip from '../components/StatusChip';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import dayjs from 'dayjs';

const MEDIA_ICON = { image: ImageRoundedIcon, video: VideocamRoundedIcon, pdf: PictureAsPdfRoundedIcon };

export default function WappHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [failureBreakdown, setFailureBreakdown] = useState({});
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.listWaHistory({ search, status: status || undefined, limit: 50 });
      setRows(res.campaigns || res);
    } catch (err) {
      showToast(err.message || 'Failed to load history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (campaign) => {
    setDetailLoading(true);
    try {
      const detail = await api.getWaHistoryDetail(campaign.id);
      setSelected({ ...campaign, ...detail.campaign });
      setFailureBreakdown(detail.failureBreakdown || {});
    } catch (err) {
      showToast(err.message || 'Failed to load details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.exportWaHistory({ format: 'excel' });
      showToast('Export queued — you will get a download link shortly.', 'success');
    } catch (err) {
      showToast(err.message || 'Export failed', 'error');
    }
  };

  useEffect(() => { load(); }, [search, status]);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>WA History</Typography>
          <Typography variant="body2" color="text.secondary">Every broadcast campaign you've run, in one place.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={handleExport}>
          Export
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2.5 }}>
          <TextField
            size="small"
            placeholder="Search campaigns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
            sx={{ minWidth: 260 }}
          />
          <TextField
            size="small"
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="scheduled">Scheduled</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="sent">Sent</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
        </Stack>
        {loading && <LinearProgress />}
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Campaign</TableCell>
                <TableCell>Media</TableCell>
                <TableCell align="right">Contacts</TableCell>
                <TableCell align="right">Sent</TableCell>
                <TableCell align="right">Failed</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const MediaIcon = MEDIA_ICON[row.mediaType];
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{row.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.id}</Typography>
                    </TableCell>
                    <TableCell>
                      {MediaIcon ? (
                        <Chip size="small" icon={<MediaIcon fontSize="small" />} label={row.mediaType} variant="outlined" />
                      ) : (
                        <Typography variant="caption" color="text.secondary">Text only</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{row.totalContacts}</TableCell>
                    <TableCell align="right">{row.sentCount ?? row.sent}</TableCell>
                    <TableCell align="right">{row.failedCount ?? row.failed}</TableCell>
                    <TableCell><StatusChip status={row.status} /></TableCell>
                    <TableCell>
                      <Typography variant="body2">{dayjs(row.createdAt).format('D MMM YYYY')}</Typography>
                      <Typography variant="caption" color="text.secondary">{dayjs(row.createdAt).format('h:mm A')}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => loadDetail(row)}>
                        <VisibilityRoundedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No campaigns match your filters.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      <Drawer anchor="right" open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <Box sx={{ width: 420, p: 3, display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={800}>{selected.name}</Typography>
              <Typography variant="caption" color="text.secondary">{selected.id}</Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            {detailLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <Skeleton variant="text" width="60%" />
              </Box>
            ) : (
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Stack spacing={2}>
                  <DetailRow label="Status" value={<StatusChip status={selected.status} />} />
                  <DetailRow label="Type" value={selected.type} />
                  <DetailRow label="Message" value={selected.message} multiline />
                  <DetailRow label="Media" value={selected.mediaName || 'None'} />
                  <DetailRow label="Total contacts" value={selected.totalContacts} />
                  <DetailRow label="Sent" value={selected.sentCount ?? selected.sent} />
                  <DetailRow label="Delivered" value={selected.deliveredCount ?? selected.delivered} />
                  <DetailRow label="Failed" value={selected.failedCount ?? selected.failed} />
                  <DetailRow label="Pending" value={selected.pending} />
                  <DetailRow label="Created" value={dayjs(selected.createdAt).format('D MMM YYYY, h:mm A')} />
                  {selected.completedAt && <DetailRow label="Completed" value={dayjs(selected.completedAt).format('D MMM YYYY, h:mm A')} />}
                  {selected.scheduledAt && <DetailRow label="Scheduled for" value={dayjs(selected.scheduledAt).format('D MMM YYYY, h:mm A')} />}

                  {Object.keys(failureBreakdown).length > 0 && (
                    <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: '#FFF3F3', border: '1px solid #FFE0E0' }}>
                      <Typography variant="subtitle2" fontWeight={700} color="error.main" sx={{ mb: 1.5 }}>
                        Failure Breakdown
                      </Typography>
                      <Stack spacing={1}>
                        {Object.entries(failureBreakdown).map(([reason, count]) => (
                          <Stack key={reason} direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">{reason}</Typography>
                            <Typography variant="body2" fontWeight={700} color="error.main">{count}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
}

function DetailRow({ label, value, multiline }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Typography>
      <Box sx={{ mt: 0.25, whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>{value}</Box>
    </Box>
  );
}