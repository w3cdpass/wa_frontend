import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  IconButton,
  Button,
  Chip,
  Divider,
  MenuItem,
  Select,
  Switch,
  FormControlLabel,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Drawer,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import ZoomOutRoundedIcon from '@mui/icons-material/ZoomOutRounded';
import CenterFocusStrongRoundedIcon from '@mui/icons-material/CenterFocusStrongRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';
import dayjs from 'dayjs';
import { useToast } from '../context/ToastContext';

const THEME = {
  primary: '#0F7B6C',
  primaryLight: '#17C994',
  primaryDark: '#0A5A4F',
  ink: '#0B1220',
  inkLight: '#121B2E',
  amber: '#F59E0B',
  red: '#E5484D',
  bg: '#F5F7F8',
  divider: '#E7EBEE',
  textSecondary: '#5B6672',
};

const WA = {
  bubbleOut: '#D9FDD3',
  wallpaper: '#E5DDD5',
  chipText: '#008069',
};

const CATEGORIES = [
  { id: 'messages', label: 'Messages', color: THEME.primary },
  { id: 'interactive', label: 'Interactive', color: THEME.primaryLight },
  { id: 'actions', label: 'Actions', color: THEME.ink },
  { id: 'advanced', label: 'Advanced', color: THEME.amber },
];

const SCHEMAS = {
  'text-reply': {
    label: 'Text Reply', icon: '💬', category: 'messages', preview: true,
    fields: [{ key: 'text', type: 'textarea', label: 'Message text', max: 1024 }],
  },
  'media-caption': {
    label: 'Media Caption', icon: '🖼️', category: 'messages', preview: true,
    fields: [
      { key: 'media', type: 'media', label: 'Media' },
      { key: 'caption', type: 'textarea', label: 'Caption', max: 1024 },
    ],
  },
  'request-location': {
    label: 'Request Location', icon: '📍', category: 'messages',
    fields: [{ key: 'text', type: 'textarea', label: 'Request location text' }],
  },
  'text-button': {
    label: 'Text + Button', icon: '🔘', category: 'interactive', preview: true,
    fields: [
      { key: 'text', type: 'textarea', label: 'Message text', max: 1024 },
      { key: 'buttons', type: 'buttons', label: 'Quick reply buttons', max: 3 },
    ],
  },
  'media-button': {
    label: 'Media + Button', icon: '🎛️', category: 'interactive', preview: true,
    fields: [
      { key: 'media', type: 'media', label: 'Media' },
      { key: 'caption', type: 'textarea', label: 'Caption', max: 1024 },
      { key: 'buttons', type: 'buttons', label: 'Quick reply buttons', max: 3 },
    ],
  },
  'text-list': {
    label: 'Text + List', icon: '📋', category: 'interactive', preview: true,
    fields: [
      { key: 'text', type: 'textarea', label: 'Message text', max: 1024 },
      { key: 'listTitle', type: 'text', label: 'List button label', placeholder: 'View options' },
      { key: 'rows', type: 'listrows', label: 'List rows', max: 10 },
    ],
  },
  'url-button': {
    label: 'URL Button', icon: '🔗', category: 'interactive', preview: true,
    fields: [
      { key: 'text', type: 'textarea', label: 'Message text', max: 1024 },
      { key: 'buttonLabel', type: 'text', label: 'Button label', placeholder: 'Visit Now' },
      { key: 'url', type: 'url', label: 'URL', placeholder: 'https://' },
    ],
  },
  'wapp-form': {
    label: 'WAPP Form', icon: '📝', category: 'interactive',
    fields: [{ key: 'formName', type: 'select', label: 'Select form', options: ['Lead Capture', 'Order Form', 'Feedback Form'] }],
  },
  'add-to-group': {
    label: 'Add to Group', icon: '👥', category: 'actions',
    fields: [{ key: 'group', type: 'select', label: 'Select group', options: ['New Leads', 'Hot Prospects', 'Customers'] }],
  },
  'add-to-tag': {
    label: 'Add to Tag', icon: '🏷️', category: 'actions',
    fields: [{ key: 'tag', type: 'select', label: 'Select tag', options: ['Interested', 'Not Interested', 'Follow-up'] }],
  },
  'create-ticket': {
    label: 'Create Ticket', icon: '🎫', category: 'actions',
    fields: [{ key: 'ticketText', type: 'text', label: 'Ticket number is', placeholder: '{{TICKETID}}' }],
  },
  'connect-agents': {
    label: 'Connect to Agents', icon: '🙋', category: 'actions', terminal: true,
    fields: [{ key: 'note', type: 'text', label: 'Agent handoff note' }],
  },
  'connect-other-flow': {
    label: 'Connect to Other Flow', icon: '↪️', category: 'actions',
    fields: [{ key: 'flow', type: 'select', label: 'Select flow', options: ['Welcome Flow', 'Support Flow', 'Sales Flow'] }],
  },
  'push-webhook': {
    label: 'Push to Webhook', icon: '🔌', category: 'advanced',
    fields: [
      { key: 'method', type: 'select', label: 'HTTP method', options: ['GET', 'POST', 'PUT'] },
      { key: 'url', type: 'url', label: 'Webhook URL', placeholder: 'https://' },
      { key: 'body', type: 'textarea', label: 'JSON body', placeholder: '{ "phone": "{{phone}}" }' },
    ],
  },
  'otp-send': {
    label: 'OTP Send', icon: '🔐', category: 'advanced', isNew: true, preview: true,
    fields: [
      { key: 'apiUrl', type: 'url', label: 'OTP generate/send API URL', placeholder: 'https://api.yourprovider.com/otp/send' },
      { key: 'method', type: 'select', label: 'HTTP method', options: ['POST', 'GET'] },
      { key: 'headers', type: 'keyvalue', label: 'Headers', placeholder: ['Authorization', 'Bearer {{api_key}}'] },
      { key: 'body', type: 'textarea', label: 'Request body', placeholder: '{ "phone": "{{phone}}", "otp": "{{otp}}" }' },
      { key: 'otpLength', type: 'select', label: 'OTP length', options: ['4', '6'] },
      { key: 'expiry', type: 'text', label: 'Expires in (seconds)', placeholder: '300' },
      { key: 'text', type: 'textarea', label: 'WhatsApp message template', placeholder: 'Your verification code is {{otp}}.' },
    ],
  },
  'otp-verify': {
    label: 'OTP Verify', icon: '✅', category: 'advanced', isNew: true, branches: ['Success', 'Failed'],
    fields: [
      { key: 'apiUrl', type: 'url', label: 'OTP verify API URL', placeholder: 'https://api.yourprovider.com/otp/verify' },
      { key: 'method', type: 'select', label: 'HTTP method', options: ['POST', 'GET'] },
      { key: 'body', type: 'textarea', label: 'Request body', placeholder: '{ "phone": "{{phone}}", "otp": "{{user_input}}" }' },
      { key: 'maxAttempts', type: 'select', label: 'Max attempts', options: ['1', '3', '5'] },
    ],
  },
  'opt-out': {
    label: 'Opt-out Number', icon: '🚫', category: 'advanced', terminal: true,
    fields: [],
  },
};

const TERMINAL_TYPES = Object.keys(SCHEMAS).filter((t) => SCHEMAS[t].terminal);

const MESSAGE_TYPES = [
  'text-reply', 'media-caption', 'request-location', 'text-button',
  'media-button', 'text-list', 'url-button', 'wapp-form', 'otp-send', 'otp-verify',
];

const ACTION_STATUS = {
  'add-to-group': (d) => `👥 Contact added to group "${d.group || ''}"`,
  'add-to-tag': (d) => `🏷️ Contact tagged #${d.tag || ''}`,
  'create-ticket': (d) => `🎫 Ticket created — ${d.ticketText || '{{TICKETID}}'}`,
  'push-webhook': (d) => `🔌 Webhook ${d.method || 'POST'} sent to ${d.url || '…'}`,
  'connect-other-flow': (d) => `↪️ Handing over to "${d.flow || 'another flow'}"`,
};

const SIM_DELAY = 700;

const catColor = (type) => CATEGORIES.find((c) => c.id === SCHEMAS[type]?.category)?.color || THEME.primary;

const uid = () => Math.random().toString(36).slice(2, 10);

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const truncate = (s = '', n = 90) => (s.length > n ? `${s.slice(0, n)}…` : s);

const defaultValueFor = (field) => {
  switch (field.type) {
    case 'buttons':
      return [{ id: uid(), label: 'Interested' }, { id: uid(), label: 'Not Interested' }];
    case 'listrows':
      return [{ id: uid(), title: 'Option 1', description: '' }];
    case 'keyvalue':
      return [{ id: uid(), key: field.placeholder?.[0] || '', value: field.placeholder?.[1] || '' }];
    case 'select':
      return field.options?.[0] || '';
    default:
      return '';
  }
};

const defaultDataFor = (type) => {
  const data = {};
  SCHEMAS[type].fields.forEach((f) => {
    data[f.key] = defaultValueFor(f);
  });
  return data;
};

const outputCount = (type, data = {}) => {
  if (type === 'otp-verify') return 2;
  if (SCHEMAS[type]?.terminal) return 0;
  if (type === 'text-button' || type === 'media-button') return Math.max(1, (data.buttons || []).length);
  return 1;
};

