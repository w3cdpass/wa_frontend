import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography,
  AppBar, Toolbar, IconButton, Avatar, Menu, MenuItem, Chip, Divider, Badge,
  useMediaQuery,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useAuth } from '../context/AuthContext';
import { getWallet } from '../api/mockApi';

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardRoundedIcon },
  { label: 'Connect WhatsApp', path: '/connect-whatsapp', icon: WhatsAppIcon },
  { label: 'Send via WA', path: '/send-via-wa', icon: SendRoundedIcon },
  { label: 'ChatBot', path: '/chatbot', icon: PersonRoundedIcon },
  { label: 'WA History', path: '/wa-history', icon: HistoryRoundedIcon },
  { label: 'Scheduled', path: '/scheduled', icon: EventRepeatRoundedIcon },
  { label: 'Manage Users', path: '/manage-users', icon: GroupRoundedIcon },
  { label: 'Credit Management', path: '/credits', icon: AccountBalanceWalletRoundedIcon },
  { label: 'Profile', path: '/profile', icon: PersonRoundedIcon },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/connect-whatsapp': 'Connect WhatsApp',
  '/send-via-wa': 'Send via WA',
  '/chatbot': 'ChatBot',
  '/wa-history': 'WA History',
  '/scheduled': 'Scheduled Campaigns',
  '/manage-users': 'Manage Users',
  '/credits': 'Credit Management',
  '/profile': 'Profile',
};

export default function DashboardLayout() {
  const isMobile = useMediaQuery('(max-width:900px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [wallet, setWallet] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    getWallet().then(setWallet);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0B1220', color: '#fff' }}>
      <Box sx={{ px: 3, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ position: 'relative', width: 34, height: 34 }}>
          <Box className="wa-signal-dot" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#17C994', position: 'absolute', top: 12, left: 12 }} />
          <Box sx={{ position: 'absolute', inset: 0, border: '1.5px solid rgba(23,201,148,0.4)', borderRadius: '50%' }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} lineHeight={1.1}>Infyle WA</Typography>
          <Typography variant="caption" sx={{ opacity: 0.55 }}>Campaign Console</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: active ? '#0B1220' : 'rgba(255,255,255,0.75)',
                bgcolor: active ? '#17C994' : 'transparent',
                '&:hover': { bgcolor: active ? '#17C994' : 'rgba(255,255,255,0.06)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: active ? '#0B1220' : 'rgba(255,255,255,0.6)' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500 }}>
                {item.label}
              </ListItemText>
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 2, m: 1.5, mb: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }}>
        <Typography variant="caption" sx={{ opacity: 0.55, display: 'block', mb: 0.5 }}>
          Wallet balance
        </Typography>
        <Typography variant="h6" fontWeight={800}>
          {wallet ? wallet.balance.toLocaleString('en-IN') : '—'} <span style={{ fontSize: 12, opacity: 0.6, fontWeight: 500 }}>credits</span>
        </Typography>
        {wallet?.status === 'suspended' && (
          <Chip label="Suspended" color="error" size="small" sx={{ mt: 1 }} />
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' },
          }}
        >
          {sidebarContent}
        </Drawer>
      </Box>

      {/* Main area */}
      <Box sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <AppBar
          position="sticky"
          elevation={0}
          color="transparent"
          sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <IconButton sx={{ display: { md: 'none' } }} onClick={() => setMobileOpen(true)}>
              <MenuRoundedIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1, color: 'text.primary' }}>
              {PAGE_TITLES[location.pathname] || 'Infyle WA'}
            </Typography>

            <Chip
              size="small"
              label="Business number connected"
              icon={<Box className="wa-signal-dot" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#17C994', ml: 1 }} />}
              sx={{ display: { xs: 'none', sm: 'flex' }, bgcolor: 'rgba(23,201,148,0.1)', color: '#0A5A4F', fontWeight: 600 }}
            />

            <IconButton>
              <Badge color="error" variant="dot">
                <NotificationsNoneRoundedIcon />
              </Badge>
            </IconButton>

            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14, fontWeight: 700 }}>
                {user?.name?.[0] || 'U'}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.role} · {user?.virtualNumber}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                <PersonRoundedIcon fontSize="small" sx={{ mr: 1.5 }} /> View profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutRoundedIcon fontSize="small" sx={{ mr: 1.5 }} /> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
