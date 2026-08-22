import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Stack, Alert, Chip, Divider, Tabs, Tab, IconButton,
  InputAdornment, FormControlLabel, Checkbox, Link,
} from '@mui/material';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEMO_VIRTUAL_NUMBER = '+91 92345 00110';
const DEMO_OTP = '123456';

export default function Login() {
  const location = useLocation();
  const [mode, setMode] = useState(() => location.pathname === '/signup' ? 'signup' : 'login');
  const [authType, setAuthType] = useState('email');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (location.pathname === '/signup') setMode('signup');
    else if (location.pathname === '/login') setMode('login');
  }, [location]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [virtualNumber, setVirtualNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(1);

  const { login, signup, requestOtp, verifyOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 8;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (!validateEmail(email)) throw new Error('Please enter a valid email address');
      if (!validatePassword(password)) throw new Error('Password must be at least 8 characters');
      await login(email, password);
      showToast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (!name.trim()) throw new Error('Please enter your name');
      if (!validateEmail(email)) throw new Error('Please enter a valid email address');
      if (!validatePassword(password)) throw new Error('Password must be at least 8 characters');
      if (password !== confirmPassword) throw new Error('Passwords do not match');
      if (!agreeTerms) throw new Error('Please agree to the Terms of Service');
      await signup(name, email, password, confirmPassword);
      showToast('Account created successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await requestOtp(virtualNumber);
      setOtpStep(2);
      showToast('OTP sent to the virtual number', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyOtp(virtualNumber, otp);
      showToast('Connected to WhatsApp Business API', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const renderEmailLogin = () => (
    <Box component="form" onSubmit={handleLogin}>
      <TextField
        fullWidth
        label="Email address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          },
        }}
        sx={{ mb: 2 }}
        autoComplete="email"
        required
      />
      <TextField
        fullWidth
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: (
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                aria-label="toggle password visibility"
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            ),
          },
        }}
        sx={{ mb: 1.5 }}
        autoComplete="current-password"
        required
      />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />}
          label="Remember me"
          labelPlacement="end"
        />
        <Link href="#" variant="body2" sx={{ textDecoration: 'none' }}>Forgot password?</Link>
      </Stack>
      <Button fullWidth size="large" type="submit" variant="contained" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>
    </Box>
  );

  const renderSignup = () => (
    <Box component="form" onSubmit={handleSignup}>
      <TextField
        fullWidth
        label="Full name"
        placeholder="John Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          },
        }}
        sx={{ mb: 2 }}
        autoComplete="name"
        required
      />
      <TextField
        fullWidth
        label="Email address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          },
        }}
        sx={{ mb: 2 }}
        autoComplete="email"
        required
      />
      <TextField
        fullWidth
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: (
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                aria-label="toggle password visibility"
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            ),
          },
        }}
        sx={{ mb: 2 }}
        autoComplete="new-password"
        required
        helperText={password && !validatePassword(password) ? 'Password must be at least 8 characters' : ''}
        error={password && !validatePassword(password)}
      />
      <TextField
        fullWidth
        label="Confirm password"
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="Confirm your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: (
              <IconButton
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                edge="end"
                aria-label="toggle password visibility"
              >
                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            ),
          },
        }}
        sx={{ mb: 2 }}
        autoComplete="new-password"
        required
        helperText={confirmPassword && confirmPassword !== password ? 'Passwords do not match' : ''}
        error={confirmPassword && confirmPassword !== password}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
          />
        }
        label={
          <Stack direction="row" spacing={0.5}>
            <Typography variant="body2">I agree to the </Typography>
            <Link href="#" variant="body2" sx={{ textDecoration: 'none', color: 'primary.main' }}>
              Terms of Service
            </Link>
            <Typography variant="body2"> and </Typography>
            <Link href="#" variant="body2" sx={{ textDecoration: 'none', color: 'primary.main' }}>
              Privacy Policy
            </Link>
          </Stack>
        }
        labelPlacement="end"
        sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
      />
      <Button fullWidth size="large" type="submit" variant="contained" disabled={busy}>
        {busy ? 'Creating account…' : 'Create account'}
      </Button>
    </Box>
  );

  const renderVirtualNumberAuth = () => (
    <Box>
      {otpStep === 1 ? (
        <Box component="form" onSubmit={handleRequestOtp}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your WhatsApp Business messages route through this number.
          </Typography>
          <TextField
            fullWidth
            label="Virtual business number"
            placeholder="+91 9XXXX XXXXX"
            value={virtualNumber}
            onChange={(e) => setVirtualNumber(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <PhoneAndroidRoundedIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              },
            }}
            sx={{ mb: 2 }}
          />
          <Button fullWidth size="large" type="submit" variant="contained" disabled={busy || !virtualNumber}>
            {busy ? 'Sending OTP…' : 'Send OTP'}
          </Button>

          <Divider sx={{ my: 3 }}>demo access</Divider>
          <Stack spacing={1}>
            <Chip
              label={`Use demo number: ${DEMO_VIRTUAL_NUMBER}`}
              onClick={() => setVirtualNumber(DEMO_VIRTUAL_NUMBER)}
              variant="outlined"
              sx={{ justifyContent: 'flex-start' }}
            />
          </Stack>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleVerifyOtp}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We sent a 6-digit code to {virtualNumber}
          </Typography>
          <TextField
            fullWidth
            label="6-digit OTP"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <ShieldRoundedIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              },
            }}
            sx={{ mb: 2 }}
          />
          <Button fullWidth size="large" type="submit" variant="contained" disabled={busy || otp.length < 4}>
            {busy ? 'Verifying…' : 'Verify & Connect'}
          </Button>
          <Button fullWidth sx={{ mt: 1 }} onClick={() => setOtpStep(1)}>
            Change number
          </Button>
          <Divider sx={{ my: 3 }}>demo access</Divider>
          <Chip
            label={`Use demo OTP: ${DEMO_OTP}`}
            onClick={() => setOtp(DEMO_OTP)}
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #0B1220 0%, #0F7B6C 130%)',
      }}
    >
      {/* Left brand panel */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          px: 8,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', width: 64, height: 64, mb: 4 }}>
          <Box className="wa-signal-dot" sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#17C994', position: 'absolute', top: 25, left: 25 }} />
          {[1, 2, 3].map((ring) => (
            <Box
              key={ring}
              sx={{
                position: 'absolute',
                inset: 0,
                border: '1.5px solid rgba(23,201,148,0.35)',
                borderRadius: '50%',
                transform: `scale(${0.35 + ring * 0.3})`,
              }}
            />
          ))}
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.15 }}>
          Reach every contact,<br />one broadcast at a time.
        </Typography>
        <Typography sx={{ opacity: 0.75, maxWidth: 420, mb: 5 }}>
          Send bulk WhatsApp campaigns through your virtual business number —
          scheduled, tracked, and reported in real time.
        </Typography>
        <Stack direction="row" spacing={4}>
          <Box>
            <Typography variant="h5" fontWeight={800}>10K+</Typography>
            <Typography variant="body2" sx={{ opacity: 0.65 }}>Messages / day</Typography>
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>96.4%</Typography>
            <Typography variant="body2" sx={{ opacity: 0.65 }}>Delivery rate</Typography>
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>10AM–6PM</Typography>
            <Typography variant="body2" sx={{ opacity: 0.65 }}>Processing window</Typography>
          </Box>
        </Stack>
      </Box>

      {/* Right auth panel */}
      <Box
        sx={{
          width: { xs: '100%', md: 480 },
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 4, sm: 8 },
          py: 6,
        }}
      >
        <Stack spacing={1} sx={{ mb: 1 }}>
          <Typography variant="h5" fontWeight={800}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mode === 'login'
              ? 'Sign in to access your WhatsApp campaign dashboard'
              : 'Join thousands of businesses using WhatsApp broadcasts'}
          </Typography>
        </Stack>

        {authType !== 'virtual' && (
          <Tabs
            value={mode}
            onChange={(e, v) => { setMode(v); setError(''); }}
            variant="fullWidth"
            sx={{ mb: 3, '& .MuiTabs-indicator': { bgcolor: 'primary.main' } }}
          >
            <Tab label="Sign in" value="login" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab label="Sign up" value="signup" sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>
        )}

        {authType === 'virtual' && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={() => { setAuthType('email'); setMode('login'); setError(''); }}
            sx={{ mb: 3 }}
          >
            Switch to email & password
          </Button>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {authType === 'email' ? (
          <>
            {mode === 'login' ? renderEmailLogin() : renderSignup()}
            <Divider sx={{ my: 3 }}>or continue with</Divider>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PhoneAndroidRoundedIcon />}
              onClick={() => { setAuthType('virtual'); setOtpStep(1); setError(''); }}
            >
              Use virtual number & OTP
            </Button>
          </>
        ) : (
          renderVirtualNumberAuth()
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 4, display: 'block', textAlign: 'center' }}>
          This is a demo environment. Messages route through a virtual number connected
          to the WhatsApp Business API before reaching real recipient numbers.
        </Typography>
      </Box>
    </Box>
  );
}