const branchLabels = (type, data = {}) => {
  if (type === 'otp-verify') return SCHEMAS['otp-verify'].branches;
  if (type === 'text-button' || type === 'media-button')
    return (data.buttons || []).map((b) => b.label || 'Button');
  return ['Next'];
};

const summarize = (type, data = {}) => {
  const t = data.text || data.caption || '';
  switch (type) {
    case 'push-webhook':
      return `${data.method || 'POST'} ${truncate(data.url || 'no URL', 46)}`;
    case 'otp-send':
      return truncate(t || data.apiUrl || 'OTP message', 70);
    case 'otp-verify':
      return truncate(data.apiUrl || 'Verify endpoint', 70);
    case 'url-button':
      return `${truncate(t, 60)}\n🔗 ${data.url || ''}`;
    case 'wapp-form':
      return data.formName || '';
    case 'add-to-group':
      return `→ ${data.group || ''}`;
    case 'add-to-tag':
      return `#${data.tag || ''}`;
    case 'create-ticket':
      return data.ticketText || '';
    case 'connect-agents':
      return data.note || 'Handoff to human agent';
    case 'connect-other-flow':
      return `↪ ${data.flow || ''}`;
    case 'opt-out':
      return 'Ends flow · marks contact opted out';
    default:
      return truncate(t, 90);
  }
};

const buildNodeHtml = (type, data = {}) => {
  const s = SCHEMAS[type];
  if (!s) return '<div></div>';
  const color = catColor(type);
  const summary = summarize(type, data);
  const count = outputCount(type, data);
  let branches = '';
  if (count > 1) {
    const rows = branchLabels(type, data)
      .map(
        (l, i) =>
          `<div class="wfb-branch"><span class="wfb-dot" style="background:${color}"></span><span>${i + 1}. ${esc(l)}</span></div>`
      )
      .join('');
    branches = `<div class="wfb-branches">${rows}</div>`;
  }
  const body = summary ? esc(summary).replace(/\n/g, '<br/>') : '<em>Not configured</em>';
  return `<div class="wfb-node" style="--wfb:${color}">
    <div class="wfb-head"><span class="wfb-ico">${s.icon}</span><span class="wfb-title">${esc(s.label)}</span>${s.isNew ? '<span class="wfb-new">NEW</span>' : ''
    }</div>
    <div class="wfb-summary">${body}</div>
    ${branches}
  </div>`;
};

const WFB_CSS = `
.wfb-host { width: 100%; height: 100%; position: relative; }
.wfb-host .drawflow {
  width: 100%; height: 100%;
  background: ${THEME.bg};
  background-image: radial-gradient(circle, #C7D2CD 1px, transparent 1px);
  background-size: 20px 20px;
}
.wfb-host .drawflow .drawflow-node {
  width: 252px; padding: 0; border-radius: 12px;
  border: 1px solid ${THEME.divider};
  background: #fff;
  box-shadow: 0 1px 3px rgba(11,18,32,0.08);
}
.wfb-host .drawflow .drawflow-node:hover { box-shadow: 0 4px 14px rgba(11,18,32,0.14); }
.wfb-host .drawflow .drawflow-node.selected {
  border-color: var(--wfb, ${THEME.primary});
  box-shadow: 0 0 0 2px rgba(23,201,148,0.35), 0 6px 18px rgba(15,123,108,0.18);
}
.wfb-host .drawflow .drawflow-node .drawflow_content_node { padding: 0; }
.wfb-node { font-family: 'Inter', sans-serif; border-left: 4px solid var(--wfb, ${THEME.primary}); border-radius: 12px; overflow: hidden; }
.wfb-head { display: flex; align-items: center; gap: 7px; padding: 8px 10px; background: color-mix(in srgb, var(--wfb) 10%, #ffffff); border-bottom: 1px solid ${THEME.divider}; }
.wfb-ico { font-size: 14px; line-height: 1; }
.wfb-title { font-size: 11.5px; font-weight: 700; letter-spacing: 0.2px; color: ${THEME.ink}; flex: 1; }
.wfb-new { font-size: 8px; font-weight: 800; background: #FCE7F3; color: #DB2777; border-radius: 4px; padding: 2px 4px; }
.wfb-summary { padding: 8px 10px 9px; font-size: 11px; line-height: 1.45; color: ${THEME.textSecondary}; word-break: break-word; white-space: normal; }
.wfb-summary em { color: #A3ADB8; }
.wfb-branches { border-top: 1px dashed ${THEME.divider}; padding: 5px 10px 7px; display: flex; flex-direction: column; gap: 3px; }
.wfb-branch { display: flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 600; color: ${THEME.ink}; }
.wfb-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.wfb-host .drawflow .input, .wfb-host .drawflow .output {
  width: 12px; height: 12px; border-radius: 50%;
  background: #fff; border: 2.5px solid var(--wfb, ${THEME.primary});
  cursor: crosshair;
}
.wfb-host .drawflow .output:hover, .wfb-host .drawflow .input:hover { transform: scale(1.35); border-color: ${THEME.primaryLight}; }
.wfb-host .drawflow .connection .main-path { stroke: #9DB4AD; stroke-width: 2; }
.wfb-host .drawflow .connection .main-path:hover { stroke: ${THEME.primary}; stroke-width: 3; }
.wfb-host .drawflow .connection.selected .main-path { stroke: ${THEME.red}; }
.wfb-host .drawflow .point { fill: ${THEME.primaryLight}; stroke: #fff; cursor: move; }
.wfb-host .drawflow-delete {
  background: ${THEME.red}; color: #fff; border: none; border-radius: 6px;
  font-size: 11px; font-weight: 700; padding: 2px 7px; cursor: pointer;
  font-family: 'Inter', sans-serif;
}
.wfb-empty {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  pointer-events: none; z-index: 5;
}
`;

const BACKEND_NODE_TYPE_MAP = {
  'text-reply': 'send_message',
  'media-caption': 'send_media',
  'request-location': 'send_message',
  'text-button': 'send_buttons',
  'media-button': 'send_buttons',
  'text-list': 'send_list',
  'url-button': 'send_buttons',
  'wapp-form': 'send_message',
  'add-to-group': 'set_tag',
  'add-to-tag': 'set_tag',
  'create-ticket': 'send_message',
  'connect-agents': 'handoff',
  'connect-other-flow': 'end',
  'push-webhook': 'condition',
  'otp-send': 'send_message',
  'otp-verify': 'collect_input',
  'opt-out': 'end',
};

const STATUS_COLORS = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  archived: 'default',
};

const STORAGE_KEY = 'wa_flow_draft_v1';

const clone = (o) => JSON.parse(JSON.stringify(o));

const NODE_KEY_RE = /^(?:node-)?(\d+)$/;
const nodeKeyToId = (k) => {
  const m = NODE_KEY_RE.exec(String(k));
  return m ? Number(m[1]) : null;
};

const isTypingTarget = (el) =>
  el &&
  (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

function TextField_(props) {
  return (
    <TextField
      {...props}
      size="small"
      fullWidth
      sx={{ '& .MuiOutlinedInput-root': { fontSize: 12.5 }, ...(props.sx || {}) }}
    />
  );
}

function ButtonsEditor({ value, onChange, max }) {
  const update = (id, label) => onChange(value.map((b) => (b.id === id ? { ...b, label } : b)));
  const add = () => value.length < max && onChange([...value, { id: uid(), label: 'New option' }]);
  const remove = (id) => onChange(value.filter((b) => b.id !== id));
  return (
    <Stack spacing={0.75}>
      {value.map((b) => (
        <Stack key={b.id} direction="row" spacing={0.75} alignItems="center">
          <TextField_
            value={b.label}
            onChange={(e) => update(b.id, e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 5, fontWeight: 600, color: WA.chipText },
              '& .MuiOutlinedInput-input': { textAlign: 'center', py: 0.55 },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: THEME.primaryLight },
            }}
          />
          <IconButton size="small" onClick={() => remove(b.id)} disabled={value.length <= 1} sx={{ p: 0.25 }}>
            <CloseRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Stack>
      ))}
      <Button
        onClick={add}
        disabled={value.length >= max}
        startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />}
        size="small"
        variant="outlined"
        sx={{ borderStyle: 'dashed', borderColor: THEME.primary, color: THEME.primary, fontSize: 11.5, fontWeight: 600 }}
      >
        Add option ({value.length}/{max})
      </Button>
    </Stack>
  );
}

