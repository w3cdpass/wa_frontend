import { useCallback, useEffect, useState } from 'react';
import {
  Box, Card, Stack, Typography, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip, CircularProgress,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import WhatsAppBubble, { extractVars } from '../components/WhatsAppBubble';
import Grid from '@mui/material/Grid';

const CONTACT_FIELD_OPTIONS = [
  { value: 'name', label: 'Contact name' },
  { value: 'phone', label: 'Phone number' },
  { value: 'customFields.city', label: 'City (custom field)' },
  { value: 'customFields.order_id', label: 'Order ID (custom field)' },
  { value: 'customFields.plan', label: 'Plan (custom field)' },
];

const EMPTY_FORM = { name: '', source: 'static', staticValue: '', contactField: '', description: '' };

// ---- Interactive demo: shows exactly how {{1}}, {{2}} get replaced at send time ----
function VariablePlayground() {
  const [bodyText, setBodyText] = useState('Hi! On this {{1}} there is {{2}}% off today only. Visit {{3}}!');
  const vars = extractVars(bodyText);
  const [values, setValues] = useState({ 1: 'Masala Dosa', 2: '20', 3: 'www.mydosa.com' });

  const setValue = (k, v) => setValues((prev) => ({ ...prev, [k]: v }));
  const ordered = vars.map((v) => values[v] || '');

  // This is the literal JSON your backend sends to Meta when the campaign goes out
  const metaPayload = {
    messaging_product: 'whatsapp',
    to: '<recipient phone>',
    type: 'template',
    template: {
      name: 'your_template_name',
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: vars.map((v) => ({ type: 'text', text: values[v] || `<value for {{${v}}}>` })),
        },
      ],
    },
  };

  return (
    <Card sx={{ borderRadius: 3, p: 3, mb: 2.5 }}>
      <Typography fontWeight={800} gutterBottom>Try it — see how variables get filled</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Edit the message and the sample values. The preview on the right is what each recipient receives,
        and below it is the exact payload sent to Meta.
      </Typography>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Template body"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            fullWidth
            multiline
            rows={3}
            helperText="Type {{1}}, {{2}}, {{3}}… wherever you want dynamic values"
          />
          <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
            {vars.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  No variables in this text. Add {'{{1}}'} to the body above to see substitution.
                </Alert>
              </Grid>
            )}
            {vars.map((v, i) => (
              <Grid item xs={12} sm={4} key={v}>
                <TextField
                  size="small"
                  fullWidth
                  label={`Value for position ${i + 1}`}
                  value={values[v] || ''}
                  onChange={(e) => setValue(v, e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ mr: 0.75, fontFamily: 'monospace', fontSize: 11, color: '#0288d1', bgcolor: '#E1F5FE', border: '1px solid #B3E5FC', borderRadius: 0.75, px: 0.5 }}>
                        {`{{${v}}}`}
                      </Box>
                    ),
                  }}
                />
              </Grid>
            ))}
          </Grid>

          {vars.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                WHAT GETS SENT TO META (per recipient):
              </Typography>
              <Box
                component="pre"
                sx={{
                  mt: 0.5, p: 1.5, borderRadius: 2, overflowX: 'auto',
                  bgcolor: '#0D1117', color: '#7EE787', fontSize: 11.5, lineHeight: 1.5,
                }}
              >
                {JSON.stringify(metaPayload, null, 2)}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Meta replaces {'{{1}}'} with parameters[0], {'{{2}}'} with parameters[1]… For a campaign this happens
                automatically for every contact — static variables insert the same value, contact variables pull each
                person&apos;s data.
              </Typography>
            </Box>
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ bgcolor: '#ECE5DD', borderRadius: 2, p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1, bgcolor: '#075E54', color: '#fff', borderRadius: 2, mb: 2 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#128C7E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>WA</Box>
              <Box>
                <Typography fontSize={13} fontWeight={700}>Your Business</Typography>
                <Typography fontSize={10.5} sx={{ opacity: 0.8 }}>what recipient sees</Typography>
              </Box>
            </Stack>
            <WhatsAppBubble
              template={{
                templateType: 'standard',
                headerType: 'none',
                bodyText,
                sampleValues: { body: ordered },
              }}
              maxWidth={320}
            />
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

export default function Variables() {

  const { showToast } = useToast();
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listVariables();
      setVariables(res.variables || []);
    } catch (e) {
      showToast(e.message || 'Failed to load variables', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (v) => {
    setEditingId(v._id);
    setForm({
      name: v.name,
      source: v.source,
      staticValue: v.staticValue || '',
      contactField: v.contactField || '',
      description: v.description || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return showToast('Name is required', 'error');
    if (form.source === 'contact' && !form.contactField) return showToast('Pick a contact field', 'error');
    if (form.source === 'static' && !form.staticValue.trim()) return showToast('Static value is required', 'error');
    setSaving(true);
    try {
      if (editingId) {
        await api.updateVariable(editingId, form);
        showToast('Variable updated', 'success');
      } else {
        await api.createVariable(form);
        showToast('Variable created', 'success');
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      showToast(e.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete variable "${v.name}"? Campaigns using it will stop resolving that placeholder.`)) return;
    try {
      await api.deleteVariable(v._id);
      showToast('Variable deleted', 'success');
      await load();
    } catch (e) {
      showToast(e.message || 'Delete failed', 'error');
    }
  };

  const previewValue = (v) =>
    v.source === 'contact'
      ? `→ contact.${(v.contactField || '').replace('customFields.', 'customFields.')}`
      : `"${v.staticValue}"`;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Global variables</Typography>
          <Typography variant="body2" color="text.secondary">
            Reusable values your templates can reference. Bind them to template positions when composing a campaign.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          New variable
        </Button>
      </Stack>

      <Alert severity="info" sx={{ borderRadius: 2, mb: 2.5 }}>
        <strong>How variables work:</strong> WhatsApp templates use numbered placeholders like {'{{1}}'} and {'{{2}}'}.
        When you send a campaign, each position gets a real value per recipient. A variable like{' '}
        <code>customer_name</code> mapped to “Contact name” fills {'{{1}}'} with each person&apos;s actual name — one
        template, personalised for everyone.
      </Alert>

      {/* Interactive example so users can see substitution happen */}
      <VariablePlayground />

      {/* How the SAME template renders differently per recipient */}
      <Card sx={{ borderRadius: 3, p: 3, mb: 2.5 }}>
        <Typography fontWeight={800} gutterBottom>How values become dynamic per person</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          A variable mapped to a <strong>contact field</strong> resolves individually for every recipient at send time,
          using data stored on each contact (Contacts page, including custom fields filled via CSV import).
          Same template, different result:
        </Typography>
        <Grid container spacing={2}>
          {[
            { name: 'Ravi Sharma', phone: '+91 98765 43210', order_id: '#45211', city: 'Mumbai' },
            { name: 'Priya Patel', phone: '+91 91234 56789', order_id: '#45212', city: 'Surat' },
          ].map((c) => (
            <Grid item xs={12} md={6} key={c.name}>
              <Stack spacing={0.75} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Contact record → <strong>{c.name}</strong> · city={c.city} · order_id={c.order_id}
                </Typography>
              </Stack>
              <Box sx={{ bgcolor: '#ECE5DD', borderRadius: 2, p: 2 }}>
                <WhatsAppBubble
                  template={{
                    templateType: 'standard',
                    headerType: 'none',
                    bodyText: 'Hi {{customer_name}}! Your order {{order_id}} is out for delivery in {{city}} 🛵',
                    sampleValues: { body: [c.name, c.order_id, c.city] },
                  }}
                  maxWidth={320}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
        <Alert severity="success" icon={<InfoOutlinedIcon fontSize="small" />} sx={{ mt: 2, borderRadius: 2 }}>
          <Typography variant="caption">
            One approved template → thousands of personalised messages. The broadcast engine swaps in each contact&apos;s
            real data automatically — <code>customer_name</code> maps to Contact name, <code>order_id</code>/<code>city</code>{' '}
            map to custom fields on their contact profile.
          </Typography>
        </Alert>
      </Card>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Resolves to</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : variables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No variables yet.</Typography>
                    <Button startIcon={<AddRoundedIcon />} onClick={openCreate} sx={{ mt: 1 }}>
                      Create your first variable
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                variables.map((v) => (
                  <TableRow key={v._id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Typography fontWeight={700}>{v.name}</Typography>
                        <Tooltip title="Copy name">
                          <IconButton size="small" onClick={() => { navigator.clipboard.writeText(v.name); showToast('Copied', 'success'); }}>
                            <ContentCopyRoundedIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={v.source === 'static' ? 'Static' : 'From contact'}
                        color={v.source === 'static' ? 'default' : 'primary'}
                        variant={v.source === 'static' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {previewValue(v)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{v.description || '—'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(v)}><EditRoundedIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(v)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={800}>{editingId ? 'Edit variable' : 'New variable'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Variable name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
              helperText="lowercase_snake_case — e.g. customer_name, coupon_code"
              fullWidth
            />
            <TextField
              select
              label="Type"
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              fullWidth
              helperText={
                form.source === 'static'
                  ? 'Same value for every recipient'
                  : 'Resolved per recipient from their contact profile'
              }
            >
              <MenuItem value="static">Static — fixed value</MenuItem>
              <MenuItem value="contact">Contact field — personalised</MenuItem>
            </TextField>
            {form.source === 'static' ? (
              <TextField
                label="Value"
                placeholder='e.g. "Flat 20% off this week"'
                value={form.staticValue}
                onChange={(e) => setForm((f) => ({ ...f, staticValue: e.target.value }))}
                fullWidth
              />
            ) : (
              <TextField
                select
                label="Contact field"
                value={form.contactField}
                onChange={(e) => setForm((f) => ({ ...f, contactField: e.target.value }))}
                fullWidth
              >
                {CONTACT_FIELD_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            )}
            <TextField
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              inputProps={{ maxLength: 200 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {editingId ? 'Save changes' : 'Create variable'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
