import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import theme from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import WhatsAppFlowBuilder  from './pages/whatsapp-flow-builder';
import Dashboard from './pages/Dashboard';
import SendViaWA from './pages/SendViaWA';
import WappHistory from './pages/WappHistory';
import ScheduledHistory from './pages/ScheduledHistory';
import ManageUsers from './pages/ManageUsers';
import CreditManagement from './pages/CreditManagement';
import Profile from './pages/Profile';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Login />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/send-via-wa" element={<SendViaWA />} />
                  <Route path="/chatbot" element={<WhatsAppFlowBuilder />} />
                  <Route path="/wa-history" element={<WappHistory />} />
                  <Route path="/scheduled" element={<ScheduledHistory />} />
                  <Route path="/manage-users" element={<ManageUsers />} />
                  <Route path="/credits" element={<CreditManagement />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
