import { useEffect, useState } from 'react';
import {
  Box, Card, Typography, Stack, Button, Table, TableHead, TableRow, TableCell,
  TableBody, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Chip, LinearProgress, Grid, Alert,
} from '@mui/material';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import dayjs from 'dayjs';

const METHODS = ['UPI', 'Bank Transfer', 'Credit Card', 'Manual Adjustment'];

export default function CreditManagement() {
  const [wallet, setWallet] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [pricing, setPricing] = useState({});
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [walletRes, historyRes, pricingRes] = await Promise.all([
        api.getWallet(),
        api.getCreditHistory({ limit: 50 }),
        api.getPricing(),
      ]);
      setWallet(walletRes);
      setHistory(historyRes.transactions || historyRes);
      setPricing(pricingRes);
    } catch (err) {
      showToast(err.message || 'Failed to load credit data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAddCredit = async () => {
    if (!amount || Number(amount) <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    try {
      await api.addCredit({ amount: Number(amount), method });
      showToast(`${amount} credits added`, 'success');
      setAddOpen(false);
      setAmount('');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to add credits', 'error');
    }
  };

  const consumed = history.filter((h) => h.type === 'debit').reduce((s, h) => s + h.amount, 0);
  const added = history.filter((h) => h.type === 'credit').reduce((s, h) => s + h.amount, 0);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Credit Management</Typography>
          <Typography variant="body2" color="text.secondary">Track wallet balance and top up as needed.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddCircleRoundedIcon />} onClick={() => setAddOpen(true)}>
          Add credits
        </Button>
      </Stack>

      {wallet?.status === 'suspended' && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          This wallet is suspended due to a policy violation. Contact support to reactivate.
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                  Available balance
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                  {wallet ? wallet.balance.toLocaleString('en-IN') : '—'}
                </Typography>
              </Box>
              <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: 'rgba(15,123,108,0.1)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AccountBalanceWalletRoundedIcon fontSize="small" />
              </Box>
            </Stack>
            {wallet?.balance < wallet?.lowCreditThreshold && (
              <Chip label="Low balance" color="warning" size="small" sx={{ mt: 1.5 }} />
            )}
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                  Total added
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>{added.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: 'rgba(23,201,148,0.12)', color: '#17C994', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUpRoundedIcon fontSize="small" />
              </Box>
            </Stack>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                  Total consumed
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>{consumed.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: 'rgba(229,72,77,0.1)', color: 'error.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDownRoundedIcon fontSize="small" />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ p: 2.5, pb: 1.5 }}>Pricing (per message)</Typography>
        <Grid container spacing={2} sx={{ px: 2.5, pb: 2.5 }}>
          {Object.entries(pricing).map(([type, cost]) => (
            <Grid item xs={6} sm={3} key={type}>
              <Card sx={{ p: 2, borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" textTransform="capitalize">{type}</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5 }}>{cost} credits</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ p: 2.5, pb: 1.5 }}>Credit history</Typography>
        {loading && <LinearProgress />}
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Method</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Balance after</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id} hover>
                  <TableCell>{h.reference}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={h.type === 'credit' ? 'Credit' : 'Debit'}
                      color={h.type === 'credit' ? 'success' : 'default'}
                      variant={h.type === 'credit' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>{h.method}</TableCell>
                  <TableCell align="right" sx={{ color: h.type === 'credit' ? 'success.main' : 'error.main', fontWeight: 700 }}>
                    {h.type === 'credit' ? '+' : '-'}{h.amount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="right">{h.balanceAfter?.toLocaleString('en-IN') ?? h.balance_after?.toLocaleString('en-IN')}</TableCell>
                  <TableCell>{dayjs(h.date ?? h.createdAt).format('D MMM YYYY, h:mm A')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Card>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add credits</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
            />
            <TextField select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)} fullWidth>
              {METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button color="inherit" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddCredit}>Add credits</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}