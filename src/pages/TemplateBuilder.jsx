import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, Typography, Stack, Button, TextField, MenuItem, Chip,
  Alert, Divider, IconButton, Tooltip, Paper, InputAdornment, RadioGroup,
  FormControlLabel, Radio, FormHelperText, CircularProgress,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DataObjectRoundedIcon from '@mui/icons-material/DataObjectRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
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

const BUTTON_ICONS = {
  QUICK_REPLY: <ChatBubbleOutlineRoundedIcon fontSize="small" />,
  URL: <LinkRoundedIcon fontSize="small" />,
  PHONE_NUMBER: <CallRoundedIcon fontSize="small" />,
  COPY_CODE: <ContentCopyRoundedIcon fontSize="small" />,
  FLOW: <AccountTreeRoundedIcon fontSize="small" />,
  CATALOG: <StorefrontRoundedIcon fontSize="small" />,
};

export default function TemplateBuilder() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_STATE);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const bodyVars = extractVariables(form.bodyText);
  const headerVars = form.headerType === 'text' ? extractVariables(form.headerContent) : [];

  // Keep sample values aligned with detected variables
  const samples = useMemo(
    () => bodyVars.map((_, i) => form.sampleValues.body[i] || ''),
    [bodyVars, form.sampleValues.body]
  );

  const setSample = (index, value) => {
    setForm((f) => {
      const next = [...f.sampleValues.body];
      next[index] = value;
      return { ...f, sampleValues: { ...f.sampleValues, body: next } };
    });
  };

  const insertVariable = () => {
    const n = extractVariables(form.bodyText).length + 1;
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
    if (samples.some((s) => !s.trim())) return 'Fill in a sample value for every {{variable}} — Meta reviews these';
    return null;
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    category: form.category,
    language: form.language,
    templateType: form.templateType,
    headerType: form.templateType === 'carousel' ? 'none' : form.headerType,
    headerContent: form.headerType === 'text' ? form.headerContent : null,
    headerMediaUrl: ['image', 'video', 'document'].includes(form.headerType) ? form.headerMediaUrl : null,
    bodyText: form.bodyText,
    footerText: form.footerText || null,
    buttons: form.templateType === 'carousel' ? [] : form.buttons.map(cleanButton),
    cards:
      form.templateType === 'carousel'
        ? form.cards.map((c) => ({
            headerMediaUrl: c.headerMediaUrl,
            bodyText: c.bodyText,
            buttons: c.buttons.map(cleanButton),
          }))
        : [],
    sampleValues: {
      body: bodyVars.map((_, i) => samples[i] || ''),
      header: headerVars.map((_, i) => (i === 0 && form.sampleValues.header[0]) || 'sample'),
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
    setSubmitting(true);
    try {
      const created = await api.createTemplate(buildPayload());
      await api.submitTemplate(created._id);
      showToast('Submitted to Meta — status will move to APPROVED/PENDING after review', 'success');
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
                  <MenuItem value="video">Video (MP4 ≤30MB)</MenuItem>
                  <MenuItem value="document">Document / PDF (≤30MB)</MenuItem>
                </TextField>
                {form.headerType === 'text' && (
                  <>
                    <TextField
                      label="Header text"
                      value={form.headerContent}
                      onChange={set('headerContent')}
                      fullWidth size="small" sx={{ mt: 2 }}
                      inputProps={{ maxLength: LIMITS.HEADER_TEXT_MAX }}
                      helperText={`${form.headerContent.length}/${LIMITS.HEADER_TEXT_MAX}${headerVars.length ? ' — 1 variable allowed, set its sample below' : ''}`}
                    />
                    {headerVars.length > 0 && (
                      <TextField
                        label={`Sample for {{${headerVars[0]}}}`}
                        value={form.sampleValues.header[0] || ''}
                        onChange={(e) => setForm((f) => ({ ...f, sampleValues: { ...f.sampleValues, header: [e.target.value] } }))}
                        fullWidth size="small" sx={{ mt: 1.5 }}
                        helperText="Meta reviewers see this as the example content"
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
                hint="The main content. Use {{1}}, {{2}}… for dynamic values like names, order IDs or OTP codes."
              />
              <TextField
                value={form.bodyText}
                onChange={set('bodyText')}
                multiline rows={5} fullWidth sx={{ mt: 1.5 }}
                inputProps={{ maxLength: LIMITS.BODY_MAX }}
                helperText={`${form.bodyText.length}/${LIMITS.BODY_MAX} · ${bodyVars.length} variable(s)`}
              />
              <Button size="small" startIcon={<DataObjectRoundedIcon />} onClick={insertVariable} sx={{ mt: 1 }}>
                Insert variable {'{{n}}'}
              </Button>
              {bodyVars.length > 0 && (
                <Alert severity="info" icon={<InfoOutlinedIcon fontSize="small" />} sx={{ mt: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" fontWeight={700}>Sample values (shown to Meta reviewers):</Typography>
                  <Grid container spacing={1} sx={{ mt: 0.25 }}>
                    {bodyVars.map((v, i) => (
                      <Grid item xs={12} sm={4} key={v}>
                        <TextField
                          size="small" fullWidth
                          label={'{{' + v + '}}'}
                          value={samples[i]}
                          onChange={(e) => setSample(i, e.target.value)}
                          error={!samples[i].trim()}
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
                <MessagePreview form={form} bodyVars={bodyVars} samples={samples} />

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                  Live preview · {LANGUAGES.find((l) => l.code === form.language)?.label}
                </Typography>
              </Box>
            </Card>

            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              <strong>Approval tips:</strong> fill every variable&apos;s sample value, avoid ALL-CAPS & excessive emojis in marketing,
              and match your category (promotions → Marketing, receipts → Utility). Review usually takes seconds to a few minutes.
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

function renderWithVarChips(text, filledValues) {
  const parts = [];
  let last = 0;
  const re = /{{(\d+)}}/g;
  let m;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={`t${k++}`}>{text.slice(last, m.index)}</span>);
    const val = filledValues?.[m[1] - 1];
    parts.push(
      val ? (
        <strong key={`v${k++}`}>{val}</strong>
      ) : (
        <Box component="span" key={`v${k++}`} sx={{ bgcolor: '#DFF3FB', border: '1px solid #A6DEEB', borderRadius: 0.75, px: 0.5, mx: 0.15, fontFamily: 'monospace', fontSize: 12 }}>{`{{${m[1]}}}`}</Box>
      )
    );
    last = m.index + m[0].length;
  }
  parts.push(<span key={`t${k++}`}>{text.slice(last)}</span>);
  return parts;
}

function MessagePreview({ form, bodyVars, samples }) {
  const isCarousel = form.templateType === 'carousel';

  return (
    <Box sx={{ maxWidth: 340, ml: 'auto' }}>
      <Box sx={{ bgcolor: '#DCF8C6', borderRadius: 2, borderTopRightRadius: 0, p: 1.25, boxShadow: 1 }}>
        {/* Header */}
        {!isCarousel && form.headerType === 'text' && (
          <Typography fontWeight={700} fontSize={14} sx={{ mb: 0.5 }}>
            {renderWithVarChips(form.headerContent, form.sampleValues.header)}
          </Typography>
        )}
        {!isCarousel && ['image'].includes(form.headerType) && (
          form.headerMediaUrl ? (
            <Box component="img" src={form.headerMediaUrl} alt="header" onError={(e) => { e.currentTarget.style.display = 'none'; }} sx={{ width: '100%', borderRadius: 1, mb: 0.75, maxHeight: 180, objectFit: 'cover' }} />
          ) : (
            <Box sx={{ bgcolor: '#CFE9F5', borderRadius: 1, mb: 0.75, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#455964', fontSize: 12 }}>
              Image header
            </Box>
          )
        )}
        {!isCarousel && ['video', 'document'].includes(form.headerType) && (
          <Box sx={{ bgcolor: '#CFE9F5', borderRadius: 1, mb: 0.75, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#455964', fontSize: 12 }}>
            {form.headerType === 'video' ? '▶ Video header' : '📄 Document header'}
          </Box>
        )}

        {/* Body */}
        <Typography fontSize={13.5} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {renderWithVarChips(form.bodyText, bodyVars.map((_, i) => samples[i]))}
        </Typography>

        {/* Footer */}
        {form.footerText && (
          <Typography fontSize={11.5} color="#6A7175" sx={{ mt: 0.75 }}>{form.footerText}</Typography>
        )}

        {/* Meta row */}
        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.4}>
          <Typography fontSize={10.5} color="#8696A0">12:45</Typography>
          <Box sx={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '3px solid #53BDEB', borderBottom: '5px solid #53BDEB', transform: 'rotate(-25deg)' }} />
        </Stack>

        {/* Buttons */}
        {form.buttons.length > 0 && (
          <>
            <Divider sx={{ my: 1, borderColor: 'rgba(0,0,0,0.08)' }} />
            <Stack divider={<Divider flexItem sx={{ borderColor: 'rgba(0,0,0,0.06)' }} />}>
              {form.buttons.map((b, i) => (
                <Stack key={i} direction="row" spacing={0.75} alignItems="center" justifyContent="center" sx={{ py: 0.75, color: '#00A5F4' }}>
                  {BUTTON_ICONS[b.type]}
                  <Typography fontSize={13} fontWeight={600}>{b.text || `${b.type.toLowerCase()} button`}</Typography>
                </Stack>
              ))}
            </Stack>
          </>
        )}
      </Box>

      {/* Carousel preview */}
      {isCarousel && (
        <Stack direction="row" spacing={1} sx={{ mt: 1, overflowX: 'auto', pb: 1 }}>
          {form.cards.map((card, i) => (
            <Box key={i} sx={{ minWidth: 200, bgcolor: '#DCF8C6', borderRadius: 2, p: 1, boxShadow: 1 }}>
              <Box sx={{ height: 100, borderRadius: 1, mb: 0.75, overflow: 'hidden', bgcolor: '#CFE9F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.headerMediaUrl
                  ? <Box component="img" src={card.headerMediaUrl} alt={`card ${i + 1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  : <Typography fontSize={11} color="#455964">Image</Typography>}
              </Box>
              <Typography fontSize={12.5} sx={{ minHeight: 34, wordBreak: 'break-word' }}>{card.bodyText || `Card ${i + 1} text`}</Typography>
              {card.buttons.filter((b) => b.text).map((b, j) => (
                <Stack key={j} direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ pt: 0.5, color: '#00A5F4' }}>
                  {BUTTON_ICONS[b.type]}
                  <Typography fontSize={12} fontWeight={600}>{b.text}</Typography>
                </Stack>
              ))}
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
