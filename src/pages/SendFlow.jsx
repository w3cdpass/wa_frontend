import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Card, Typography, Stack, Button, TextField, Chip, IconButton,
  LinearProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Alert, Tooltip, CircularProgress, Select, MenuItem, InputLabel, FormControl,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import { useToast } from '../context/ToastContext';
import api from '../api/api';

const STATUS_ICONS = {
  sent: <CheckCircleRoundedIcon fontSize="small" color="success" />,
  delivered: <CheckCircleRoundedIcon fontSize="small" color="success" />,
  failed: <ErrorOutlineRoundedIcon fontSize="small" color="error" />,
  running: <HourglassBottomRoundedIcon fontSize="small" color="warning" />,
  completed: <CheckCircleRoundedIcon fontSize="small" color="success" />,
  handing_off: <HourglassBottomRoundedIcon fontSize="small" color="info" />,
};

export default function SendFlow() {
  const navigate = useNavigate();
  const { id: routeFlowId } = useParams();
  const { showToast } = useToast();

  const [flows, setFlows] = useState([]);
  const [selectedFlowId, setSelectedFlowId] = useState(routeFlowId || '');
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending] = useState(false);
  const [runs, setRuns] = useState(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    api.listFlows().then((res) => setFlows(res.flows || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedFlowId) { setSelectedFlow(null); return; }
    api.getFlow(selectedFlowId).then(setSelectedFlow).catch(() => setSelectedFlow(null));
  }, [selectedFlowId]);

  const addRecipient = () => {
    const cleaned = phoneInput.replace(/\D/g, '');
    if (!cleaned || cleaned.length < 8) return showToast('Enter a valid phone number with country code', 'error');
    if (recipients.includes(cleaned)) return showToast('Already added', 'warning');
    setRecipients((r) => [...r, cleaned]);
    setPhoneInput('');
  };

  const handleSend = async () => {
    if (!selectedFlowId) return showToast('Pick a flow first', 'error');
    if (!recipients.length) return showToast('Add at least one recipient', 'error');
    setSending(true);
    try {
      const res = await api.sendFlow(selectedFlowId, recipients);
      setRuns(res.runs || []);
      setPolling(true);
      showToast(`Sent to ${res.runs?.length || 0} recipient(s)`, 'success');
    } catch (e) {
      showToast(e.message || 'Send failed', 'error');
    } finally {
      setSending(false);
    }
  };

  // Poll run statuses while any are still running/sent
  useEffect(() => {
    if (!polling || !runs) return;
    const hasActive = runs.some((r) => r.status === 'sent' || r.status === 'running');
    if (!hasActive) { setPolling(false); return; }
    const iv = setInterval(async () => {
      try {
        const updated = await Promise.all(
          runs.map((r) => api.getFlowRun(r.runId).catch(() => r))
        );
        setRuns((prev) => prev.map((pr, i) => {
          const u = updated[i];
          return u?._id ? { ...pr, status: u.status || pr.status } : pr;
        }));
      } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(iv);
  }, [polling, runs]);

  const startNode = selectedFlow?.nodes?.[0];

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/flows')}><ArrowBackRoundedIcon /></IconButton>
        <Box>
          <Typography variant="h5" fontWeight={800}>Send Flow</Typography>
          <Typography variant="body2" color="text.secondary">Pick a saved flow and send it to real WhatsApp numbers.</Typography>
        </Box>
      </Stack>

      <Stack spacing={2.5} maxWidth={640}>
        {/* Step 1: Pick flow */}
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>1. Pick a flow</Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Select a flow…</InputLabel>
            <Select
              label="Select a flow…"
              value={selectedFlowId}
              onChange={(e) => setSelectedFlowId(e.target.value)}
            >
              <MenuItem value=""><em>Select a flow…</em></MenuItem>
              {flows.map((f) => (
                <MenuItem key={f._id} value={f._id}>{f.name} ({f.status})</MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedFlow && (
            <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
              <strong>{selectedFlow.name}</strong> — {selectedFlow.nodes?.length || 0} blocks, first block: <code>{startNode?.nodeType || 'unknown'}</code>
              {startNode?.nodeType === 'send_template' && (
                <> — template: <strong>{startNode.config?.templateName}</strong></>
              )}
            </Alert>
          )}
        </Card>

        {/* Step 2: Add recipients */}
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>2. Add recipients</Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small" fullWidth
              label="Phone number with country code"
              placeholder="919878261754"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
            />
            <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={addRecipient}>Add</Button>
          </Stack>
          <Button
            size="small" sx={{ mt: 1 }}
            startIcon={<PersonAddRoundedIcon />}
            onClick={() => { if (!recipients.includes('919878261754')) setRecipients((r) => [...r, '919878261754']); }}
          >
            Add my test number
          </Button>
          {recipients.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
              {recipients.map((p) => (
                <Chip
                  key={p}
                  label={`+${p}`}
                  size="small"
                  onDelete={() => setRecipients((r) => r.filter((x) => x !== p))}
                  deleteIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
                />
              ))}
            </Stack>
          )}
        </Card>

        {/* Step 3: Send */}
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>3. Send</Typography>
          {!runs ? (
            <Button
              variant="contained"
              startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon />}
              disabled={sending || !selectedFlowId || !recipients.length}
              onClick={handleSend}
            >
              Send to {recipients.length || 0} recipient(s)
            </Button>
          ) : (
            <>
              {polling && <LinearProgress sx={{ mb: 2 }} />}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Phone</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {runs.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>+{r.phone}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {STATUS_ICONS[r.status] || null}
                            <Typography variant="body2">{r.status}</Typography>
                            {r.error && (
                              <Tooltip title={r.error}>
                                <Typography variant="caption" color="error">ℹ</Typography>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {!polling && (
                <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                  All messages processed. Check your WhatsApp to see the conversation.
                </Alert>
              )}
            </>
          )}
        </Card>
      </Stack>
    </Box>
  );
}
