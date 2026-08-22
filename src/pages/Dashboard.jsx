import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, Typography, Stack, Button, Avatar, Skeleton,
  Chip, Divider, Alert, LinearProgress, Paper, IconButton, Tooltip,
} from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer as PieResponsiveContainer,
} from 'recharts';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import PlayCircleRoundedIcon from '@mui/icons-material/PlayCircleRounded';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import StatCard from '../components/StatCard';
import StatusChip from '../components/StatusChip';
import api from '../api/api';
import dayjs from 'dayjs';

const PROCESSING_WINDOW_START = 10;
const PROCESSING_WINDOW_END = 18;
const TIMEZONE = 'Asia/Kolkata';

const getProcessingWindowStatus = () => {
  const now = new Date();
  const localTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const hour = localTime.getHours();
  const day = localTime.getDay();
  const isWeekday = day >= 1 && day <= 5;
  const isInWindow = isWeekday && hour >= PROCESSING_WINDOW_START && hour < PROCESSING_WINDOW_END;

  let nextWindow = new Date(localTime);
  if (!isWeekday) {
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    nextWindow.setDate(nextWindow.getDate() + daysUntilMonday);
    nextWindow.setHours(PROCESSING_WINDOW_START, 0, 0, 0);
  } else if (hour < PROCESSING_WINDOW_START) {
    nextWindow.setHours(PROCESSING_WINDOW_START, 0, 0, 0);
  } else if (hour >= PROCESSING_WINDOW_END) {
    nextWindow.setDate(nextWindow.getDate() + 1);
    if (nextWindow.getDay() === 6) nextWindow.setDate(nextWindow.getDate() + 2);
    nextWindow.setHours(PROCESSING_WINDOW_START, 0, 0, 0);
  }
  const minutesUntil = Math.max(0, Math.round((nextWindow.getTime() - localTime.getTime()) / 60000));

  return { isInWindow, isWeekday, nextWindow, minutesUntil, currentHour: hour };
};

