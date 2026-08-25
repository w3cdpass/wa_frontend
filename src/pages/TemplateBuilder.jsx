import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, Typography, Stack, Button, TextField, MenuItem, Chip,
  Alert, IconButton, Tooltip, Paper, InputAdornment, RadioGroup,
  FormControlLabel, Radio, FormHelperText, CircularProgress,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DataObjectRoundedIcon from '@mui/icons-material/DataObjectRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useToast } from '../context/ToastContext';
import WhatsAppBubble, { BUTTON_ICONS } from '../components/WhatsAppBubble';
import api from '../api/api';
import { checkTemplateCompliance } from '../utils/templateCompliance';
import {
  CATEGORIES, LANGUAGES, BUTTON_TYPES, BUTTON_RULES, TEMPLATE_TYPES,
  LIMITS, extractVariables,
} from '../utils/templateConstants';

const EMPTY_STATE = {
  name: '',
  category: 'MARKETING',
  language: 'en_US',
  templateType: 'standard',
  headerType: 'none',
  headerContent: '',
  headerMediaUrl: '',
  bodyText: '',
  footerText: '',
  buttons: [],
  cards: [],
  sampleValues: { body: [], header: [] },
};

export default function TemplateBuilder() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_STATE);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // ---- Global variables ----
  // Users type {{product_name}} in the body. WhatsApp only accepts numbered
  // placeholders, so we convert names to {{1}},{{2}}… on save and auto-fill
  // reviewer samples from each variable's definition.
  const [globalVars, setGlobalVars] = useState([]);
  useEffect(() => {
    api.listVariables()
      .then((res) => setGlobalVars(res.variables || []))
      .catch(() => {});
  }, []);

  const TOKEN_RE = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*|\d+)\s*\}\}/g;
  const CONTACT_DEMO_VALUES = {
    name: 'Ravi Sharma',
    phone: '+91 98765 43210',
    tags: 'vip, regular',
  };

  function analyzeVars(text) {
    const assign = new Map();
    const positions = [];
    let n = 0;
    const idOf = (raw) => (/^\d+$/.test(raw) ? `#${raw}` : `n:${raw.toLowerCase()}`);
    for (const m of String(text || '').matchAll(TOKEN_RE)) {
      const raw = m[1];
      const id = idOf(raw);
      if (!assign.has(id)) {
        n += 1;
        assign.set(id, n);
        positions.push({ num: n, raw, id });
      }
    }
    const normalized = String(text || '').replace(TOKEN_RE, (_, raw) => `{{${assign.get(idOf(raw))}}}`);
    return { normalized, positions };
  }

  const varForName = (raw) => (/^\d+$/.test(raw)
    ? null
    : globalVars.find((v) => v.name === raw.toLowerCase()));

  function autoSample(entry) {
    if (entry.id.startsWith('#')) return '';
    const v = varForName(entry.raw);
    if (!v) return '';
    if (v.source === 'static') return v.staticValue || '';
    if (v.contactField?.startsWith('customFields.')) return 'Sample';
    return CONTACT_DEMO_VALUES[v.contactField] || 'Sample';
  }

  // Body analysis: named tokens -> sequential numbers, with live samples
  const bodyAnalysis = useMemo(() => analyzeVars(form.bodyText), [form.bodyText]);
  const [bodyOverrides, setBodyOverrides] = useState({});
  const samples = useMemo(
    () => bodyAnalysis.positions.map(
      (p) => (bodyOverrides[p.num] !== undefined ? bodyOverrides[p.num] : autoSample(p))
    ),
    [bodyAnalysis, bodyOverrides, globalVars]
  );

  const unknownBodyVars = bodyAnalysis.positions
    .filter((p) => p.id.startsWith('n:') && !varForName(p.raw))
    .map((p) => p.raw);

  const headerAnalysis = useMemo(
    () => (form.headerType === 'text' ? analyzeVars(form.headerContent) : { normalized: '', positions: [] }),
    [form.headerType, form.headerContent]
  );
  const [headerOverride, setHeaderOverride] = useState(null);
  const headerSample = useMemo(() => (
    headerAnalysis.positions.length === 0
      ? null
      : headerOverride ?? autoSample(headerAnalysis.positions[0]) ?? ''
  ), [headerAnalysis, headerOverride, globalVars]);

  // Legacy numeric list kept for helper-text counts
  const bodyVars = bodyAnalysis.positions;

  const setSample = (num, value) => {
    setBodyOverrides((prev) => ({ ...prev, [num]: value }));
  };

  const insertVariable = (name) => {
    setForm((f) => ({
      ...f,
      bodyText: `${f.bodyText}${f.bodyText && !f.bodyText.endsWith(' ') ? ' ' : ''}{{${name}}}`,
    }));
  };

  const insertNumbered = () => {
    const n = bodyAnalysis.positions.length + 1;
    setForm((f) => ({ ...f, bodyText: `${f.bodyText}{{${n}}}` }));
  };

  // ---- buttons ----
  const addButtonType = (type) => {
    setForm((f) => ({
      ...f,
      buttons: [
        ...f.buttons,
        {
          type, text: '', url: '', phoneNumber: '', example: '',
          flowId: '', catalogId: '', productRetailerId: '',
        },
      ],
    }));
  };

  const updateButton = (idx, patch) => {
    setForm((f) => {
      const buttons = f.buttons.map((b, i) => (i === idx ? { ...b, ...patch } : b));
      return { ...f, buttons };
    });
  };

  const removeButton = (idx) => {
    setForm((f) => ({ ...f, buttons: f.buttons.filter((_, i) => i !== idx) }));
  };

  const nonQuickCount = form.buttons.filter((b) => b.type !== 'QUICK_REPLY').length;
  const quickCount = form.buttons.length - nonQuickCount;

  // ---- carousel cards ----
  const addCard = () => {
    setForm((f) => ({ ...f, cards: [...f.cards, { headerMediaUrl: '', bodyText: '', buttons: [] }] }));
  };
  const updateCard = (idx, patch) =>
    setForm((f) => ({ ...f, cards: f.cards.map((c, i) => (i === idx ? { ...c, ...patch } : c)) }));
  const removeCard = (idx) =>
    setForm((f) => ({ ...f, cards: f.cards.filter((_, i) => i !== idx) }));

  const switchType = (type) => {
    setForm((f) => ({
      ...f,
      templateType: type,
      ...(type === 'carousel'
        ? { category: 'MARKETING', cards: f.cards.length ? f.cards : [{ headerMediaUrl: '', bodyText: '', buttons: [] }, { headerMediaUrl: '', bodyText: '', buttons: [] }] }
        : {}),
    }));
  };

  const validateLocal = () => {
    if (!form.name.trim()) return 'Template name is required';
    if (!/^[a-z0-9_]+$/.test(form.name)) return 'Name must be lowercase letters, numbers, underscores';
    if (!form.bodyText.trim()) return 'Body text is required';
    if (form.templateType === 'carousel') {
      if (form.cards.length < 2) return 'Carousel needs at least 2 cards';
      for (let i = 0; i < form.cards.length; i++) {
        if (!/^https?:\/\//.test(form.cards[i].headerMediaUrl || '')) return `Card ${i + 1}: image URL is required`;
        if (!form.cards[i].bodyText.trim()) return `Card ${i + 1}: body text is required`;
      }
    } else {
      if (['image', 'video', 'document'].includes(form.headerType) && !/^https?:\/\//.test(form.headerMediaUrl)) {
        return 'Header media URL is required';
      }
      if (form.headerType === 'text' && !form.headerContent.trim()) return 'Header text is required';
    }
    if (nonQuickCount > BUTTON_RULES.MAX_NON_QUICK) return `Max ${BUTTON_RULES.MAX_NON_QUICK} URL / phone / copy-code buttons combined`;
    for (const b of form.buttons) {
      if (!b.text.trim()) return 'Every button needs text';
      if (b.type === 'URL' && !/^https?:\/\//.test(b.url || '')) return `Button "${b.text}": a valid URL is required`;
      if (b.type === 'PHONE_NUMBER' && !/^\+?\d{7,20}$/.test(b.phoneNumber || '')) return `Button "${b.text}": phone number with country code is required`;
      if (b.type === 'FLOW' && !b.flowId.trim()) return `Button "${b.text}": flow ID is required`;
      if (b.type === 'CATALOG' && !b.catalogId.trim()) return `Button "${b.text}": catalog ID is required`;
    }
    // every variable should have a sample so Meta can review the template
    if (unknownBodyVars.length > 0) {
      return `Unknown variable(s): ${unknownBodyVars.map((v) => `{{${v}}}`).join(', ')} — create ${unknownBodyVars.length > 1 ? 'them' : 'it'} on the Variables page first`;
    }
    if (samples.some((s) => !String(s).trim())) return 'Fill in a sample value for every {{variable}} — Meta reviews these';
    return null;
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    category: form.category,
    language: form.language,
    templateType: form.templateType,
    headerType: form.templateType === 'carousel' ? 'none' : form.headerType,
    headerContent: form.headerType === 'text' ? headerAnalysis.normalized : null,
    headerMediaUrl: ['image', 'video', 'document'].includes(form.headerType) ? form.headerMediaUrl : null,
    bodyText: bodyAnalysis.normalized,
    footerText: form.footerText || null,
    buttons: form.templateType === 'carousel' ? [] : form.buttons.map(cleanButton),
    cards:
      form.templateType === 'carousel'
        ? form.cards.map((c) => ({
            headerMediaUrl: c.headerMediaUrl,
            bodyText: analyzeVars(c.bodyText).normalized,
            buttons: c.buttons.map(cleanButton),
          }))
        : [],
    sampleValues: {
      body: samples.map((s) => String(s ?? '')),
      header: headerSample != null ? [headerSample] : [],
    },
  });

  const cleanButton = (b) => ({
    type: b.type,
    text: b.text.trim(),
    ...(b.type === 'URL' ? { url: b.url, example: extractVariables(b.url || '').length ? b.example : undefined } : {}),
    ...(b.type === 'PHONE_NUMBER' ? { phoneNumber: b.phoneNumber } : {}),
    ...(b.type === 'COPY_CODE' ? { example: b.example || undefined } : {}),
    ...(b.type === 'FLOW' ? { flowId: b.flowId, flowAction: 'NAVIGATE' } : {}),
    ...(b.type === 'CATALOG' ? { catalogId: b.catalogId, productRetailerId: b.productRetailerId || undefined, isSingleProduct: false } : {}),
  });

  // Live Meta-guideline check — same rules the backend enforces before submit
  const compliance = useMemo(() => checkTemplateCompliance({
    category: form.category,
    language: form.language,
    headerType: form.headerType,
    headerContent: headerAnalysis.normalized,
    bodyText: bodyAnalysis.normalized,
    footerText: form.footerText,
    buttons: form.buttons.map(cleanButton),
    cards: form.cards.map((c) => ({ bodyText: c.bodyText, buttons: c.buttons })),
    sampleValues: {
      body: samples.map((s) => String(s ?? '')),
      header: headerSample != null ? [String(headerSample)] : [],
    },
  }), [form, bodyAnalysis, headerAnalysis, samples, headerSample]);

  const handleSave = async () => {
    const err = validateLocal();
    if (err) return showToast(err, 'error');
    setSaving(true);
    try {
      await api.createTemplate(buildPayload());
      showToast('Draft saved', 'success');
      navigate('/templates');
    } catch (e) {
      showToast(e.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const err = validateLocal();
    if (err) return showToast(err, 'error');
    if (!compliance.passed) {
      showToast(compliance.errors[0].message, 'error');
      return;
    }
    if (
      compliance.warnings.length
      && !window.confirm(
        `${compliance.warnings.length} approval risk${compliance.warnings.length > 1 ? 's' : ''} detected:\n\n- ${compliance.warnings.map((w) => w.message).join('\n- ')}\n\nSubmit anyway? Meta may reject or reclassify the template.`,
      )
    ) return;
    setSubmitting(true);
    try {
      const created = await api.createTemplate(buildPayload());
      const result = await api.submitTemplate(created._id);
      const extraWarnings = result?.review?.warnings || [];
      showToast(
        extraWarnings.length
          ? `Submitted to Meta — ${extraWarnings.length} risk${extraWarnings.length > 1 ? 's' : ''} noted: review usually completes within minutes to 24 h`
          : 'Submitted to Meta — review usually completes within minutes to a few hours',
        'success',
      );
      navigate('/templates');
    } catch (e) {
      showToast(e.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton onClick={() => navigate('/templates')}><ArrowBackRoundedIcon /></IconButton>
          <Box>
            <Typography variant="h5" fontWeight={800}>Create message template</Typography>
            <Typography variant="body2" color="text.secondary">Build, preview and submit an approval-ready WhatsApp template.</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<SaveOutlinedIcon />} disabled={saving || submitting} onClick={handleSave}>Save draft</Button>
          <Button variant="contained" startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon />} disabled={saving || submitting} onClick={handleSubmit}>
            Submit for approval
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        {/* FORM */}
        <Grid item xs={12} md={7}>
          <Stack spacing={2.5}>
            {/* Category */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <SectionTitle title="Category" hint="Meta reviews templates per category — pick what matches your intent." />
              <RadioGroup value={form.category} onChange={set('category')} sx={{ mt: 1 }}>
                <Grid container spacing={1.5}>
                  {CATEGORIES.map((c) => (
                    <Grid item xs={12} sm={4} key={c.value}>
                      <Paper
                        variant="outlined"
                        onClick={() => setForm((f) => ({ ...f, category: c.value }))}
                        sx={{
                          p: 2, cursor: 'pointer', height: '100%', borderRadius: 2,
                          borderColor: form.category === c.value ? 'primary.main' : 'divider',
                          borderWidth: form.category === c.value ? 2 : 1,
                          bgcolor: form.category === c.value ? 'action.selected' : 'transparent',
                        }}
                      >
                        <FormControlLabel value={c.value} control={<Radio size="small" checked={form.category === c.value} />} label="" sx={{ m: 0 }} />
                        <Typography fontWeight={800}>{c.title}</Typography>
                        <Typography variant="caption" color="primary" fontWeight={700}>{c.tagline}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>{c.description}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
            </Card>

            {/* Basics */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <SectionTitle title="Basics" />
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Template name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                    fullWidth
                    helperText="Lowercase snake_case, e.g. order_confirmation_v1 — cannot be changed later"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select label="Language" value={form.language} onChange={set('language')} fullWidth>
                    {LANGUAGES.map((l) => <MenuItem key={l.code} value={l.code}>{l.label} · {l.code}</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2.5 }}>
                <SectionTitle title="Template type" />
                <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                  {TEMPLATE_TYPES.map((t) => (
                    <Grid item xs={12} sm={4} key={t.value}>
                      <Paper
                        variant="outlined"
                        onClick={() => switchType(t.value)}
                        sx={{
                          p: 2, cursor: 'pointer', borderRadius: 2, height: '100%',
                          borderColor: form.templateType === t.value ? 'primary.main' : 'divider',
                          borderWidth: form.templateType === t.value ? 2 : 1,
                          bgcolor: form.templateType === t.value ? 'action.selected' : 'transparent',
                        }}
                      >
                        <Typography fontWeight={800}>{t.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{t.description}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Card>

            {/* Header */}
            {form.templateType !== 'carousel' && (
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <SectionTitle title="Header" hint="Optional top section of the message." />
                <TextField select label="Header type" value={form.headerType} onChange={set('headerType')} fullWidth size="small" sx={{ mt: 1.5, maxWidth: 260 }}>
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="image">Image (JPEG/PNG ≤5MB)</MenuItem>
                  <MenuItem value="video">Video (MP4 ≤16MB)</MenuItem>
                  <MenuItem value="document">Document (PDF ≤100MB)</MenuItem>
                </TextField>
                {form.headerType === 'text' && (
                  <>
                    <TextField
                      label="Header text"
                      value={form.headerContent}
                      onChange={set('headerContent')}
                      fullWidth size="small" sx={{ mt: 2 }}
                      inputProps={{ maxLength: LIMITS.HEADER_TEXT_MAX }}
                      helperText={`${form.headerContent.length}/${LIMITS.HEADER_TEXT_MAX}${headerAnalysis.positions.length ? ` — 1 variable allowed ({{${headerAnalysis.positions[0].raw}}})` : ' — supports {{variable_name}} or {{1}}'}`}
                    />
                    {headerAnalysis.positions.length > 0 && (
                      <TextField
                        label={`Sample for → {{${headerAnalysis.positions[0].num}}}`}
                        value={headerSample ?? ''}
                        onChange={(e) => setHeaderOverride(e.target.value)}
                        fullWidth size="small" sx={{ mt: 1.5 }}
                        helperText={
                          headerAnalysis.positions[0].id.startsWith('n:')
                            ? 'Auto-filled from the variable definition — Meta reviewers see this'
                            : 'Meta reviewers see this as the example content'
                        }
                      />
                    )}
                  </>
                )}
                {['image', 'video', 'document'].includes(form.headerType) && (
                  <TextField
                    label="Public media URL"
                    placeholder="https://cdn.yourdomain.com/banner.png"
                    value={form.headerMediaUrl}
                    onChange={set('headerMediaUrl')}
                    fullWidth size="small" sx={{ mt: 2 }}
                    helperText="Uploaded to Meta automatically when you submit. Must be publicly reachable."
                  />
                )}
              </Card>
            )}

            {/* Body */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <SectionTitle
                title="Body text"
                hint="Type {{1}}, {{2}}… or click a variable chip below to insert {{variable_name}} — names are converted to numbers automatically when saved, and the preview shows real values."
              />
              <TextField
                value={form.bodyText}
                onChange={set('bodyText')}
                multiline rows={5} fullWidth sx={{ mt: 1.5 }}
                inputProps={{ maxLength: LIMITS.BODY_MAX }}
                placeholder="Hi! On this {{product_name}} there is {{discount}}% off today only."
                helperText={`${form.bodyText.length}/${LIMITS.BODY_MAX} · ${bodyVars.length} variable position(s)`}
              />

              {/* Global variable chips — click to insert */}
              <Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center" sx={{ mt: 1.25 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                  Insert variable:
                </Typography>
                {globalVars.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No global variables yet — create them on the Variables page.
                  </Typography>
                )}
                {globalVars.map((v) => {
                  const used = bodyAnalysis.positions.some((p) => p.id === `n:${v.name}`);
                  return (
                    <Chip
                      key={v._id}
                      size="small"
                      clickable
                      onClick={() => insertVariable(v.name)}
                      label={v.name}
                      variant={used ? 'filled' : 'outlined'}
                      title={v.source === 'static' ? `Static: "${v.staticValue}"` : `From contact: ${v.contactField}`}
                    />
                  );
                })}
                <Button size="small" startIcon={<DataObjectRoundedIcon />} onClick={insertNumbered}>
                  Numbered {'{{n}}'}
                </Button>
              </Stack>

              {unknownBodyVars.length > 0 && (
                <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
                  Unknown variable(s): {unknownBodyVars.map((v) => `{{${v}}}`).join(', ')} — create them on the Variables page first.
                </Alert>
              )}

              {bodyVars.length > 0 && (
                <Alert severity="info" icon={<InfoOutlinedIcon fontSize="small" />} sx={{ mt: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" fontWeight={700}>Sample values (shown to Meta reviewers):</Typography>
                  <Grid container spacing={1} sx={{ mt: 0.25 }}>
                    {bodyVars.map((p) => (
                      <Grid item xs={12} sm={4} key={p.num}>
                        <TextField
                          size="small" fullWidth
                          label={`${p.id.startsWith('n:') ? `{{${p.raw}}}` : ''} → {{${p.num}}}`}
                          value={samples[p.num - 1] || ''}
                          onChange={(e) => setSample(p.num, e.target.value)}
                          error={!String(samples[p.num - 1] || '').trim()}
                          helperText={
                            p.id.startsWith('n:')
                              ? (varForName(p.raw)?.source === 'contact'
                                ? `auto: from contact.${varForName(p.raw).contactField}`
                                : 'auto: from static value')
                              : undefined
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Alert>
              )}
            </Card>

            {/* Carousel cards */}
            {form.templateType === 'carousel' && (
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <SectionTitle title="Cards" hint={`Swipeable cards. ${LIMITS.CAROUSEL_MIN}–${LIMITS.CAROUSEL_MAX} cards, each with an image and short text.`} />
                {form.cards.map((card, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2, mt: i === 0 ? 1.5 : 1.5, borderRadius: 2, position: 'relative' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Chip size="small" label={`Card ${i + 1}`} />
                      {form.cards.length > LIMITS.CAROUSEL_MIN && (
                        <IconButton size="small" onClick={() => removeCard(i)}><DeleteOutlineRoundedIcon /></IconButton>
                      )}
                    </Stack>
                    <TextField size="small" fullWidth label="Card image URL" placeholder="https://…" value={card.headerMediaUrl}
                      onChange={(e) => updateCard(i, { headerMediaUrl: e.target.value })} sx={{ mt: 1.5 }} />
                    <TextField size="small" fullWidth multiline rows={2} label="Card body text" inputProps={{ maxLength: LIMITS.CARD_BODY_MAX }}
                      value={card.bodyText} onChange={(e) => updateCard(i, { bodyText: e.target.value })}
                      helperText={`${card.bodyText.length}/${LIMITS.CARD_BODY_MAX}`} sx={{ mt: 1.5 }} />
                  </Paper>
                ))}
                <Button disabled={form.cards.length >= LIMITS.CAROUSEL_MAX} startIcon={<AddRoundedIcon />} onClick={addCard} sx={{ mt: 1.5 }}>
                  Add card ({form.cards.length}/{LIMITS.CAROUSEL_MAX})
                </Button>
              </Card>
            )}

            {/* Footer */}
            {form.templateType !== 'carousel' && (
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <SectionTitle title="Footer" hint="Small gray text under the body — commonly used for opt-outs." />
                <TextField
                  label="Footer text (optional)"
                  value={form.footerText}
                  onChange={set('footerText')} fullWidth size="small" sx={{ mt: 1.5 }}
                  inputProps={{ maxLength: LIMITS.FOOTER_MAX }}
                  placeholder='e.g. Reply STOP to unsubscribe'
                  helperText={`${form.footerText.length}/${LIMITS.FOOTER_MAX}`}
                />
                {form.category === 'MARKETING' && !form.footerText && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                    <WarningAmberRoundedIcon fontSize="small" sx={{ color: 'warning.main' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                      Marketing templates approve more reliably with an opt-out.
                    </Typography>
                    <Button size="small" onClick={() => setForm((f) => ({ ...f, footerText: 'Reply STOP to unsubscribe' }))}>
                      Add
                    </Button>
                  </Stack>
                )}
              </Card>
            )}

            {/* Buttons */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <SectionTitle title="Buttons" hint="Tappable actions below the message. Max 10 total; only 3 URL / call / copy-code combined; 1 flow; 1 catalog." />
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
                {BUTTON_TYPES.filter((bt) =>
                  !(bt.type === 'CATALOG' && form.buttons.some((b) => b.type === 'CATALOG')) &&
                  !(bt.type === 'FLOW' && form.buttons.some((b) => b.type === 'FLOW'))
                ).map((bt) => (
                  <Tooltip key={bt.type} title={bt.hint} arrow>
                    <Button variant="outlined" size="small" startIcon={BUTTON_ICONS[bt.type]} onClick={() => addButtonType(bt.type)}>
                      {bt.label}
                    </Button>
                  </Tooltip>
                ))}
              </Stack>

              {form.buttons.map((btn, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {BUTTON_ICONS[btn.type]}
                    <Typography variant="body2" fontWeight={800}>{BUTTON_TYPES.find((t) => t.type === btn.type)?.label}</Typography>
                    <Box sx={{ flex: 1 }} />
                    <IconButton size="small" onClick={() => removeButton(idx)}><DeleteOutlineRoundedIcon /></IconButton>
                  </Stack>
                  <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField size="small" fullWidth label="Button text"
                        inputProps={{ maxLength: LIMITS.BUTTON_TEXT_MAX }}
                        value={btn.text} onChange={(e) => updateButton(idx, { text: e.target.value })}
                        helperText={`${btn.text.length}/${LIMITS.BUTTON_TEXT_MAX}`} />
                    </Grid>
                    {btn.type === 'URL' && (
                      <Grid item xs={12} sm={6}>
                        <TextField size="small" fullWidth label="Website URL"
                          placeholder="https://shop.com/order/{{1}}"
                          value={btn.url} onChange={(e) => updateButton(idx, { url: e.target.value })} />
                      </Grid>
                    )}
                    {btn.type === 'URL' && extractVariables(btn.url || '').length > 0 && (
                      <Grid item xs={12}>
                        <TextField size="small" fullWidth label="Sample URL suffix (for review)"
                          value={btn.example} onChange={(e) => updateButton(idx, { example: e.target.value })} />
                      </Grid>
                    )}
                    {btn.type === 'PHONE_NUMBER' && (
                      <Grid item xs={12} sm={6}>
                        <TextField size="small" fullWidth label="Phone number (with country code)"
                          placeholder="+919876543210"
                          value={btn.phoneNumber} onChange={(e) => updateButton(idx, { phoneNumber: e.target.value })} />
                      </Grid>
                    )}
                    {btn.type === 'COPY_CODE' && (
                      <Grid item xs={12} sm={6}>
                        <TextField size="small" fullWidth label="Example code"
                          placeholder="A1B2C3" value={btn.example} onChange={(e) => updateButton(idx, { example: e.target.value })}
                          helperText="OTP/coupon shown to reviewers" />
                      </Grid>
                    )}
                    {btn.type === 'FLOW' && (
                      <Grid item xs={12} sm={6}>
                        <TextField size="small" fullWidth label="Flow ID"
                          value={btn.flowId} onChange={(e) => updateButton(idx, { flowId: e.target.value })} />
                      </Grid>
                    )}
                    {btn.type === 'CATALOG' && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField size="small" fullWidth label="Catalog ID"
                            value={btn.catalogId} onChange={(e) => updateButton(idx, { catalogId: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField size="small" fullWidth label="Product retailer ID (optional for full catalog)"
                            value={btn.productRetailerId} onChange={(e) => updateButton(idx, { productRetailerId: e.target.value })} />
                        </Grid>
                      </>
                    )}
                  </Grid>
                  <FormHelperText>{BUTTON_TYPES.find((t) => t.type === btn.type)?.hint}</FormHelperText>
                </Paper>
              ))}
              {form.buttons.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {form.buttons.length}/{BUTTON_RULES.MAX_TOTAL} buttons · {quickCount} quick reply · {nonQuickCount}/{BUTTON_RULES.MAX_NON_QUICK} action buttons
                </Typography>
              )}
            </Card>
          </Stack>
        </Grid>

        {/* PREVIEW */}
        <Grid item xs={12} md={5}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <Card sx={{ borderRadius: 3, bgcolor: '#ECE5DD', overflow: 'hidden' }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.25, bgcolor: '#075E54', color: '#fff' }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#128C7E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>WA</Box>
                <Box>
                  <Typography fontSize={13} fontWeight={700}>Your Business</Typography>
                  <Typography fontSize={11} sx={{ opacity: 0.8 }}>WhatsApp Business</Typography>
                </Box>
              </Stack>

              <Box sx={{ p: 2, minHeight: 320 }}>
                <WhatsAppBubble
                  template={{
                    ...form,
                    bodyText: bodyAnalysis.normalized,
                    headerContent: headerAnalysis.normalized || form.headerContent,
                    sampleValues: { ...form.sampleValues, body: samples, header: headerSample != null ? [headerSample] : [] },
                  }}
                />

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                  Live preview · {LANGUAGES.find((l) => l.code === form.language)?.label}
                </Typography>
              </Box>
            </Card>

            <ApprovalReadiness compliance={compliance} />

            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              <strong>How review works:</strong> Meta first checks your category, then the content — usually within minutes to a few hours
              (worst case 24 h). While pending, the template is read-only, so have templates approved at least a day before campaigns.
              Fill every sample value, keep wording clear and professional, and match your category (promotions → Marketing,
              order updates → Utility) to avoid reclassification.
            </Alert>
          </Box>
        </Grid>
      </Grid>
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

const LEVEL_META = {
  error: { icon: <ErrorOutlineRoundedIcon fontSize="small" color="error" />, label: 'Blocks submission' },
  warning: { icon: <WarningAmberRoundedIcon fontSize="small" sx={{ color: 'warning.main' }} />, label: 'Approval risk' },
  tip: { icon: <LightbulbRoundedIcon fontSize="small" color="info" />, label: 'Tip' },
};

function ApprovalReadiness({ compliance }) {
  const { errors, warnings, tips, passed } = compliance;
  const items = [
    ...errors.map((e) => ({ ...e, level: 'error' })),
    ...warnings.map((w) => ({ ...w, level: 'warning' })),
    ...tips.map((t) => ({ ...t, level: 'tip' })),
  ];
  return (
    <Card sx={{ mt: 2, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        {passed ? <CheckCircleRoundedIcon color="success" /> : <VerifiedRoundedIcon color="disabled" />}
        <Typography variant="subtitle2" fontWeight={800}>Approval readiness</Typography>
        <Box sx={{ flex: 1 }} />
        {passed && warnings.length === 0 && tips.length <= 1 && (
          <Chip size="small" color="success" label="Looks great" />
        )}
        {!passed && (
          <Chip
            size="small" color="error"
            label={`${errors.length} blocker${errors.length > 1 ? 's' : ''}`}
          />
        )}
        {passed && warnings.length > 0 && (
          <Chip size="small" variant="outlined" color="warning" label={`${warnings.length} risk${warnings.length > 1 ? 's' : ''}`} />
        )}
      </Stack>
      <Stack spacing={1.25} sx={{ p: 2 }}>
        {items.length === 0 && (
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <CheckCircleRoundedIcon fontSize="small" color="success" sx={{ mt: 0.25 }} />
            <Typography variant="body2">No issues found — this follows Meta&apos;s template guidelines.</Typography>
          </Stack>
        )}
        {items.map((item) => (
          <Stack key={`${item.level}-${item.code}`} direction="row" spacing={1} alignItems="flex-start">
            <Box sx={{ mt: 0.25 }}>{LEVEL_META[item.level].icon}</Box>
            <Typography variant="caption" color={item.level === 'error' ? 'error' : item.level === 'warning' ? 'warning.dark' : 'text.secondary'}>
              {item.message}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