function ListRowsEditor({ value, onChange, max }) {
  const update = (id, key, val) => onChange(value.map((r) => (r.id === id ? { ...r, [key]: val } : r)));
  const add = () => value.length < max && onChange([...value, { id: uid(), title: `Option ${value.length + 1}`, description: '' }]);
  const remove = (id) => onChange(value.filter((r) => r.id !== id));
  return (
    <Stack spacing={0.75}>
      {value.map((r) => (
        <Paper key={r.id} variant="outlined" sx={{ p: 0.75, borderColor: `${THEME.primaryLight}55` }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <TextField_ value={r.title} onChange={(e) => update(r.id, 'title', e.target.value)} placeholder="Row title" />
            <IconButton size="small" onClick={() => remove(r.id)} disabled={value.length <= 1} sx={{ p: 0.25 }}>
              <CloseRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Stack>
          <TextField_
            value={r.description}
            onChange={(e) => update(r.id, 'description', e.target.value)}
            placeholder="Row description (optional)"
            sx={{ mt: 0.5 }}
          />
        </Paper>
      ))}
      <Button
        onClick={add}
        disabled={value.length >= max}
        startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />}
        size="small"
        variant="outlined"
        sx={{ borderStyle: 'dashed', borderColor: THEME.primary, color: THEME.primary, fontSize: 11.5, fontWeight: 600 }}
      >
        Add row ({value.length}/{max})
      </Button>
    </Stack>
  );
}

function KeyValueEditor({ value, onChange }) {
  const update = (id, key, val) => onChange(value.map((r) => (r.id === id ? { ...r, [key]: val } : r)));
  const add = () => onChange([...value, { id: uid(), key: '', value: '' }]);
  const remove = (id) => onChange(value.filter((r) => r.id !== id));
  return (
    <Stack spacing={0.5}>
      {value.map((r) => (
        <Stack key={r.id} direction="row" spacing={0.5}>
          <TextField_ value={r.key} onChange={(e) => update(r.id, 'key', e.target.value)} placeholder="Header" />
          <TextField_ value={r.value} onChange={(e) => update(r.id, 'value', e.target.value)} placeholder="Value" />
          <IconButton size="small" onClick={() => remove(r.id)} sx={{ p: 0.25 }}>
            <CloseRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Stack>
      ))}
      <Button
        onClick={add}
        startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />}
        size="small"
        sx={{ fontSize: 11.5, color: THEME.primary, alignSelf: 'flex-start' }}
      >
        Add header
      </Button>
    </Stack>
  );
}

function MediaField({ value, onChange }) {
  const fileRef = useRef(null);
  const setImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 640;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        onChange(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  return value ? (
    <Box
      onClick={() => fileRef.current?.click()}
      sx={{
        position: 'relative', height: 100, borderRadius: 1, overflow: 'hidden', cursor: 'pointer',
        border: '1px solid', borderColor: 'divider', '&:hover .ov': { opacity: 1 },
      }}
    >
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setImage(e.target.files?.[0])} />
      <Box component="img" src={value} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <Box
        className="ov"
        sx={{
          position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,.45)', color: '#fff', fontSize: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .15s',
        }}
      >
        Change image
      </Box>
    </Box>
  ) : (
    <Button
      onClick={() => fileRef.current?.click()}
      startIcon={<ImageRoundedIcon />}
      variant="outlined"
      sx={{
        height: 70, borderStyle: 'dashed', fontSize: 11.5, color: 'text.secondary',
        '&:hover': { borderColor: THEME.primary, color: THEME.primary, borderStyle: 'dashed' },
      }}
    >
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setImage(e.target.files?.[0])} />
      Browse Media File
    </Button>
  );
}

function Field({ field, value, onChange }) {
  switch (field.type) {
    case 'text':
      return <TextField_ label={field.label} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
    case 'url':
      return <TextField_ label={field.label} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder || 'https://'} />;
    case 'textarea':
      return (
        <Box>
          <TextField_
            label={field.label}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            multiline
            minRows={2}
          />
          {field.max && (
            <Typography sx={{ fontSize: 9.5, color: (value || '').length > field.max ? 'error.main' : 'text.disabled', textAlign: 'right', mt: 0.25 }}>
              {(value || '').length}/{field.max}
            </Typography>
          )}
        </Box>
      );
    case 'select':
      return (
        <Box>
          <Typography sx={{ fontSize: 10.5, color: 'text.secondary', mb: 0.25 }}>{field.label}</Typography>
          <Select size="small" fullWidth value={value ?? ''} onChange={(e) => onChange(e.target.value)} sx={{ fontSize: 12.5 }}>
            {field.options.map((o) => (
              <MenuItem key={o} value={o} sx={{ fontSize: 12.5 }}>
                {o}
              </MenuItem>
            ))}
          </Select>
        </Box>
      );
    case 'buttons':
      return (
        <Box>
          <Typography sx={{ fontSize: 10.5, color: 'text.secondary', mb: 0.5 }}>{field.label}</Typography>
          <ButtonsEditor value={value || []} onChange={onChange} max={field.max} />
        </Box>
      );
    case 'listrows':
      return (
        <Box>
          <Typography sx={{ fontSize: 10.5, color: 'text.secondary', mb: 0.5 }}>{field.label}</Typography>
          <ListRowsEditor value={value || []} onChange={onChange} max={field.max} />
        </Box>
      );
    case 'keyvalue':
      return (
        <Box>
          <Typography sx={{ fontSize: 10.5, color: 'text.secondary', mb: 0.5 }}>{field.label}</Typography>
          <KeyValueEditor value={value || []} onChange={onChange} />
        </Box>
      );
    case 'media':
      return <MediaField value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function WhatsAppPreview({ type, data }) {
  const isOtp = type === 'otp-send';
  const buttons = data.buttons;
  return (
    <Box sx={{ bgcolor: WA.wallpaper, borderRadius: 1.5, p: 1.25 }}>
      <Paper elevation={0} sx={{ bgcolor: WA.bubbleOut, borderRadius: '8px 8px 2px 8px', p: 1, maxWidth: '100%' }}>
        {data.media && <Box component="img" src={data.media} sx={{ width: '100%', borderRadius: 1, mb: 0.75, display: 'block' }} />}
        {(data.caption || data.text) && (
          <Typography sx={{ fontSize: 12.5, whiteSpace: 'pre-wrap', color: '#111B21' }}>{data.caption || data.text}</Typography>
        )}
        {isOtp && (
          <Chip
            icon={<KeyRoundedIcon sx={{ fontSize: 13 }} />}
            label={`${data.otpLength || '6'}-digit code · expires ${data.expiry || '300'}s`}
            size="small"
            sx={{ mt: 0.5, fontSize: 10, bgcolor: '#fff' }}
          />
        )}
        {data.listTitle !== undefined && (
          <Typography sx={{ fontSize: 9.5, color: 'text.disabled', mt: 0.5 }}>{data.rows?.length || 0} options</Typography>
        )}
        <Stack direction="row" justifyContent="flex-end" spacing={0.25} sx={{ mt: 0.5 }}>
          <Typography sx={{ fontSize: 9.5, color: '#667781' }}>10:24 AM</Typography>
          <DoneAllRoundedIcon sx={{ fontSize: 13, color: WA.chipText }} />
        </Stack>
      </Paper>

      {Array.isArray(buttons) && buttons.length > 0 && (
        <Stack spacing={0.5} sx={{ mt: 0.5, maxWidth: 260 }}>
          {buttons.map((b) => (
            <Paper key={b.id} elevation={0} sx={{ py: 0.6, textAlign: 'center', borderRadius: 1, bgcolor: '#fff', color: WA.chipText, fontSize: 12, fontWeight: 600 }}>
              {b.label || 'Button'}
            </Paper>
          ))}
        </Stack>
      )}
      {data.listTitle && (
        <Paper elevation={0} sx={{ mt: 0.5, py: 0.6, textAlign: 'center', borderRadius: 1, bgcolor: '#fff', color: WA.chipText, fontSize: 12, fontWeight: 600, maxWidth: 260 }}>
          📋 {data.listTitle}
        </Paper>
      )}
      {data.buttonLabel && (
        <Paper elevation={0} sx={{ mt: 0.5, py: 0.6, textAlign: 'center', borderRadius: 1, bgcolor: '#fff', color: WA.chipText, fontSize: 12, fontWeight: 600, maxWidth: 260 }}>
          🔗 {data.buttonLabel}
        </Paper>
      )}
    </Box>
  );
}

function SidebarItem({ type, onDragStart, onClick }) {
  const schema = SCHEMAS[type];
  const color = catColor(type);
  return (
    <Box
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.9,
        cursor: 'grab', userSelect: 'none', borderBottom: '1px solid', borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' }, '&:active': { cursor: 'grabbing' },
      }}
    >
      <Box sx={{ width: 4, alignSelf: 'stretch', borderRadius: 4, bgcolor: color }} />
      <Box sx={{ fontSize: 14, lineHeight: 1 }}>{schema.icon}</Box>
      <Typography sx={{ flex: 1, fontWeight: 500, fontSize: 12.5 }}>{schema.label}</Typography>
      {schema.isNew && (
        <Chip label="NEW" size="small" sx={{ height: 17, fontSize: 9, fontWeight: 700, bgcolor: '#FCE7F3', color: '#DB2777' }} />
      )}
      <DragIndicatorRoundedIcon sx={{ fontSize: 15, color: 'action.disabled' }} />
    </Box>
  );
}

