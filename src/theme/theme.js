import { createTheme } from '@mui/material/styles';

// Design tokens
// Ink (sidebar/dark surfaces): #0B1220 / #121B2E
// Primary (signal green-teal): #0F7B6C, light accent: #17C994
// Amber (alerts/pending): #F59E0B
// Red (failed/danger): #E5484D
// Background: #F5F7F8, Surface: #FFFFFF

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F7B6C',
      light: '#17C994',
      dark: '#0A5A4F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0B1220',
      light: '#121B2E',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B',
    },
    error: {
      main: '#E5484D',
    },
    success: {
      main: '#17C994',
    },
    background: {
      default: '#F5F7F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0B1220',
      secondary: '#5B6672',
    },
    divider: '#E7EBEE',
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 },
    h3: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
    h5: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E7EBEE',
          boxShadow: '0 1px 2px rgba(11,18,32,0.04)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          color: '#5B6672',
          background: '#FAFBFC',
        },
      },
    },
  },
});

export default theme;