const COLORS = ['#0F7B6C', '#E5484D', '#F59E0B', '#2F80ED', '#8B5CF6', '#EC4899'];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activity, setActivity] = useState([]);
  const [scheduledCampaigns, setScheduledCampaigns] = useState([]);
  const [failureBreakdown, setFailureBreakdown] = useState({});
  const [creditForecast, setCreditForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [windowStatus, setWindowStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, chartRes, activityRes, scheduledRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getPerformanceChart('7d'),
          api.getRecentActivity(10),
          api.getScheduledCampaigns(),
        ]);
        setSummary(summaryRes);
        setChartData(chartRes);
        setActivity(activityRes);
        setScheduledCampaigns(scheduledRes);

        const forecast = calculateCreditForecast(summaryRes);
        setCreditForecast(forecast);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(() => {
      setWindowStatus(getProcessingWindowStatus());
    }, 60000);
    setWindowStatus(getProcessingWindowStatus());
    return () => clearInterval(interval);
  }, []);

  const calculateCreditForecast = (summary) => {
    if (!summary || summary.messagesSentToday === 0) return null;
    const creditsPerDay = summary.consumedCredits / 7;
    const daysRemaining = creditsPerDay > 0 ? Math.floor(summary.availableCredits / creditsPerDay) : 0;
    return { creditsPerDay: Math.round(creditsPerDay), daysRemaining };
  };

  const handleRepeatLastCampaign = () => {
    if (activity.length > 0) {
      const lastCampaign = activity[0];
      navigate('/send-via-wa', { state: { prefill: lastCampaign } });
    }
  };

  const handleResendFailed = () => {
    navigate('/send-via-wa', { state: { resendFailed: true } });
  };

  if (loading) {
    return (
      <Box>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Stack spacing={0.5}>
              <Skeleton variant="text" width={240} height={36} />
              <Skeleton variant="text" width={300} height={18} />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rounded" width={120} height={40} sx={{ borderRadius: 2.5 }} />
              <Skeleton variant="rounded" width={140} height={40} sx={{ borderRadius: 2.5 }} />
            </Stack>
          </Stack>

          <Skeleton variant="rounded" height={72} sx={{ borderRadius: 3 }} />

          <Grid container spacing={2.5}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.5}>
            <Grid item xs={12} lg={8}>
              <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3 }} />
            </Grid>
            <Grid item xs={12} lg={4}>
              <Stack spacing={2.5} sx={{ height: '100%' }}>
                <Skeleton variant="rounded" height={165} sx={{ borderRadius: 3 }} />
                <Skeleton variant="rounded" height={175} sx={{ borderRadius: 3 }} />
              </Stack>
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid item xs={12} lg={5}>
              <Skeleton variant="rounded" height={240} sx={{ borderRadius: 3 }} />
            </Grid>
            <Grid item xs={12} lg={7}>
              <Skeleton variant="rounded" height={240} sx={{ borderRadius: 3 }} />
            </Grid>
          </Grid>
        </Stack>
      </Box>
    );
  }

  const safeSummary = summary || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    scheduledCampaigns: 0,
    availableCredits: 0,
    totalContacts: 0,
    successRate: 0,
    sentToday: 0,
    messagesSentToday: 0,
    consumedCredits: 0,
  };

  const failureData = Object.entries(failureBreakdown).map(([name, value], i) => ({
    name, value, color: COLORS[i % COLORS.length],
  }));
  const failureTotal = failureData.reduce((sum, f) => sum + f.value, 0);

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>{greeting()} 👋</Typography>
          <Typography variant="body2" color="text.secondary">Here's what's happening with your campaigns.</Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" startIcon={<ReplayRoundedIcon />} onClick={handleRepeatLastCampaign} disabled={activity.length === 0}>
            Repeat last
          </Button>
          <Button variant="contained" startIcon={<CampaignRoundedIcon />} onClick={() => navigate('/send-via-wa')}>
            New broadcast
          </Button>
        </Stack>
      </Stack>

      {/* Processing window banner */}
      <Paper
        sx={{
          mb: 2.5, p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5,
          bgcolor: windowStatus?.isInWindow ? 'rgba(23,201,148,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${windowStatus?.isInWindow ? '#17C994' : '#F59E0B'}`,
        }}
      >
        <Box sx={{
          width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          bgcolor: windowStatus?.isInWindow ? 'rgba(23,201,148,0.18)' : 'rgba(245,158,11,0.18)',
        }}>
          {windowStatus?.isInWindow
            ? <FlashOnRoundedIcon sx={{ color: '#17C994', fontSize: 22 }} />
            : <AccessTimeRoundedIcon sx={{ color: '#F59E0B', fontSize: 22 }} />}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} color={windowStatus?.isInWindow ? 'success.main' : 'warning.main'}>
            {windowStatus?.isInWindow ? 'Processing window is active' : 'Outside the processing window'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {windowStatus?.isInWindow
              ? `Sending is live until ${PROCESSING_WINDOW_END}:00 today (Mon–Fri, 10 AM – 6 PM IST).`
              : `Campaigns run Mon–Fri, 10 AM – 6 PM IST. Next window: ${dayjs(windowStatus?.nextWindow).format('dddd, D MMM')} at ${PROCESSING_WINDOW_START}:00`
                  + (windowStatus?.minutesUntil > 0 ? ` · in ${Math.floor(windowStatus.minutesUntil / 60)}h ${windowStatus.minutesUntil % 60}m` : '')}
          </Typography>
        </Box>
      </Paper>

      {/* Credit forecast */}
      {creditForecast && creditForecast.daysRemaining <= 7 && (
        <Alert severity={creditForecast.daysRemaining <= 3 ? 'error' : 'warning'} sx={{ mb: 2.5, borderRadius: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TrendingUpRoundedIcon color={creditForecast.daysRemaining <= 3 ? 'error' : 'warning'} />
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Credit Forecast: ~{creditForecast.daysRemaining} day{creditForecast.daysRemaining !== 1 ? 's' : ''} remaining
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Current burn rate: ~{creditForecast.creditsPerDay.toLocaleString('en-IN')} credits/day
              </Typography>
            </Box>
          </Stack>
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total Campaigns" value={safeSummary.totalCampaigns} icon={CampaignRoundedIcon} tint="#0F7B6C" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Active Now" value={safeSummary.activeCampaigns} icon={PlayCircleRoundedIcon} tint="#2F80ED" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Scheduled" value={safeSummary.scheduledCampaigns} icon={EventRepeatRoundedIcon} tint="#F59E0B" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Available Credits" value={safeSummary.availableCredits.toLocaleString('en-IN')} icon={AccountBalanceWalletRoundedIcon} tint="#17C994" />
        </Grid>
      </Grid>

      {/* Chart + quick stats */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>Message performance</Typography>
                <Typography variant="caption" color="text.secondary">Sent vs failed · last 7 days</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip size="small" icon={<CheckCircleRoundedIcon />} label="Sent" sx={{ color: '#0F7B6C', bgcolor: 'rgba(15,123,108,0.08)' }} />
                <Chip size="small" label="Failed" sx={{ color: '#E5484D', bgcolor: 'rgba(229,72,77,0.08)' }} />
              </Stack>
            </Stack>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F7B6C" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0F7B6C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E5484D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E5484D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#5B6672' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#5B6672' }} />
                <RechartsTooltip contentStyle={{ borderRadius: 10, border: '1px solid #E7EBEE' }} />
                <Area type="monotone" dataKey="sent" stroke="#0F7B6C" strokeWidth={2} fill="url(#sentGradient)" name="Sent" />
                <Area type="monotone" dataKey="failed" stroke="#E5484D" strokeWidth={2} fill="url(#failedGradient)" name="Failed" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={2.5} sx={{ height: '100%' }}>
            <Card sx={{ p: 3, borderRadius: 3, flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>Quick stats</Typography>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(15,123,108,0.1)', color: 'primary.main' }}>
                      <GroupRoundedIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">Total contacts</Typography>
                  </Stack>
                  <Typography fontWeight={700}>{safeSummary.totalContacts?.toLocaleString('en-IN') ?? '—'}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(23,201,148,0.1)', color: '#17C994' }}>
                      <CheckCircleRoundedIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">Success rate</Typography>
                  </Stack>
                  <Typography fontWeight={700}>{safeSummary.successRate ?? '—'}%</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                      <AccountBalanceWalletRoundedIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">Consumed credits</Typography>
                  </Stack>
                  <Typography fontWeight={700}>{safeSummary.consumedCredits?.toLocaleString('en-IN') ?? '—'}</Typography>
                </Stack>
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 3, flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>Failure breakdown</Typography>
              {failureData.length > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PieResponsiveContainer width="50%" height={180}>
                    <Pie
                      data={failureData}
                      cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={2}
                      dataKey="value" nameKey="name"
                    >
                      {failureData.map((f, i) => <Cell key={i} fill={f.color} />)}
                      <RechartsTooltip contentStyle={{ borderRadius: 10, border: '1px solid #E7EBEE' }} />
                    </Pie>
                  </PieResponsiveContainer>
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    {failureData.slice(0, 4).map((f) => (
                      <Stack key={f.name} direction="row" justifyContent="space-between">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: f.color }} />
                          <Typography variant="caption" color="text.secondary">{f.name}</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={700}>{f.value} · {Math.round((f.value / failureTotal) * 100)}%</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'text.secondary' }}>
                  <Typography variant="body2">No failures in recent campaigns</Typography>
                </Box>
              )}
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Scheduled + Recent activity */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 3, pb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ScheduleRoundedIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={800}>Next 24 hours</Typography>
              </Stack>
              <Button size="small" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate('/scheduled-history')}>
                View all
              </Button>
            </Stack>
            {scheduledCampaigns.length > 0 ? (
              <Stack divider={<Divider />} sx={{ pb: 1 }}>
                {scheduledCampaigns.map((campaign) => (
                  <Stack key={campaign.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 1.75 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                        <EventRepeatRoundedIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{campaign.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{campaign.totalContacts} contacts</Typography>
                      </Box>
                    </Stack>
                    <Chip size="small" label={dayjs(campaign.scheduledAt).format('hh:mm A')} variant="outlined" color="primary" />
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, color: 'text.secondary' }}>
                <Typography variant="body2">No campaigns scheduled in the next 24 hours</Typography>
              </Box>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 3, pb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <HistoryRoundedIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={800}>Recent activity</Typography>
              </Stack>
              <Button size="small" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate('/wa-history')}>
                View all
              </Button>
            </Stack>
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />} sx={{ pb: 1 }}>
              {activity.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ px: 3, py: 1.75 }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(15,123,108,0.08)', color: 'primary.main' }}>
                      <CampaignRoundedIcon fontSize="small" />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.totalContacts} contacts · {dayjs(item.createdAt).format('D MMM, h:mm A')}
                      </Typography>
                    </Box>
                  </Stack>
                  <StatusChip status={item.status} />
                </Stack>
              ))}
              {activity.length === 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, color: 'text.secondary' }}>
                  <Typography variant="body2">No activity yet — launch your first broadcast.</Typography>
                </Box>
              )}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Quick actions */}
      <Card sx={{ mt: 2.5, borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ p: 3, pb: 1.5 }}>Quick actions</Typography>
        <Divider sx={{ mb: 1 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 3, pb: 2 }}>
          <Button variant="outlined" startIcon={<ReplayRoundedIcon />} onClick={handleRepeatLastCampaign} disabled={activity.length === 0} size="large">
            Repeat Last Campaign
          </Button>
          <Button variant="outlined" startIcon={<SendRoundedIcon />} onClick={handleResendFailed} size="large">
            Resend to Failed Contacts
          </Button>
          <Button variant="contained" startIcon={<CampaignRoundedIcon />} onClick={() => navigate('/send-via-wa')} size="large">
            Create New Broadcast
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}