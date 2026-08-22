import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, Typography, Stack, Avatar, Chip, Divider, Button,
  Alert, Skeleton, TextField, Paper, Badge,
} from '@mui/material';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import FingerprintRoundedIcon from '@mui/icons-material/FingerprintRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import dayjs from 'dayjs';

const ROLE_COLORS = {
  SuperAdmin: '#8B5CF6',
  Reseller: '#0F7B6C',
  Client: '#2F80ED',
  User: '#5B6672',
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', businessName: '' });

  useEffect(() => {
    let mounted = true;
    api.getWallet()
      .then((res) => { if (mounted) setWallet(res); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', businessName: user.businessName || '' });
    }
  }, [user]);

  const initials = (user?.name || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.User;

  if (loading) {
    return (
      <Box>
        <Stack spacing={2.5}>
          <Skeleton variant="text" width={200} height={36} />
          <Grid container spacing={2.5}>
            <Grid item xs={12} lg={5}><Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} /></Grid>
            <Grid item xs={12} lg={7}><Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} /></Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Profile</Typography>
          <Typography variant="body2" color="text.secondary">Your account, business, and connection details.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<LogoutRoundedIcon />} onClick={handleLogout}>
            Sign out
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        {/* Identity card */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={2.5}>
            <Card sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
              <Stack alignItems="center" spacing={2}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={<VerifiedRoundedIcon sx={{ color: '#17C994', bgcolor: 'background.paper', borderRadius: '50%', fontSize: 22 }} />}
                >
                  <Avatar sx={{ width: 88, height: 88, bgcolor: roleColor, fontSize: 32, fontWeight: 800 }}>
                    {initials}
                  </Avatar>
                </Badge>
                <Box>
                  <Typography variant="h6" fontWeight={800}>{user?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                  <Chip
                    size="small"
                    label={user?.role || 'User'}
                    sx={{ mt: 1, bgcolor: `${roleColor}1a`, color: roleColor, fontWeight: 700 }}
                  />
                </Box>
              </Stack>
              <Divider sx={{ my: 2.5 }} />
              <Stack spacing={1.5}>
                <InfoRow icon={<StorefrontRoundedIcon fontSize="small" />} label="Business" value={user?.businessName || '—'} />
                <InfoRow icon={<PhoneAndroidRoundedIcon fontSize="small" />} label="Virtual number" value={user?.virtualNumber || '—'} />
                <InfoRow icon={<CalendarTodayRoundedIcon fontSize="small" />} label="Member since" value={user?.connectedSince ? dayjs(user.connectedSince).format('D MMM YYYY') : '—'} />
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>Wallet</Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ width: 44, height: 44, bgcolor: 'rgba(23,201,148,0.12)', color: '#17C994' }}>
                  <AccountBalanceWalletRoundedIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={800}>
                    {(wallet?.balance ?? 0).toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">available credits</Typography>
                </Box>
                <Chip
                  size="small"
                  label={wallet?.status === 'suspended' ? 'Suspended' : 'Active'}
                  color={wallet?.status === 'suspended' ? 'error' : 'success'}
                  variant="outlined"
                />
              </Stack>
            </Card>
          </Stack>
        </Grid>

        {/* Account details */}
        <Grid item xs={12} lg={7}>
          <Stack spacing={2.5}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={800}>Account details</Typography>
                <Button size="small" variant="outlined" onClick={() => setEditing(!editing)}>
                  {editing ? 'Cancel' : 'Edit'}
                </Button>
              </Stack>

              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Full name"
                    value={editing ? form.name : (user?.name || '')}
                    disabled={!editing}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Business name"
                    value={editing ? form.businessName : (user?.businessName || '')}
                    disabled={!editing}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    fullWidth
                  />
                </Stack>
                <TextField
                  label="Email address"
                  value={user?.email || ''}
                  disabled
                  fullWidth
                  helperText="Email cannot be changed here — contact support to update it."
                />
              </Stack>

              {editing && (
                <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
                  <Button variant="contained" onClick={() => { setEditing(false); }}>
                    Save changes
                  </Button>
                  <Button color="inherit" onClick={() => { setEditing(false); setForm({ name: user?.name || '', businessName: user?.businessName || '' }); }}>
                    Discard
                  </Button>
                </Stack>
              )}
            </Card>

            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>WhatsApp Business connection</Typography>
              <Stack spacing={1.5}>
                <ConnectionRow
                  title="Business number"
                  value={user?.virtualNumber || '—'}
                  status="connected"
                />
                <ConnectionRow
                  title="API access"
                  value={user?.waBusinessStatus === 'connected' ? 'Active' : 'Pending'}
                  status={user?.waBusinessStatus === 'connected' ? 'connected' : 'pending'}
                />
              </Stack>
              <Divider sx={{ my: 2.5 }} />
              <Stack spacing={1.5}>
                <InfoRow icon={<BadgeRoundedIcon fontSize="small" />} label="Role" value={user?.role || 'User'} />
                <InfoRow icon={<FingerprintRoundedIcon fontSize="small" />} label="User ID" value={user?.id || '—'} mono />
                <InfoRow icon={<FingerprintRoundedIcon fontSize="small" />} label="Tenant ID" value={user?.tenantId || '—'} mono />
              </Stack>
            </Card>

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <strong>Security:</strong> For password changes or billing enquiries, reach out to your account
              manager. All campaign activity is logged under your tenant.
            </Alert>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

function InfoRow({ icon, label, value, mono }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(15,123,108,0.08)', color: 'primary.main' }}>
        {icon}
      </Avatar>
      <Typography variant="body2" color="text.secondary" sx={{ width: 130 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
        {value}
      </Typography>
    </Stack>
  );
}

function ConnectionRow({ title, value, status }) {
  const connected = status === 'connected';
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: connected ? '#17C994' : '#F59E0B' }} />
        <Box>
          <Typography variant="body2" fontWeight={600}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{value}</Typography>
        </Box>
      </Stack>
      <Chip
        size="small"
        icon={connected ? <CheckCircleRoundedIcon /> : <LockRoundedIcon />}
        label={connected ? 'Connected' : 'Pending'}
        color={connected ? 'success' : 'warning'}
        variant="outlined"
      />
    </Stack>
  );
}