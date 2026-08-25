import { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Avatar, Chip, Divider, Button,
  Alert, Skeleton, TextField, Paper, InputAdornment, IconButton,
  Stepper, Step, StepLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, CircularProgress,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const STATUS_COLORS = {
  APPROVED: 'success',
  PENDING: 'warning',
  DRAFT: 'default',
  REJECTED: 'error',
  PAUSED: 'warning',
  DISABLED: 'error',
};

const QUALITY_LABELS = {
  GREEN: { label: 'High quality', color: '#17C994' },
  YELLOW: { label: 'Medium quality', color: '#F59E0B' },
  RED: { label: 'Low quality', color: '#EF4444' },
  UNKNOWN: { label: 'Unknown', color: '#94A3B8' },
};

const EMPTY_FORM = {
  accessToken: '',
  phoneNumberId: '',
  wabaId: '',
  appSecret: '',
  pin: '',
};

export default function ConnectWhatsApp() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [waConfig, setWaConfig] = useState(null);
  const [webhookInfo, setWebhookInfo] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [subState, setSubState] = useState({ checking: false, subscribed: null, subscribing: false });

  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});

  const configured = !!waConfig?.configured;
  // Not-yet-configured tenants always see an editable form
  const isEditing = editing || !configured;

  useEffect(() => {
    if (waConfig?.config) {
      setForm((f) => ({
        ...f,
        phoneNumberId: waConfig.config.phoneNumberId || f.phoneNumberId,
        wabaId: waConfig.config.wabaId || f.wabaId,
      }));
    }
  }, [waConfig]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, tplRes] = await Promise.allSettled([
        api.getWaConfig(),
        api.listTemplates(),
      ]);
      if (cfgRes.status === 'fulfilled') setWaConfig(cfgRes.value);
      if (tplRes.status === 'fulfilled') setTemplates(tplRes.value.templates || []);
      try {
        setWebhookInfo(await api.getWebhookInfo());
      } catch {
        /* webhook info requires saved config — ignore */
      }
      try {
        const sub = await api.getWebhookSubscription();
        setSubState((s) => ({ ...s, checking: false, subscribed: !!sub.subscribed }));
      } catch {
        setSubState((s) => ({ ...s, checking: false, subscribed: null }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const toggleSecret = (field) => () =>
    setShowSecrets((s) => ({ ...s, [field]: !s[field] }));

  const secretFieldProps = (field) => ({
    InputProps: {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton size="small" onClick={toggleSecret(field)} edge="end">
            {showSecrets[field] ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
          </IconButton>
        </InputAdornment>
      ),
    },
    type: showSecrets[field] ? 'text' : 'password',
  });

  const handleSaveAndConnect = async () => {
    // Build payload from non-empty fields only — blanks keep stored values
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => String(v).trim() !== '')
    );

    if (!configured && (!payload.accessToken || !payload.phoneNumberId || !payload.wabaId)) {
      showToast('Access Token, Phone Number ID and WABA ID are required', 'error');
      return;
    }
    if (configured && !payload.phoneNumberId) {
      showToast('Phone Number ID is required', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.saveWaConfig(payload);
      showToast('Credentials saved', 'success');
      setConnecting(true);
      try {
        const res = await api.connectWhatsApp();
        showToast('WhatsApp connected successfully', 'success');
        if (res?.templateSync && res.templateSync.total > 0) {
          showToast(`Imported ${res.templateSync.created + res.templateSync.updated} template(s) from Meta`, 'info');
        }
        setEditing(false);
        await loadAll();
      } catch (err) {
        showToast(err.message || 'Meta rejected the credentials', 'error');
      } finally {
        setConnecting(false);
      }
    } catch (err) {
      showToast(err.message || 'Could not save credentials', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setForm(EMPTY_FORM);
  };

  const handleDisconnect = async () => {
    try {
      await api.disconnectWhatsApp();
      showToast('WhatsApp disconnected', 'info');
      await loadAll();
    } catch (err) {
      showToast(err.message || 'Disconnect failed', 'error');
    }
  };

  const handleSyncTemplates = async () => {
    setSyncing(true);
    try {
      const res = await api.syncTemplates();
      if (res?.errors > 0) {
        showToast(`Synced with ${res.errors} error(s): ${res.errorDetails?.[0]?.message || ''}`, 'warning');
      } else {
        showToast(`Synced: ${res.created} new, ${res.updated} updated`, 'success');
      }
      const tplRes = await api.listTemplates();
      setTemplates(tplRes.templates || []);
    } catch (err) {
      showToast(err.message || 'Template sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`, 'success');
    } catch {
      showToast('Copy failed — select the text manually', 'error');
    }
  };

  const connected = !!waConfig?.configured && waConfig?.config?.status === 'connected';

  if (loading) {
    return (
      <Box>
        <Stack spacing={2.5}>
          <Skeleton variant="text" width={260} height={36} />
          <Grid container spacing={2.5}>
            <Grid item xs={12} lg={7}><Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} /></Grid>
            <Grid item xs={12} lg={5}><Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} /></Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 44, height: 44, bgcolor: '#25D3661f', color: '#25D366' }}>
            <WhatsAppIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800}>Connect WhatsApp</Typography>
            <Typography variant="body2" color="text.secondary">
              Link your Meta WhatsApp Cloud API credentials, configure the webhook and import templates.
            </Typography>
          </Box>
        </Stack>
        <Chip
          icon={connected ? <CheckCircleRoundedIcon /> : <ErrorRoundedIcon />}
          label={connected ? `Connected${waConfig?.config?.displayPhoneNumber ? ` · ${waConfig.config.displayPhoneNumber}` : ''}` : 'Not connected'}
          color={connected ? 'success' : 'warning'}
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      <Grid container spacing={2.5}>
        {/* LEFT: credentials + connection */}
        <Grid item xs={12} lg={7}>
          <Stack spacing={2.5}>
            {connected && !waConfig?.config?.isRegistered && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Credentials are valid, but this phone number is not registered for Cloud API messaging yet.
                Enter your <strong>6-digit registration PIN</strong> above and click Reconnect to finish registration.
              </Alert>
            )}

            {/* Connection status card */}
            {connected && waConfig?.config && (
              <Card sx={{ p: 3, borderRadius: 3, borderLeft: '4px solid #17C994' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={800}>Connection</Typography>
                  <Button size="small" color="error" onClick={handleDisconnect}>Disconnect</Button>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <StatusItem label="Business number" value={waConfig.config.displayPhoneNumber || '—'} />
                  <StatusItem label="Verified name" value={waConfig.config.verifiedName || '—'} />
                  <StatusItem
                    label="Quality rating"
                    value={
                      <Chip
                        size="small"
                        label={QUALITY_LABELS[waConfig.config.qualityRating]?.label || 'Unknown'}
                        sx={{
                          bgcolor: `${QUALITY_LABELS[waConfig.config.qualityRating]?.color || '#94A3B8'}1a`,
                          color: QUALITY_LABELS[waConfig.config.qualityRating]?.color,
                          fontWeight: 700,
                        }}
                      />
                    }
                  />
                  <StatusItem label="Registered" value={waConfig.config.isRegistered ? 'Yes' : 'No'} />
                </Grid>
              </Card>
            )}

            {/* Credentials form */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight={800}>API credentials</Typography>
                <Tooltip title="Open Meta App Dashboard — WhatsApp > API Setup">
                  <Button
                    size="small"
                    variant="text"
                    endIcon={<OpenInNewRoundedIcon />}
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Meta Dashboard
                  </Button>
                </Tooltip>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Find these under developers.facebook.com → your app → WhatsApp → API Setup.
                Values are encrypted before storage and never returned by the API again.
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="Permanent access token"
                  placeholder={configured ? 'Saved — leave blank to keep current' : 'EAAG...'}
                  value={form.accessToken}
                  onChange={setField('accessToken')}
                  fullWidth
                  required={!configured}
                  disabled={!isEditing}
                  {...secretFieldProps('accessToken')}
                  helperText={
                    configured && !isEditing
                      ? 'Stored encrypted — never displayed again'
                      : isEditing && configured
                        ? 'Leave blank to keep the saved token'
                        : 'System-user token with whatsapp_business_messaging + whatsapp_business_management permissions'
                  }
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Phone Number ID"
                    value={form.phoneNumberId}
                    onChange={setField('phoneNumberId')}
                    fullWidth
                    required
                    disabled={!isEditing}
                    helperText="'Phone number ID' on the API Setup page"
                  />
                  <TextField
                    label="WhatsApp Business Account ID"
                    value={form.wabaId}
                    onChange={setField('wabaId')}
                    fullWidth
                    required
                    disabled={!isEditing}
                    helperText="'WhatsApp Business Account ID' on the API Setup page"
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="App secret"
                    placeholder={configured ? 'Saved — leave blank to keep current' : ''}
                    value={form.appSecret}
                    onChange={setField('appSecret')}
                    fullWidth
                    disabled={!isEditing}
                    {...secretFieldProps('appSecret')}
                    helperText="App settings > Basic — used to verify webhook signatures"
                  />
                  <TextField
                    label="Registration PIN (6 digits)"
                    placeholder={configured ? 'Saved — leave blank to keep current' : ''}
                    value={form.pin}
                    onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    fullWidth
                    disabled={!isEditing}
                    inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                    helperText="Two-step verification PIN — enables phone registration"
                  />
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                {isEditing ? (
                  <>
                    <Button
                      variant="contained"
                      startIcon={(saving || connecting) ? <CircularProgress size={18} color="inherit" /> : <LinkRoundedIcon />}
                      disabled={saving || connecting}
                      onClick={handleSaveAndConnect}
                    >
                      {saving ? 'Saving…' : connecting ? 'Verifying with Meta…' : configured ? 'Save & Reconnect' : 'Save & Connect'}
                    </Button>
                    {configured && (
                      <Button color="inherit" disabled={saving || connecting} onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<EditRoundedIcon />}
                      onClick={() => setEditing(true)}
                    >
                      Edit credentials
                    </Button>
                    <Button
                      variant="text"
                      startIcon={<LinkRoundedIcon />}
                      onClick={async () => {
                        setConnecting(true);
                        try {
                          const res = await api.connectWhatsApp();
                          showToast('Reconnected successfully', 'success');
                          if (res?.templateSync && res.templateSync.total > 0) {
                            showToast(`Imported ${res.templateSync.created + res.templateSync.updated} template(s)`, 'info');
                          }
                          await loadAll();
                        } catch (err) {
                          showToast(err.message || 'Reconnect failed', 'error');
                        } finally {
                          setConnecting(false);
                        }
                      }}
                      disabled={connecting}
                    >
                      {connecting ? <CircularProgress size={18} /> : 'Reconnect'}
                    </Button>
                  </>
                )}
              </Stack>
            </Card>

            {/* Templates */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(15,123,108,0.08)', color: 'primary.main' }}>
                    <DescriptionRoundedIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800}>Message templates</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Import templates approved in your Meta WABA account
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncRoundedIcon />}
                  disabled={syncing || !connected}
                  onClick={handleSyncTemplates}
                >
                  {syncing ? 'Syncing…' : 'Import / Sync'}
                </Button>
              </Stack>

              {!connected && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                  Connect WhatsApp first — template import needs your access token and WABA ID.
                </Alert>
              )}

              {templates.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Language</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {templates.map((t) => (
                        <TableRow key={t._id}>
                          <TableCell sx={{ fontWeight: 600 }}>{t.name}</TableCell>
                          <TableCell>{t.category}</TableCell>
                          <TableCell>{t.language}</TableCell>
                          <TableCell>
                            <Chip size="small" label={t.status} color={STATUS_COLORS[t.status] || 'default'} variant="outlined" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </Stack>
        </Grid>

        {/* RIGHT: webhook setup guide */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>Webhook configuration</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Paste these two values in Meta → your app → WhatsApp → Configuration, then click “Verify and save”.
            </Typography>

            <Stepper orientation="vertical" activeStep={-1} sx={{ '& .MuiStepLabel-label': { textAlign: 'left' } }}>
              <Step expanded>
                <StepLabel icon={<BadgeRoundedIcon fontSize="small" />}>Callback URL</StepLabel>
                <Box sx={{ pl: 4, pr: 1, pb: 2 }}>
                  <CopyField
                    mono
                    value={webhookInfo?.callbackUrl || 'Save credentials first to generate this'}
                    onCopy={() => copyToClipboard(webhookInfo?.callbackUrl, 'Callback URL')}
                    disabled={!webhookInfo?.callbackUrl}
                  />
                </Box>
              </Step>
              <Step expanded>
                <StepLabel icon={<KeyRoundedIcon fontSize="small" />}>Verify token</StepLabel>
                <Box sx={{ pl: 4, pr: 1, pb: 2 }}>
                  <CopyField
                    mono
                    value={webhookInfo?.verifyToken || 'Save credentials first to generate this'}
                    onCopy={() => copyToClipboard(webhookInfo?.verifyToken, 'Verify token')}
                    disabled={!webhookInfo?.verifyToken}
                  />
                </Box>
              </Step>
              <Step expanded>
                <StepLabel icon={<CheckCircleRoundedIcon fontSize="small" />}>Subscribe to events</StepLabel>
                <Box sx={{ pl: 4, pr: 1, pb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Subscribe to <strong>messages</strong> and <strong>message_template_status_update</strong> so delivery
                    statuses and template approvals reach this app instantly.
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
                    {subState.subscribed == null ? (
                      <Chip size="small" label={subState.checking ? 'Checking…' : 'Unknown'} variant="outlined" />
                    ) : subState.subscribed ? (
                      <Chip size="small" color="success" label="Webhooks active" />
                    ) : (
                      <Chip size="small" color="warning" label="Not subscribed" variant="outlined" />
                    )}
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!configured || subState.subscribing || subState.subscribed}
                      startIcon={subState.subscribing ? <CircularProgress size={16} color="inherit" /> : undefined}
                      onClick={async () => {
                        setSubState((s) => ({ ...s, subscribing: true }));
                        try {
                          await api.subscribeWebhooks();
                          setSubState((s) => ({ ...s, subscribed: true }));
                          showToast('Subscribed — template approvals now arrive instantly', 'success');
                        } catch (e) {
                          showToast(e.message || 'Subscription failed', 'error');
                        } finally {
                          setSubState((s) => ({ ...s, subscribing: false }));
                        }
                      }}
                    >
                      {subState.subscribed ? 'Active' : 'Enable instantly'}
                    </Button>
                  </Stack>
                  {!configured && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                      Save your credentials first — this uses the stored access token, no Meta dashboard needed.
                    </Typography>
                  )}
                </Box>
              </Step>
            </Stepper>

            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              The callback URL must be publicly reachable over HTTPS. In production set the{' '}
              <code>APP_URL</code> env variable on the backend so it matches your Render domain.
            </Alert>
          </Card>

          <Card sx={{ p: 3, borderRadius: 3, mt: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>Workspace</Typography>
            <Stack spacing={1.5}>
              <InfoRow label="Tenant ID" value={user?.tenantId || '—'} mono />
              <InfoRow label="Connected as" value={user?.email || '—'} />
              <InfoRow label="Last synced" value={waConfig?.config?.lastSyncAt ? new Date(waConfig.config.lastSyncAt).toLocaleString() : 'Never'} />
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function StatusItem({ label, value }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700}>{value}</Typography>
    </Grid>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
        {value}
      </Typography>
    </Stack>
  );
}

function CopyField({ value, onCopy, mono, disabled }) {
  return (
    <TextField
      value={value}
      size="small"
      fullWidth
      multiline={String(value).length > 40}
      disabled={disabled}
      InputProps={{
        readOnly: true,
        sx: { fontFamily: mono ? 'monospace' : 'inherit', fontSize: 13 },
        endAdornment: !disabled && (
          <InputAdornment position="end">
            <IconButton size="small" onClick={onCopy} edge="end">
              <ContentCopyRoundedIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
