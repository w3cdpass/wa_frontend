import { Chip } from '@mui/material';

const STATUS_MAP = {
  completed: { label: 'Completed', color: 'success' },
  processing: { label: 'Processing', color: 'info' },
  scheduled: { label: 'Scheduled', color: 'warning' },
  draft: { label: 'Draft', color: 'default' },
  failed: { label: 'Failed', color: 'error' },
  paused: { label: 'Paused', color: 'default' },
  cancelled: { label: 'Cancelled', color: 'default' },
  valid: { label: 'Valid', color: 'success' },
  invalid: { label: 'Invalid', color: 'error' },
  duplicate: { label: 'Duplicate', color: 'warning' },
  active: { label: 'Active', color: 'success' },
  suspended: { label: 'Suspended', color: 'error' },
};

export default function StatusChip({ status, size = 'small' }) {
  const cfg = STATUS_MAP[status] || { label: status, color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size={size} variant={cfg.color === 'default' ? 'outlined' : 'filled'} />;
}