function TriggerDialog({ open, meta, onClose, onSave }) {
  const [draft, setDraft] = useState(meta);
  const [keywordInput, setKeywordInput] = useState('');
  useEffect(() => {
    if (open) {
      setDraft(clone(meta));
      setKeywordInput('');
    }
  }, [open, meta]);

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw) return;
    const kws = draft.trigger?.config?.keywords || [];
    if (!kws.includes(kw)) {
      setDraft({ ...draft, trigger: { ...draft.trigger, config: { ...draft.trigger.config, keywords: [...kws, kw] } } });
    }
    setKeywordInput('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700 }}>Flow trigger &amp; fallback</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Box>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5 }}>Starts when</Typography>
            <Select
              fullWidth
              size="small"
              value={draft.trigger?.type || 'keyword'}
              onChange={(e) => setDraft({ ...draft, trigger: { ...draft.trigger, type: e.target.value, config: draft.trigger?.config || {} } })}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="keyword">Keyword match</MenuItem>
              <MenuItem value="first_inbound_message">First inbound message</MenuItem>
              <MenuItem value="interactive_reply">Interactive reply</MenuItem>
              <MenuItem value="manual">Manual / campaign</MenuItem>
            </Select>
          </Box>
          {draft.trigger?.type === 'keyword' && (
            <Box>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.75 }}>Keywords</Typography>
              <Stack direction="row" spacing={0.75}>
                <TextField_
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="Type a keyword and press Enter"
                />
                <Button onClick={addKeyword} variant="contained" sx={{ minWidth: 0, px: 1.5, bgcolor: THEME.primary }}>
                  <AddRoundedIcon sx={{ fontSize: 16 }} />
                </Button>
              </Stack>
              <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                {(draft.trigger?.config?.keywords || []).map((kw) => (
                  <Chip
                    key={kw}
                    label={kw}
                    size="small"
                    onDelete={() =>
                      setDraft({
                        ...draft,
                        trigger: { ...draft.trigger, config: { keywords: draft.trigger.config.keywords.filter((k) => k !== kw) } },
                      })
                    }
                    sx={{ bgcolor: `${THEME.primaryLight}22`, color: THEME.primaryDark, fontSize: 11.5 }}
                  />
                ))}
              </Stack>
            </Box>
          )}
          <Divider />
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary' }}>FALLBACK POLICY</Typography>
          <Box>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5 }}>On unknown reply</Typography>
            <Select
              fullWidth
              size="small"
              value={draft.fallbackPolicy?.onUnknownReply || 'reprompt'}
              onChange={(e) => setDraft({ ...draft, fallbackPolicy: { ...draft.fallbackPolicy, onUnknownReply: e.target.value } })}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="reprompt">Re-prompt user</MenuItem>
              <MenuItem value="handoff">Handoff to agent</MenuItem>
              <MenuItem value="ignore">Ignore</MenuItem>
            </Select>
          </Box>
          <Stack direction="row" spacing={1}>
            <TextField_
              type="number"
              label="Max re-prompts"
              value={draft.fallbackPolicy?.maxReprompts ?? 2}
              onChange={(e) => setDraft({ ...draft, fallbackPolicy: { ...draft.fallbackPolicy, maxReprompts: Number(e.target.value) } })}
            />
            <TextField_
              type="number"
              label="Timeout (hours)"
              value={draft.fallbackPolicy?.onTimeoutHours ?? 24}
              onChange={(e) => setDraft({ ...draft, fallbackPolicy: { ...draft.fallbackPolicy, onTimeoutHours: Number(e.target.value) } })}
            />
          </Stack>
          <Box>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5 }}>On retries exhausted</Typography>
            <Select
              fullWidth
              size="small"
              value={draft.fallbackPolicy?.onExhaust || 'handoff'}
              onChange={(e) => setDraft({ ...draft, fallbackPolicy: { ...draft.fallbackPolicy, onExhaust: e.target.value } })}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="handoff">Handoff to agent</MenuItem>
              <MenuItem value="end">End flow</MenuItem>
            </Select>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={() => onSave(draft)} variant="contained" sx={{ bgcolor: THEME.primary }}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
}

const emptyFlowDoc = () => ({
  name: 'Untitled Flow',
  status: 'draft',
  description: '',
  trigger: { type: 'keyword', config: { keywords: ['hi'] } },
  fallbackPolicy: { onUnknownReply: 'reprompt', maxReprompts: 2, onTimeoutHours: 24, onExhaust: 'handoff' },
  nodes: [],
  edges: [],
});

