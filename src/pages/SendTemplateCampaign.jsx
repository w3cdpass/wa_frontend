import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Card, Stack, Typography, Button, Chip, TextField, MenuItem, Radio,
  RadioGroup, FormControlLabel, FormHelperText, CircularProgress, Alert,
  LinearProgress, Grid, Paper, Divider, IconButton,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import { extractVars } from '../components/WhatsAppBubble';

const STATUS_COLORS = {
  draft: 'default', scheduled: 'info', sending: 'warning',
  completed: 'success', failed: 'error', paused: 'default',
};

export default function SendTemplateCampaign() {
  const { id } = useParams();
  return id ? <BroadcastProgress broadcastId={id} /> : <Composer />;
}

/* ------------------------------------------------------------------ */
/* COMPOSER                                                            */
/* ------------------------------------------------------------------ */
function Composer() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [template, setTemplate] = useState(null);
  const [globalVars, setGlobalVars] = useState([]);
  const [tags, setTags] = useState([]);

  const [name, setName] = useState('');
  const [audienceType, setAudienceType] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [audienceCount, setAudienceCount] = useState(null);
  const [counting, setCounting] = useState(false);

  // position -> { mode, variableId | value }
  const [bindings, setBindings] = useState({});
  const [headerBinding, setHeaderBinding] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.listTemplates({ status: 'APPROVED', limit: 100 })
      .then((r) => setTemplates(r.templates || []))
      .catch(() => showToast('Failed to load templates', 'error'));
    api.listVariables()
      .then((r) => setGlobalVars(r.variables || []))
      .catch(() => {});
    api.contactTags()
      .then((r) => setTags(r.tags || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplate = async (tid) => {
    setTemplateId(tid);
    setTemplate(null);
    setBindings({});
    setHeaderBinding(null);
    if (!tid) return;
    try {
      const full = await api.getTemplate(tid);
      setTemplate(full);
      // sensible defaults: first variable preselected per position
      const init = {};
      (full.bodyText ? extractVars(full.bodyText) : []).forEach((v, i) => {
        if (globalVars[i]) init[v] = { mode: 'variable', variableId: globalVars[i]._id };
        else init[v] = { mode: 'fixed', value: '' };
      });
      setBindings(init);
      if (full.headerType === 'text' && extractVars(full.headerContent || '').length > 0 && globalVars[0]) {
        setHeaderBinding({ mode: 'variable', variableId: globalVars[0]._id });
      }
    } catch (e) {
      showToast(e.message || 'Failed to load template', 'error');
    }
  };

  const positions = useMemo(
    () => (template?.bodyText ? [...new Set(extractVars(template.bodyText))] : []),
    [template]
  );

  const audiencePayload = useMemo(
    () => ({ type: audienceType, tagIds: selectedTags }),
    [audienceType, selectedTags]
  );

  const countAudience = async () => {
    setCounting(true);
    try {
      const r = await api.previewAudienceCount(audiencePayload);
      setAudienceCount(r.count);
    } catch (e) {
      showToast(e.message || 'Count failed', 'error');
    } finally {
      setCounting(false);
    }
  };

  const setBinding = (pos, patch) =>
    setBindings((prev) => ({ ...prev, [pos]: { ...prev[pos], ...patch } }));

  const validate = () => {
    if (!template) return 'Select an approved template';
    for (const p of positions) {
      const b = bindings[p];
      if (!b) return `Choose a value for {{${p}}}`;
      if (b.mode === 'variable' && !b.variableId) return `Pick a variable for {{${p}}}`;
      if (b.mode === 'fixed' && !String(b.value ?? '').trim()) return `Enter a fixed value for {{${p}}}`;
    }
    if (audienceType === 'tags' && selectedTags.length === 0) return 'Select at least one tag';
    return null;
  };

  const handleSend = async () => {
    const err = validate();
    if (err) return showToast(err, 'error');
    setSending(true);
    try {
      const res = await api.createBroadcast({
        name: name.trim() || undefined,
        templateId,
        audience: audiencePayload,
        bindings: {
          body: positions.map((p) => ({ position: Number(p), ...bindings[p] })),
          header: headerBinding,
        },
      });
      showToast(res.message || 'Broadcast started', 'success');
      navigate(`/send-template/${res.broadcast._id}`);
    } catch (e) {
      showToast(e.message || 'Failed to start broadcast', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/templates')}><ArrowBackRoundedIcon /></IconButton>
        <Box>
          <Typography variant="h5" fontWeight={800}>Send template campaign</Typography>
          <Typography variant="body2" color="text.secondary">
            Pick an approved template → map each {'{{position}}'} to a variable or fixed value → choose the audience → send.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Stack spacing={2.5}>
            {/* Template */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <SectionTitle title="1 · Template" />
              <TextField
                select label="Approved template" value={templateId}
                onChange={(e) => loadTemplate(e.target.value)} fullWidth sx={{ mt: 1.5 }}>
                <MenuItem value="">— Select —</MenuItem>
                {templates.map((t) => (
                  <MenuItem key={t._id} value={t._id}>{t.name} · {t.language}</MenuItem>
                ))}
              </TextField>
              {templates.length === 0 && (
                <FormHelperText error>No APPROVED templates yet — submit one on the Templates page.</FormHelperText>
              )}
              <TextField
                label="Campaign name (optional)" value={name} onChange={(e) => setName(e.target.value)}
                fullWidth size="small" sx={{ mt: 2 }}
                placeholder="Dosa weekend promo"
              />
            </Card>

            {/* Variable mapping */}
            {template && (
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <SectionTitle title="2 · Fill the variables" hint="Each placeholder gets either a global variable (resolved per contact) or one fixed value for everyone." />
                <Stack spacing={1.75} sx={{ mt: 2 }}>
                  {positions.length === 0 && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>This template has no variables — everyone gets the same message.</Alert>
                  )}
                  {positions.map((p) => (
                    <Paper key={p} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Chip size="small" color="primary" label={`{{${p}}}`} sx={{ fontFamily: 'monospace' }} />
                      <RadioGroup
                        row value={bindings[p]?.mode || 'variable'}
                        onChange={(e) => setBinding(p, { mode: e.target.value })}
                        sx={{ mt: 1 }}
                      >
                        <FormControlLabel value="variable" control={<Radio size="small" />} label={<Typography variant="body2">Global variable</Typography>} />
                        <FormControlLabel value="fixed" control={<Radio size="small" />} label={<Typography variant="body2">Fixed value</Typography>} />
                      </RadioGroup>
                      {bindings[p]?.mode === 'variable' ? (
                        <TextField
                          select size="small" fullWidth
                          label="Variable"
                          value={bindings[p]?.variableId || ''}
                          onChange={(e) => setBinding(p, { variableId: e.target.value })}
                        >
                          {globalVars.map((v) => (
                            <MenuItem key={v._id} value={v._id}>
                              {v.name} — {v.source === 'static' ? `"${v.staticValue}"` : `per contact (${v.contactField})`}
                            </MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        <TextField
                          size="small" fullWidth label="Same value for every recipient"
                          value={bindings[p]?.value || ''}
                          onChange={(e) => setBinding(p, { value: e.target.value })}
                        />
                      )}
                    </Paper>
                  ))}

                  {headerBinding && (
                    <>
                      <Divider />
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Chip size="small" label="Header text" />
                        <RadioGroup
                          row value={headerBinding.mode}
                          onChange={(e) => setHeaderBinding({ mode: e.target.value })}
                          sx={{ mt: 1 }}
                        >
                          <FormControlLabel value="variable" control={<Radio size="small" />} label={<Typography variant="body2">Global variable</Typography>} />
                          <FormControlLabel value="fixed" control={<Radio size="small" />} label={<Typography variant="body2">Fixed value</Typography>} />
                        </RadioGroup>
                        {headerBinding.mode === 'variable' ? (
                          <TextField select size="small" fullWidth label="Variable"
                            value={headerBinding.variableId || ''}
                            onChange={(e) => setHeaderBinding({ mode: 'variable', variableId: e.target.value })}>
                            {globalVars.map((v) => <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>)}
                          </TextField>
                        ) : (
                          <TextField size="small" fullWidth label="Header value"
                            value={headerBinding.value || ''}
                            onChange={(e) => setHeaderBinding({ mode: 'fixed', value: e.target.value })} />
                        )}
                      </Paper>
                    </>
                  )}
                </Stack>
              </Card>
            )}

            {/* Audience */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <SectionTitle title="3 · Audience" hint="Only opted-in, non-blocked contacts receive messages." />
              <RadioGroup value={audienceType} onChange={(e) => { setAudienceType(e.target.value); setAudienceCount(null); }} sx={{ mt: 1 }}>
                <FormControlLabel value="all" control={<Radio />} label="All opted-in contacts" />
                <FormControlLabel value="tags" control={<Radio />} label="Contacts with specific tags" />
              </RadioGroup>
              {audienceType === 'tags' && (
                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1 }}>
                  {tags.length === 0 && <FormHelperText>No tags found — add tags to contacts first.</FormHelperText>}
                  {tags.map((tag) => (
                    <Chip
                      key={tag} clickable
                      label={tag}
                      color={selectedTags.includes(tag) ? 'primary' : 'default'}
                      onClick={() => {
                        setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
                        setAudienceCount(null);
                      }}
                    />
                  ))}
                </Stack>
              )}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
                <Button variant="outlined" size="small" startIcon={<GroupsRoundedIcon />} onClick={countAudience} disabled={counting}>
                  Count recipients
                </Button>
                {audienceCount !== null && (
                  <Typography variant="body2" fontWeight={700}>
                    {audienceCount} contact(s) will receive this campaign
                  </Typography>
                )}
              </Stack>
            </Card>

            <Button
              variant="contained" size="large"
              startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon />}
              disabled={sending || !template}
              onClick={handleSend}
            >
              {sending ? 'Starting…' : 'Send campaign'}
            </Button>
          </Stack>
        </Grid>

        {/* Live preview of what ONE recipient would get */}
        <Grid item xs={12} md={5}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <Card sx={{ borderRadius: 3, bgcolor: '#ECE5DD', p: 2, minHeight: 300 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1, bgcolor: '#075E54', color: '#fff', borderRadius: 2, mb: 2 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#128C7E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>WA</Box>
                <Typography fontSize={13} fontWeight={700}>Preview with current values</Typography>
              </Stack>
              {template ? (
                <Typography fontSize={13.5} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', bgcolor: '#DCF8C6', p: 1.25, borderRadius: 2, maxWidth: 340, ml: 'auto' }}>
                  {renderPreview(template.bodyText, bindings)}
                </Typography>
              ) : (
                <Typography color="text.secondary" variant="body2">Select a template to preview it here.</Typography>
              )}
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

function renderPreview(bodyText, bindings) {
  return (bodyText || '').replace(/\{\{(\d+)\}\}/g, (_, p) => {
    const b = bindings[p];
    if (!b) return `{{${p}}}`;
    if (b.mode === 'fixed') return b.value || '…';
    const varName = null;
    void varName;
    return '[per-contact value]';
  });
}

/* ------------------------------------------------------------------ */
/* PROGRESS                                                            */
/* ------------------------------------------------------------------ */
function BroadcastProgress({ broadcastId }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [broadcast, setBroadcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getBroadcast(broadcastId);
      setBroadcast(data);
    } catch (e) {
      showToast(e.message || 'Failed to load broadcast', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcastId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!broadcast) return undefined;
    if (!['sending', 'draft'].includes(broadcast.status)) return undefined;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [broadcast?.status, load]);

  const togglePause = async () => {
    setBusy(true);
    try {
      const res = broadcast.status === 'paused'
        ? await api.resumeBroadcast(broadcastId)
        : await api.pauseBroadcast(broadcastId);
      setBroadcast(res.broadcast);
      showToast(res.message, 'success');
    } catch (e) {
      showToast(e.message || 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress /></Box>;
  if (!broadcast) return <Alert severity="error">Broadcast not found</Alert>;

  const total = broadcast.stats?.total || 0;
  const sent = broadcast.liveStats?.sent || broadcast.stats?.sent || 0;
  const failed = (broadcast.liveStats?.failed || 0) + (broadcast.liveStats?.skipped || 0);
  const pending = broadcast.pending ?? Math.max(total - sent - failed, 0);
  const pct = total ? Math.round(((sent + failed) / total) * 100) : 0;

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/send-template')}><ArrowBackRoundedIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={800}>{broadcast.name}</Typography>
            <Chip size="small" label={broadcast.status.toUpperCase()} color={STATUS_COLORS[broadcast.status]} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Template: {broadcast.templateId?.name} · {broadcast.audience?.type === 'tags' ? `tags: ${(broadcast.audience.tagIds || []).join(', ')}` : 'all opted-in contacts'}
          </Typography>
        </Box>
        <IconButton onClick={load} title="Refresh"><RefreshRoundedIcon /></IconButton>
        {(broadcast.status === 'sending' || broadcast.status === 'paused') && (
          <Button
            variant="outlined" disabled={busy}
            startIcon={broadcast.status === 'paused' ? <PlayCircleOutlineRoundedIcon /> : <PauseCircleOutlineRoundedIcon />}
            onClick={togglePause}
          >
            {broadcast.status === 'paused' ? 'Resume' : 'Pause'}
          </Button>
        )}
      </Stack>

      <Card sx={{ borderRadius: 3, p: 3 }}>
        {['failed'].includes(broadcast.status) && broadcast.errorMessage && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{broadcast.errorMessage}</Alert>
        )}
        <LinearProgress
          variant="determinate" value={pct}
          sx={{ height: 10, borderRadius: 5, mb: 2 }}
          color={broadcast.status === 'failed' ? 'error' : 'primary'}
        />
        <Grid container spacing={2}>
          {[
            { label: 'Recipients', value: total },
            { label: 'Sent', value: sent },
            { label: 'In queue', value: pending },
            { label: 'Failed / skipped', value: failed },
          ].map(({ label, value }) => (
            <Grid item xs={6} sm={3} key={label}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800}>{value}</Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          {broadcast.status === 'sending'
            ? 'Sending in rate-limited batches (~80 msgs/sec Meta cap). This page updates automatically.'
            : broadcast.status === 'completed'
              ? `Completed ${broadcast.completedAt ? new Date(broadcast.completedAt).toLocaleString() : ''}`
              : 'Updates automatically while sending.'}
        </Typography>
      </Card>
    </Box>
  );
}

function SectionTitle({ title, hint }) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Box>
  );
}