export default function WhatsAppFlowBuilder() {
  const showToast = useToast()?.showToast;
  const hostRef = useRef(null);
  const editorRef = useRef(null);
  const suppressRef = useRef(false);
  const saveTimer = useRef(null);
  const cascadeRef = useRef(0);
  const importFileRef = useRef(null);
  const containerRef = useRef(null);

  const [meta, setMeta] = useState({
    name: 'Welcome Flow',
    status: 'draft',
    trigger: { type: 'keyword', config: { keywords: ['hi', 'hello'] } },
    fallbackPolicy: { onUnknownReply: 'reprompt', maxReprompts: 2, onTimeoutHours: 24, onExhaust: 'handoff' },
  });
  const metaRef = useRef(meta);

  useEffect(() => {
    metaRef.current = meta;
  }, [meta]);

  const toolbarRef = useRef(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? 0;
      setIsCompact(width < 760); // tweak this threshold to taste
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [sel, setSel] = useState(null);
  const [selData, setSelData] = useState({});
  const [showPreview, setShowPreview] = useState(true);
  const [stats, setStats] = useState({ nodes: 0, links: 0 });
  const [warnings, setWarnings] = useState([]);
  const [zoomPct, setZoomPct] = useState(100);
  const [savedTick, setSavedTick] = useState(false);
  const [query, setQuery] = useState('');
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [simMsgs, setSimMsgs] = useState([]);
  const [simActive, setSimActive] = useState(false);
  const [simDone, setSimDone] = useState(false);
  const [simInput, setSimInput] = useState('');
  const simTimer = useRef(null);
  const simGraph = useRef(null);
  const simCurrent = useRef(null);
  const simKey = useRef(0);
  const chatScrollRef = useRef(null);

  // --- Fullscreen support -----------------------------------------------
  // This is a CSS-only "fill the browser viewport" toggle, NOT the native
  // Fullscreen API — it never touches document.requestFullscreen(), so the
  // browser's own tab bar / address bar stay visible. It just expands the
  // builder to cover the whole content area via position:fixed + a high
  // z-index. Esc exits it, same as native fullscreen would.
  const toggleFullscreen = () => setIsFullscreen((v) => !v);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  const groupedPalette = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORIES.map((c) => ({
      ...c,
      items: Object.keys(SCHEMAS).filter(
        (t) => SCHEMAS[t].category === c.id && (!q || SCHEMAS[t].label.toLowerCase().includes(q))
      ),
    })).filter((c) => c.items.length > 0);
  }, [query]);

  const refreshNodeDom = (id, type, data) => {
    const el = document.querySelector(`#node-${id} .wfb-node`);
    if (el) el.outerHTML = buildNodeHtml(type, data);
  };

  const analyze = () => {
    const ed = editorRef.current;
    if (!ed) return;
    const data = ed.export()?.drawflow?.Home?.data || {};
    const nodes = Object.entries(data).filter(([k, v]) => v && nodeKeyToId(k) !== null);
    let links = 0;
    const orphans = [];
    const unconfigured = [];
    nodes.forEach(([, n]) => {
      const outConns = Object.values(n.outputs || {}).reduce((a, o) => a + (o.connections?.length || 0), 0);
      const inConns = Object.values(n.inputs || {}).reduce((a, i) => a + (i.connections?.length || 0), 0);
      links += outConns;
      if (inConns === 0 && outConns === 0 && !TERMINAL_TYPES.includes(n.name)) orphans.push(n.name);
      const s = SCHEMAS[n.name];
      if (s?.preview && !(n.data?.text || n.data?.caption)) unconfigured.push(s.label);
    });
    setStats({ nodes: nodes.length, links });
    const w = [];
    if (nodes.length === 0) w.push('Canvas is empty — drag blocks from the left');
    if (orphans.length) w.push(`${orphans.length} unconnected block${orphans.length > 1 ? 's' : ''}`);
    if (unconfigured.length) w.push(`${unconfigured.length} block${unconfigured.length > 1 ? 's' : ''} missing message text`);
    setWarnings(w);
  };

  const persist = (silent = true) => {
    const ed = editorRef.current;
    if (!ed) return;
    try {
      const doc = { ...toFlowDoc(), savedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
      if (silent) {
        setSavedTick(true);
        setTimeout(() => setSavedTick(false), 1500);
      }
    } catch {
      if (!silent) showToast?.('Could not save locally (storage full?). Try smaller media.', 'error');
    }
  };

  const scheduleSave = () => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(true), 800);
  };

  const toFlowDoc = () => {
    const ed = editorRef.current;
    const data = ed?.export()?.drawflow?.Home?.data || {};
    const nodes = [];
    const edges = [];
    Object.entries(data).forEach(([key, n]) => {
      if (!n || nodeKeyToId(key) === null) return;
      nodes.push({
        nodeKey: key,
        nodeType: n.name,
        backendNodeType: BACKEND_NODE_TYPE_MAP[n.name] || 'send_message',
        config: n.data || {},
        position: { x: Math.round(n.pos_x), y: Math.round(n.pos_y) },
      });
      Object.entries(n.outputs || {}).forEach(([oclass, o]) => {
        (o.connections || []).forEach((c) => {
          edges.push({ from: key, to: c.node, sourceHandle: oclass, targetHandle: c.input });
        });
      });
    });
    return { ...clone(metaRef.current), nodes, edges };
  };

  const addNodeRaw = (type, x, y, dataOverride) => {
    const ed = editorRef.current;
    if (!ed || !SCHEMAS[type]) return null;
    const data = dataOverride ? clone(dataOverride) : defaultDataFor(type);
    return ed.addNode(type, 1, outputCount(type, data), Math.round(x), Math.round(y), `wfb-${SCHEMAS[type].category}`, data, buildNodeHtml(type, data));
  };

  const addNodeAtClient = (type, clientX, clientY) => {
    const ed = editorRef.current;
    if (!ed) return null;
    const pre = ed.precanvas.getBoundingClientRect();
    const x = (clientX - pre.x) / ed.zoom - 126;
    const y = (clientY - pre.y) / ed.zoom - 24;
    return addNodeRaw(type, x, y);
  };

  const selectNode = (id) => {
    const ed = editorRef.current;
    if (!ed) return;
    try {
      const n = ed.getNodeFromId(id);
      if (!n) return;
      setSel({ id, type: n.name });
      setSelData(clone(n.data || {}));
      setShowPreview(true);
    } catch {
      setSel(null);
    }
  };

  const safeConnect = (fromId, toId, oclass = 'output_1', iclass = 'input_1') => {
    try {
      editorRef.current?.addConnection(fromId, toId, oclass, iclass);
    } catch {
      /* ignore invalid */
    }
  };

  const rebuildNode = (id) => {
    const ed = editorRef.current;
    if (!ed) return;
    const snap = ed.export()?.drawflow?.Home?.data || {};
    const entry = Object.entries(snap).find(([k, v]) => v && nodeKeyToId(k) === id);
    if (!entry) return;
    const n = entry[1];
    const type = n.name;
    const data = clone(n.data || {});
    const x = n.pos_x;
    const y = n.pos_y;
    const inConns = [];
    Object.values(n.inputs || {}).forEach((i) => (i.connections || []).forEach((c) => inConns.push({ from: c.node, output: c.output })));
    const outConns = [];
    Object.entries(n.outputs || {}).forEach(([oclass, o]) =>
      (o.connections || []).forEach((c) => outConns.push({ idx: Number(oclass.replace('output_', '')), node: c.node, input: c.input }))
    );

    suppressRef.current = true;
    try {
      ed.removeNodeId(`node-${id}`);
    } catch {
      /* noop */
    }
    const newId = addNodeRaw(type, x, y, data);
    inConns.forEach((c) => safeConnect(nodeKeyToId(c.from), newId, c.output, 'input_1'));
    const maxOut = outputCount(type, data);
    outConns.forEach((c) => {
      if (c.idx <= maxOut) safeConnect(newId, nodeKeyToId(c.node), `output_${c.idx}`, c.input);
    });
    suppressRef.current = false;
    if (newId) selectNode(newId);
    analyze();
    scheduleSave();
  };

  const patchSelData = (patch) => {
    const ed = editorRef.current;
    if (!ed || !sel) return;
    const cur = clone(ed.getNodeFromId(sel.id)?.data || {});
    const next = { ...cur, ...patch };
    const structural =
      (cur.buttons?.length ?? -1) !== (next.buttons?.length ?? -1) ||
      (cur.rows?.length ?? -1) !== (next.rows?.length ?? -1);
    ed.updateNodeDataFromId(sel.id, next);
    setSelData(next);
    refreshNodeDom(sel.id, sel.type, next);
    if (structural) {
      rebuildNode(sel.id);
    } else {
      analyze();
      scheduleSave();
    }
  };

  const clearCanvas = () => {
    const ed = editorRef.current;
    if (!ed) return;
    const data = ed.export()?.drawflow?.Home?.data || {};
    suppressRef.current = true;
    Object.keys(data)
      .filter((k) => nodeKeyToId(k) !== null)
      .forEach((k) => {
        try {
          ed.removeNodeId(`node-${nodeKeyToId(k)}`);
        } catch {
          /* noop */
        }
      });
    suppressRef.current = false;
    setSel(null);
    analyze();
  };

  const loadDoc = (doc) => {
    clearCanvas();
    const keyMap = {};
    (doc.nodes || []).forEach((n) => {
      if (!SCHEMAS[n.nodeType]) return;
      const id = addNodeRaw(n.nodeType, n.position?.x ?? 60, n.position?.y ?? 60, n.config || {});
      if (id) keyMap[n.nodeKey || `n${id}`] = id;
    });
    (doc.edges || []).forEach((e) => {
      const from = keyMap[e.from];
      const to = keyMap[e.to];
      if (from && to) safeConnect(from, to, e.sourceHandle || 'output_1', e.targetHandle || 'input_1');
    });
    setMeta({
      name: doc.name || 'Untitled Flow',
      status: doc.status || 'draft',
      trigger: doc.trigger || { type: 'keyword', config: { keywords: [] } },
      fallbackPolicy: doc.fallbackPolicy || { onUnknownReply: 'reprompt', maxReprompts: 2, onTimeoutHours: 24, onExhaust: 'handoff' },
    });
    setSel(null);
    analyze();
  };

  const seedDemoFlow = () => {
    const welcome = addNodeRaw('text-button', 60, 170, {
      text: '👋 Hey! Welcome to Infyle. How can we help you today?',
      buttons: [
        { id: uid(), label: 'See Pricing' },
        { id: uid(), label: 'Request Support' },
        { id: uid(), label: 'Talk to Human' },
      ],
    });
    const pricing = addNodeRaw('text-reply', 430, 30, {
      text: '💎 Our plans start at ₹499/month with unlimited campaigns.\n\nReply "menu" anytime to see these options again!',
    });
    const tag = addNodeRaw('add-to-tag', 430, 230, { tag: 'Follow-up' });
    const support = addNodeRaw('text-reply', 800, 230, {
      text: '🛠️ Got it! Our support team will reach out to you shortly.',
    });
    const agents = addNodeRaw('connect-agents', 430, 420, { note: 'Customer requested human help' });
    safeConnect(welcome, pricing, 'output_1', 'input_1');
    safeConnect(welcome, tag, 'output_2', 'input_1');
    safeConnect(welcome, agents, 'output_3', 'input_1');
    safeConnect(tag, support, 'output_1', 'input_1');
  };

  useEffect(() => {
    const host = hostRef.current;
    const el = document.createElement('div');
    el.className = 'drawflow';
    host.appendChild(el);

    const ed = new Drawflow(el);
    ed.reroute = true;
    ed.start();
    editorRef.current = ed;

    ed.on('nodeSelected', (id) => selectNode(id));
    ed.on('nodeUnselected', () => setSel(null));
    ed.on('nodeRemoved', () => {
      if (suppressRef.current) return;
      setSel(null);
      analyze();
      scheduleSave();
    });
    ed.on('connectionCreated', () => {
      if (suppressRef.current) return;
      analyze();
      scheduleSave();
    });
    ed.on('connectionRemoved', () => {
      if (suppressRef.current) return;
      analyze();
      scheduleSave();
    });

const onDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
};
const onDrop = (e) => {
  e.preventDefault();
  const type = e.dataTransfer.getData('text/node-type') || e.dataTransfer.getData('text/plain');
  if (!SCHEMAS[type]) return;
  const id = addNodeAtClient(type, e.clientX, e.clientY);
  if (id) {
    selectNode(id);
    analyze();
    scheduleSave();
  }
};
    host.addEventListener('dragover', onDragOver);
    host.addEventListener('drop', onDrop);

    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    let loaded = false;
    if (stored) {
      try {
        const doc = JSON.parse(stored);
        if ((doc.nodes || []).length > 0) {
          loadDoc(doc);
          loaded = true;
        }
      } catch {
        loaded = false;
      }
    }
    if (!loaded) seedDemoFlow();
    analyze();

    return () => {
      clearTimeout(saveTimer.current);
      host.removeEventListener('dragover', onDragOver);
      host.removeEventListener('drop', onDrop);
      host.removeChild(el);
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel && !isTypingTarget(document.activeElement)) {
        e.preventDefault();
        suppressRef.current = false;
        try {
          editorRef.current?.removeNodeId(`node-${sel.id}`);
        } catch {
          /* noop */
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel]);

  const duplicateSelected = () => {
    if (!sel) return;
    const ed = editorRef.current;
    const n = ed.getNodeFromId(sel.id);
    const id = addNodeRaw(sel.type, n.pos_x + 30, n.pos_y + 30, n.data);
    if (id) {
      selectNode(id);
      analyze();
      scheduleSave();
      showToast?.('Block duplicated', 'success');
    }
  };

  const deleteSelected = () => {
    if (!sel) return;
    try {
      editorRef.current?.removeNodeId(`node-${sel.id}`);
    } catch {
      /* noop */
    }
  };

  const handleExport = () => {
    const doc = toFlowDoc();
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(meta.name || 'flow').replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast?.('Flow exported as JSON', 'success');
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.drawflow?.Home?.data) {
        const raw = parsed.drawflow.Home.data;
        const nodes = [];
        const edges = [];
        Object.entries(raw).forEach(([key, n]) => {
          if (!n || nodeKeyToId(key) === null || !SCHEMAS[n.name]) return;
          nodes.push({ nodeKey: key, nodeType: n.name, config: n.data || {}, position: { x: n.pos_x, y: n.pos_y } });
          Object.entries(n.outputs || {}).forEach(([oclass, o]) =>
            (o.connections || []).forEach((c) => edges.push({ from: key, to: c.node, sourceHandle: oclass, targetHandle: c.input }))
          );
        });
        if (!nodes.length) throw new Error('no known blocks');
        loadDoc({ ...emptyFlowDoc(), name: meta.name, nodes, edges });
      } else if (Array.isArray(parsed?.nodes)) {
        loadDoc(parsed);
      } else {
        throw new Error('unrecognized format');
      }
      persist(false);
      showToast?.('Flow imported', 'success');
    } catch {
      showToast?.('Invalid flow JSON file', 'error');
    }
  };

  const handleSave = () => {
    if (!meta.name.trim()) {
      showToast?.('Give your flow a name first', 'warning');
      return;
    }
    persist(false);
    showToast?.(`"${meta.name}" saved (${stats.nodes} blocks, ${stats.links} connections)`, 'success');
  };

  const zoom = (dir) => {
    const ed = editorRef.current;
    if (!ed) return;
    if (dir === 0) ed.zoom_reset();
    else if (dir > 0) ed.zoom_in();
    else ed.zoom_out();
    setZoomPct(Math.round(ed.zoom * 100));
  };

  // --- Flow simulator -----------------------------------------------------
  const simClearTimer = () => {
    clearTimeout(simTimer.current);
    simTimer.current = null;
  };

  const buildGraph = () => {
    const data = editorRef.current?.export()?.drawflow?.Home?.data || {};
    const byId = {};
    const outs = {};
    Object.entries(data).forEach(([k, n]) => {
      const id = nodeKeyToId(k);
      if (!n || id === null) return;
      byId[id] = { id, type: n.name, data: n.data || {}, x: n.pos_x, y: n.pos_y };
      outs[id] = [];
    });
    Object.entries(data).forEach(([k, n]) => {
      const id = nodeKeyToId(k);
      if (!n || id === null) return;
      Object.entries(n.outputs || {}).forEach(([oc, o]) =>
        (o.connections || []).forEach((c) => {
          const to = Number(String(c.node).replace('node-', ''));
          if (byId[to]) outs[id].push({ out: Number(oc.replace('output_', '')), to });
        })
      );
    });
    return { byId, outs };
  };

  const findStartId = (g) => {
    const targets = new Set();
    Object.values(g.outs).forEach((list) => list.forEach((e) => targets.add(e.to)));
    const starts = Object.values(g.byId).filter((n) => !targets.has(n.id));
    const pool = starts.length ? starts : Object.values(g.byId);
    pool.sort((a, b) => a.y - b.y || a.x - b.x);
    return pool[0]?.id ?? null;
  };

  const pushMsg = (msg) => {
    simKey.current += 1;
    setSimMsgs((prev) => [...prev, { key: `m${simKey.current}`, time: dayjs().format('hh:mm A'), ...msg }]);
  };

  const isInteractiveNode = (n) => {
    if (n.type === 'otp-verify') return true;
    if (n.type === 'text-button' || n.type === 'media-button') return (n.data.buttons || []).length > 0;
    if (n.type === 'text-list') return true;
    return false;
  };

  // FIX: this previously had no case for 'text-button', so it fell through
  // to `default` and silently dropped the buttons array — that's why the
  // simulator never rendered the quick-reply buttons even though the
  // Properties-panel preview (which reads data.buttons directly) showed them fine.
  const botBubbleFor = (n) => {
    const d = n.data;
    switch (n.type) {
      case 'text-button':
        return { kind: 'card', text: d.text || '', buttons: d.buttons || [] };
      case 'media-caption':
      case 'media-button':
        return { kind: 'card', media: d.media || null, text: d.caption || '', buttons: n.type === 'media-button' ? d.buttons || [] : [] };
      case 'text-list':
        return { kind: 'card', text: d.text || '', listTitle: d.listTitle || 'View options', rows: d.rows || [] };
      case 'url-button':
        return { kind: 'card', text: d.text || '', url: { label: d.buttonLabel || 'Open link', href: d.url || '#' } };
      case 'otp-send':
        return { kind: 'card', text: d.text || `Your code is {{otp}}`, otp: { len: d.otpLength || '6', expiry: d.expiry || '300' } };
      case 'otp-verify':
        return { kind: 'card', text: '🔐 Enter the code you received.', choices: ['Code correct', 'Code wrong'] };
      default:
        return { kind: 'card', text: d.text || d.formName || '' };
    }
  };

  const simFinish = () => {
    setSimActive(false);
    setSimDone(true);
    simCurrent.current = null;
  };

  const simFollowOrEnd = (nodeId) => {
    const g = simGraph.current;
    const edges = g.outs[nodeId] || [];
    if (edges.length === 1) {
      simTimer.current = setTimeout(() => simRunNode(edges[0].to), SIM_DELAY);
    } else if (edges.length === 0) {
      pushMsg({ from: 'sys', text: '✔ Conversation completed' });
      simFinish();
    } else {
      simTimer.current = setTimeout(() => simRunNode(edges[0].to), SIM_DELAY);
    }
  };

  const simRunNode = (nodeId) => {
    const g = simGraph.current;
    const n = g.byId[nodeId];
    if (!n) {
      pushMsg({ from: 'sys', text: '⚠️ Broken link — block missing' });
      simFinish();
      return;
    }
    simCurrent.current = nodeId;
    if (TERMINAL_TYPES.includes(n.type)) {
      pushMsg({
        from: 'sys',
        text: n.type === 'opt-out' ? '🚫 Contact opted-out — no more messages will be sent' : '🙋 You are now chatting with a human agent — bot paused',
      });
      simFinish();
      return;
    }
    if (!MESSAGE_TYPES.includes(n.type)) {
      pushMsg({ from: 'sys', text: ACTION_STATUS[n.type]?.(n.data) || `⚙️ ${SCHEMAS[n.type]?.label || 'Action'} executed` });
      simFollowOrEnd(nodeId);
      return;
    }
    pushMsg({ from: 'bot', ...botBubbleFor(n) });
    if (isInteractiveNode(n)) return;
    simFollowOrEnd(nodeId);
  };

  const simPickChoice = (idx, label) => {
    if (!simActive) return;
    simClearTimer();
    pushMsg({ from: 'user', text: label });
    const cur = simCurrent.current;
    const g = simGraph.current;
    const edge = (g.outs[cur] || []).find((e) => e.out === idx + 1) || (g.outs[cur] || [])[idx];
    if (!edge) {
      pushMsg({ from: 'sys', text: '⚠️ No next step connected to this option — flow ended here' });
      simFinish();
      return;
    }
    simTimer.current = setTimeout(() => simRunNode(edge.to), SIM_DELAY);
  };

  const simTryStart = (rawText) => {
    const text = rawText.trim();
    if (!text) return;
    const g = buildGraph();
    if (!Object.keys(g.byId).length) {
      showToast?.('Add blocks on the canvas first', 'warning');
      return;
    }
    const trigger = meta.trigger || { type: 'keyword', config: { keywords: [] } };
    if (trigger.type === 'keyword') {
      const kws = (trigger.config?.keywords || []).map((k) => String(k).toLowerCase());
      if (!kws.includes(text.toLowerCase())) {
        pushMsg({ from: 'user', text });
        pushMsg({ from: 'sys', text: `❌ No flow started — "${truncate(text, 24)}" does not match any trigger keyword` });
        return;
      }
    }
    simGraph.current = g;
    simClearTimer();
    setSimDone(false);
    setSimActive(true);
    pushMsg({ from: 'user', text });
    simRunNode(findStartId(g));
  };

  const simHandleSend = () => {
    const text = simInput.trim();
    if (!text) return;
    setSimInput('');
    if (simActive) {
      const policy = meta.fallbackPolicy?.onUnknownReply || 'reprompt';
      pushMsg({ from: 'user', text });
      if (policy === 'ignore') return;
      if (policy === 'handoff') {
        pushMsg({ from: 'sys', text: '🙋 Unknown reply — handing over to a human agent (fallback policy)' });
        simFinish();
      } else {
        pushMsg({ from: 'sys', text: '🤖 Please tap one of the options above 👆' });
      }
      return;
    }
    simTryStart(text);
  };

  const simReset = () => {
    simClearTimer();
    setSimMsgs([]);
    setSimActive(false);
    setSimDone(false);
    simCurrent.current = null;
    simGraph.current = null;
  };

  // FIX: previously this auto-fired simTryStart(kw) on a 350ms timer right
  // after opening, so the flow "just ran" before you typed anything. Now it
  // only resets the chat and opens the drawer — nothing happens until the
  // person actually types the trigger keyword (e.g. "hi") into the input
  // and sends it, same as simTryStart() already handled for manual typing.
  const openSimulator = () => {
    if (stats.nodes === 0) {
      showToast?.('Canvas is empty — add blocks first', 'warning');
      return;
    }
    persist(true);
    simReset();
    setSimOpen(true);
  };

  const closeSimulator = () => {
    simClearTimer();
    setSimOpen(false);
  };

  useEffect(() => {
    if (simOpen) chatScrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [simMsgs, simOpen]);

  useEffect(() => () => simClearTimer(), []);

  const selSchema = sel ? SCHEMAS[sel.type] : null;

  return (
    <Box
      ref={containerRef}
      sx={{
        height: isFullscreen ? '100vh' : 'calc(100vh - 132px)',
        minHeight: 560,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        bgcolor: isFullscreen ? '#fff' : 'transparent',
        p: isFullscreen ? 1.25 : 0,
        // CSS-based "in-browser" fullscreen: fixed + high z-index covers the
        // viewport but stays inside the browser window (tabs/URL bar remain
        // visible) — unlike the native Fullscreen API.
        ...(isFullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          zIndex: 1300,
        }),
      }}
    >
      <style>{WFB_CSS}</style>

      {/* Toolbar */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 1.5, py: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <Box sx={{ width: 8, height: 28, borderRadius: 2, bgcolor: THEME.primary }} />
          <TextField
            value={meta.name}
            onChange={(e) => {
              setMeta((m) => ({ ...m, name: e.target.value }));
              scheduleSave();
            }}
            size="small"
            sx={{ width: 200, '& .MuiOutlinedInput-root': { fontSize: 13.5, fontWeight: 700 } }}
          />
          <Select
            size="small"
            value={meta.status}
            onChange={(e) => {
              setMeta((m) => ({ ...m, status: e.target.value }));
              scheduleSave();
            }}
            sx={{ fontSize: 12, height: 36, '.MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
          >
            {Object.keys(STATUS_COLORS).map((s) => (
              <MenuItem key={s} value={s} sx={{ fontSize: 12.5 }}>
                {s}
              </MenuItem>
            ))}
          </Select>
          <Chip
            label={meta.status}
            size="small"
            color={STATUS_COLORS[meta.status]}
            variant="outlined"
            sx={{ fontSize: 10.5, textTransform: 'capitalize' }}
          />

          {warnings.map((w) => (
            <Chip
              key={w}
              icon={<WarningAmberRoundedIcon sx={{ fontSize: 13 }} />}
              label={w}
              size="small"
              sx={{ fontSize: 10.5, bgcolor: `${THEME.amber}18`, color: '#92600A', fontWeight: 600 }}
            />
          ))}
          {warnings.length === 0 && stats.nodes > 0 && (
            <Chip
              icon={<CheckCircleRoundedIcon sx={{ fontSize: 13 }} />}
              label="Flow looks good"
              size="small"
              sx={{ fontSize: 10.5, bgcolor: `${THEME.primaryLight}1A`, color: THEME.primaryDark, fontWeight: 600 }}
            />
          )}

          <Box sx={{ flex: 1 }} />
          {savedTick && (
            <Typography sx={{ fontSize: 10.5, color: THEME.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 13 }} /> Draft saved
            </Typography>
          )}
          <Tooltip title="Load the demo flow (replaces canvas)">
            <Button
              startIcon={<AutoAwesomeRoundedIcon />}
              size="small"
              variant="outlined"
              onClick={() => {
                if (stats.nodes > 0 && !window.confirm('Replace current canvas with the sample flow?')) return;
                clearCanvas();
                seedDemoFlow();
                persist();
                showToast?.('Sample flow loaded — hit Test run to try it', 'success');
              }}
              sx={{
                fontSize: 12,
                minWidth: 'auto',
                px: 1,
                '& .MuiButton-startIcon': { mx: { xs: 0, sm: 1 } },
              }}
            >
              {/* <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Sample
              </Box> */}
            </Button>
          </Tooltip>
          <Tooltip title="Simulate this flow as a customer would experience it">
            <Button
              startIcon={<PlayArrowRoundedIcon />}
              size="small"
              variant="outlined"
              onClick={openSimulator}
              sx={{
                fontSize: 12,
                color: THEME.primary,
                borderColor: THEME.primary,
                minWidth: 'auto',
                px: 1,
                '& .MuiButton-startIcon': { mx: { xs: 0, sm: 1 } },
              }}
            >
              {/* <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Test run
              </Box> */}
            </Button>
          </Tooltip>
          <Tooltip title="Trigger & fallback settings">
            <Button startIcon={<TuneRoundedIcon />} size="small" variant="outlined" onClick={() => setTriggerOpen(true)} sx={{ fontSize: 12 }}>
              Trigger
            </Button>
          </Tooltip>
          <Tooltip title="Zoom out">
            <IconButton size="small" onClick={() => zoom(-1)}><ZoomOutRoundedIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', width: 38, textAlign: 'center' }}>{zoomPct}%</Typography>
          <Tooltip title="Zoom in">
            <IconButton size="small" onClick={() => zoom(1)}><ZoomInRoundedIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Reset zoom">
            <IconButton size="small" onClick={() => zoom(0)}><CenterFocusStrongRoundedIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Button startIcon={<SaveRoundedIcon />} size="small" variant="contained" onClick={handleSave} sx={{ bgcolor: THEME.primary, fontSize: 12 }}>
            Save
          </Button>
          <Tooltip title="Export JSON">
            <IconButton size="small" onClick={handleExport}><FileDownloadRoundedIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Import JSON">
            <IconButton size="small" onClick={() => importFileRef.current?.click()}><FileUploadRoundedIcon fontSize="small" /></IconButton>
          </Tooltip>
          <input ref={importFileRef} type="file" accept="application/json" hidden onChange={handleImportFile} />
          <Tooltip title="Clear canvas">
            <IconButton
              size="small"
              onClick={() => {
                if (window.confirm('Remove all blocks from the canvas?')) {
                  clearCanvas();
                  persist();
                  showToast?.('Canvas cleared', 'info');
                }
              }}
            >
              <DeleteSweepRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            <IconButton size="small" onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExitRoundedIcon fontSize="small" /> : <FullscreenRoundedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Chip label={`${stats.nodes} blocks · ${stats.links} links`} size="small" sx={{ fontSize: 10.5, bgcolor: THEME.bg, fontWeight: 600 }} />
        </Stack>
      </Paper>

      {/* Workspace */}
      <Stack direction="row" spacing={1.25} sx={{ flex: 1, minHeight: 0 }}>
        {/* Palette */}
        <Paper elevation={0} sx={{ width: 228, flexShrink: 0, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ px: 1.25, py: 1.25, bgcolor: THEME.ink }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>WhatsApp Flow</Typography>
            <Typography sx={{ fontSize: 10, color: '#9BB0AB' }}>{Object.keys(SCHEMAS).length} blocks · Meta-ready · OTP built-in</Typography>
          </Box>
          <Box sx={{ p: 1 }}>
            <TextField_
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search blocks…"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 16, color: 'action.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {groupedPalette.map((cat) => (
              <Box key={cat.id}>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1.25, pt: 1, pb: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cat.color }} />
                  <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: 'text.secondary' }}>
                    {cat.label}
                  </Typography>
                </Stack>
                {cat.items.map((type) => (
                  <SidebarItem
                    key={type}
                    type={type}
                    onDragStart={(e, t) => e.dataTransfer.setData('text/node-type', t)}
                    onClick={() => {
                      const rect = hostRef.current?.getBoundingClientRect();
                      if (!rect) return;
                      const jitter = cascadeRef.current;
                      cascadeRef.current = (cascadeRef.current + 36) % 180;
                      const id = addNodeAtClient(type, rect.left + rect.width * 0.42 + jitter, rect.top + 130 + jitter);
                      if (id) {
                        selectNode(id);
                        analyze();
                        scheduleSave();
                      }
                    }}
                  />
                ))}
              </Box>
            ))}
          </Box>
          <Box sx={{ px: 1.25, py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography sx={{ fontSize: 9.5, color: 'text.disabled', lineHeight: 1.5 }}>
              Drag a block onto the canvas, or click to drop it in. Connect ports to build the conversation. Press Delete to remove the selected block.
            </Typography>
          </Box>
        </Paper>

        {/* Canvas */}
        <Paper
          elevation={0}
          sx={{ flex: 1, minWidth: 0, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', position: 'relative' }}
        >
          <Box ref={hostRef} className="wfb-host" />
          {stats.nodes === 0 && (
            <Box className="wfb-empty">
              <Stack alignItems="center" spacing={1} sx={{ opacity: 0.55 }}>
                <BoltRoundedIcon sx={{ fontSize: 44, color: THEME.primary }} />
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: THEME.textSecondary }}>Your flow canvas is empty</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                  Drag blocks from the left panel to start building your chatbot
                </Typography>
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Properties */}
        <Paper
          elevation={0}
          sx={{
            width: 320, flexShrink: 0, border: '1px solid', borderColor: 'divider', borderRadius: 2,
            display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {!sel && (
            <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ flex: 1, px: 3, textAlign: 'center' }}>
              <TuneRoundedIcon sx={{ fontSize: 36, color: 'divider' }} />
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                Select a block on the canvas to edit its message, buttons and WhatsApp preview.
              </Typography>
            </Stack>
          )}
          {sel && selSchema && (
            <>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', bgcolor: `${catColor(sel.type)}0D` }}>
                <Box sx={{ fontSize: 16 }}>{selSchema.icon}</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{selSchema.label}</Typography>
                  <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Block #{sel.id}</Typography>
                </Box>
                <Tooltip title="Duplicate block">
                  <IconButton size="small" onClick={duplicateSelected}><ContentCopyRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
                </Tooltip>
                <Tooltip title="Delete block">
                  <IconButton size="small" onClick={deleteSelected}><DeleteOutlineRoundedIcon sx={{ fontSize: 16, color: THEME.red }} /></IconButton>
                </Tooltip>
              </Stack>

              {outputCount(sel.type, selData) > 1 && (
                <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ px: 1.5, pt: 1 }}>
                  {branchLabels(sel.type, selData).map((l, i) => (
                    <Chip key={i} label={`①②③④⑤⑥⑦⑧⑨⑩`.slice(i, i + 1) + ' ' + l} size="small" sx={{ fontSize: 10, bgcolor: `${catColor(sel.type)}14`, color: catColor(sel.type), fontWeight: 700 }} />
                  ))}
                </Stack>
              )}

              <Stack spacing={1.5} sx={{ p: 1.5, flex: 1, overflowY: 'auto' }}>
                {selSchema.fields.length === 0 && (
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    No configuration needed — this block ends the chat{sel.type === 'opt-out' ? ' and marks the contact opted out.' : '.'}
                  </Typography>
                )}
                {selSchema.fields.map((f) => (
                  <Field key={f.key} field={f} value={selData[f.key]} onChange={(v) => patchSelData({ [f.key]: v })} />
                ))}

                {selSchema.preview && (
                  <>
                    <Divider />
                    <FormControlLabel
                      control={<Switch size="small" checked={showPreview} onChange={(e) => setShowPreview(e.target.checked)} />}
                      label={
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: WA.chipText, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <VisibilityRoundedIcon sx={{ fontSize: 14 }} /> WHATSAPP PREVIEW
                        </Typography>
                      }
                    />
                    {showPreview && <WhatsAppPreview type={sel.type} data={selData} />}
                  </>
                )}
              </Stack>
            </>
          )}
        </Paper>
      </Stack>

      {/* Flow simulator */}
      <Drawer
        anchor="right"
        open={simOpen}
        onClose={closeSimulator}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, display: 'flex', flexDirection: 'column' } }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 1.5, py: 1.25, bgcolor: THEME.ink, color: '#fff' }}
        >
          <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: THEME.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
            🤖
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{meta.name || 'Flow'} — Simulator</Typography>
            <Typography sx={{ fontSize: 10, color: simActive ? THEME.primaryLight : '#9BB0AB' }}>
              {simActive ? '● bot is typing…' : simDone ? 'conversation ended — type a keyword to replay' : 'type a trigger keyword to start'}
            </Typography>
          </Box>
          <Tooltip title="Restart">
            <IconButton size="small" onClick={simReset} sx={{ color: '#fff' }}>
              <RestartAltRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={closeSimulator} sx={{ color: '#fff' }}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box ref={chatScrollRef} sx={{ flex: 1, overflowY: 'auto', bgcolor: WA.wallpaper, p: 1.25, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)', backgroundSize: 18 }}>
          {simMsgs.length === 0 && (
            <Stack alignItems="center" spacing={0.75} sx={{ mt: 6, opacity: 0.6 }}>
              <BoltRoundedIcon sx={{ fontSize: 34, color: THEME.primary }} />
              <Typography sx={{ fontSize: 12, color: THEME.textSecondary, textAlign: 'center', px: 3 }}>
                Type a trigger keyword below (e.g. "{meta.trigger?.config?.keywords?.[0] || 'hi'}") to start.
              </Typography>
            </Stack>
          )}
          {simMsgs.map((m) => {
            if (m.from === 'sys') {
              return (
                <Stack key={m.key} alignItems="center" sx={{ my: 1, width: '100%' }}>
                  <Paper elevation={0} sx={{ px: 1.25, py: 0.4, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.75)' }}>
                    <Typography sx={{ fontSize: 10, color: THEME.textSecondary, textAlign: 'center' }}>{m.text}</Typography>
                  </Paper>
                </Stack>
              );
            }
            if (m.from === 'user') {
              return (
                <Stack key={m.key} direction="row" sx={{ mb: 0.75, width: '100%', justifyContent: 'end' }}>
                  <Paper elevation={0} sx={{ bgcolor: WA.bubbleOut, borderRadius: '8px 8px 2px 8px', px: 1.15, py: 0.8, maxWidth: '78%' }}>
                    <Typography sx={{ fontSize: 12.5, color: '#111B21', whiteSpace: 'pre-wrap' }}>{m.text}</Typography>
                    <Typography sx={{ fontSize: 9, color: '#667781', textAlign: 'right', mt: 0.25 }}>{m.time} ✓✓</Typography>
                  </Paper>
                </Stack>
              );
            }
            return (
              <Stack key={m.key} direction="row" justifyContent="flex-start" sx={{ mb: 0.75, width: '100%' }}>
                <Box sx={{ maxWidth: '82%' }}>
                  <Paper elevation={0} sx={{  bgcolor: '#fff', borderRadius: '8px 8px 8px 2px', px: 1.15, py: 0.8, overflow: 'hidden' }}>
                    {m.media && <Box component="img" src={m.media} sx={{ width: '400px', height: '200px', borderRadius: 1, mb: 0.75, display: 'block', objectFit: 'cover' }} />}
                    {m.text && <Typography sx={{ fontSize: 12.5, color: '#111B21', whiteSpace: 'pre-wrap' }}>{m.text}</Typography>}
                    {m.otp && (
                      <Chip
                        icon={<KeyRoundedIcon sx={{ fontSize: 12 }} />}
                        label={`${m.otp.len}-digit code · expires ${m.otp.expiry}s`}
                        size="small"
                        sx={{ mt: 0.5, fontSize: 9.5, bgcolor: '#F5F7F8' }}
                      />
                    )}
                    {m.url && (
                      <Paper
                        component="a"
                        href={m.url.href}
                        target="_blank"
                        rel="noreferrer"
                        elevation={0}
                        sx={{ display: 'block', mt: 0.75, py: 0.6, textAlign: 'center', borderRadius: 1, border: '1px solid', borderColor: 'divider', color: WA.chipText, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                      >
                        🔗 {m.url.label}
                      </Paper>
                    )}
                    <Typography sx={{ fontSize: 9, color: '#667781', textAlign: 'right', mt: 0.25 }}>{m.time}</Typography>
                  </Paper>

                  {Array.isArray(m.buttons) && m.buttons.length > 0 && (
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      {m.buttons.map((b, i) => (
                        <Paper
                          key={b.id || i}
                          onClick={() => simPickChoice(i, b.label)}
                          elevation={0}
                          sx={{
                            py: 0.65, textAlign: 'center', borderRadius: 1, bgcolor: '#fff',
                            color: WA.chipText, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            '&:hover': { bgcolor: `${WA.chipText}0F` },
                          }}
                        >
                          {b.label || 'Button'}
                        </Paper>
                      ))}
                    </Stack>
                  )}

                  {m.listTitle && (
                    <Paper elevation={0} sx={{ mt: 0.5, borderRadius: 1, overflow: 'hidden' }}>
                      <Box
                        onClick={() => simPickChoice(0, m.listTitle)}
                        sx={{ py: 0.65, textAlign: 'center', bgcolor: '#fff', color: WA.chipText, fontSize: 12, fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: `${WA.chipText}0F` } }}
                      >
                        📋 {m.listTitle}
                      </Box>
                      {(m.rows || []).map((r) => (
                        <Box key={r.id} sx={{ px: 1.25, py: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#111B21' }}>{r.title}</Typography>
                          {r.description && <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{r.description}</Typography>}
                        </Box>
                      ))}
                    </Paper>
                  )}

                  {Array.isArray(m.choices) && (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                      {m.choices.map((c, i) => (
                        <Paper
                          key={c}
                          onClick={() => simPickChoice(i, c)}
                          elevation={0}
                          sx={{
                            flex: 1, py: 0.65, textAlign: 'center', borderRadius: 1, bgcolor: '#fff',
                            color: WA.chipText, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                            '&:hover': { bgcolor: `${WA.chipText}0F` },
                          }}
                        >
                          {i === 0 ? '✅' : '❌'} {c}
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Stack>
            );
          })}
        </Box>

        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
          <TextField_
            value={simInput}
            onChange={(e) => setSimInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && simHandleSend()}
            placeholder={simActive ? 'Type a message…' : `Type "${meta.trigger?.config?.keywords?.[0] || 'hi'}" and send`}
            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
          />
          <IconButton onClick={simHandleSend} sx={{ bgcolor: THEME.primary, color: '#fff', '&:hover': { bgcolor: THEME.primaryDark } }}>
            <SendRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Drawer>

      <TriggerDialog
        open={triggerOpen}
        meta={meta}
        onClose={() => setTriggerOpen(false)}
        onSave={(d) => {
          setMeta(d);
          setTriggerOpen(false);
          scheduleSave();
          showToast?.('Trigger settings applied', 'success');
        }}
      />
    </Box>
  );
}