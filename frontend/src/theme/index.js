import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366F1',
      light: '#E0E7FF',
      dark: '#4F46E5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6B7280',
      light: '#F3F4F6',
      dark: '#4B5563',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
      dark: '#B91C1C',
    },
    warning: {
      main: '#F59E0B',
      light: '#FEF3C7',
      dark: '#B45309',
    },
    success: {
      main: '#10B981',
      light: '#D1FAE5',
      dark: '#047857',
    },
    background: {
      default: '#FFFDF5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: 'clamp(2rem, 3.5vw, 3.2rem)',
      lineHeight: 1.1,
      fontWeight: 700,
      color: '#1F2937',
    },
    h2: {
      fontSize: 'clamp(1.4rem, 2vw, 1.8rem)',
      lineHeight: 1.2,
      fontWeight: 600,
      color: '#1F2937',
    },
    h3: {
      fontSize: '1.15rem',
      lineHeight: 1.3,
      fontWeight: 600,
      color: '#1F2937',
    },
    h4: {
      fontSize: '1rem',
      lineHeight: 1.35,
      fontWeight: 600,
      color: '#1F2937',
    },
    h5: {
      fontSize: '0.9rem',
      lineHeight: 1.4,
      fontWeight: 600,
      color: '#1F2937',
    },
    subtitle1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#6B7280',
    },
    body1: {
      lineHeight: 1.6,
      color: '#1F2937',
    },
    body2: {
      lineHeight: 1.5,
      color: '#6B7280',
    },
    button: {
      fontSize: '0.95rem',
      fontWeight: 600,
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
    overline: {
      fontSize: '0.7rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#9CA3AF',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#FFFDF5',
        },
        '#root': {
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 8,
          border: '2px solid #1F2937',
          textTransform: 'none',
          paddingInline: 20,
          transition: 'all 150ms ease',
        },
        contained: {
          backgroundColor: '#6366F1',
          color: '#FFFFFF',
          borderColor: '#1F2937',
          '&:hover': {
            backgroundColor: '#4F46E5',
            borderColor: '#1F2937',
          },
        },
        containedSecondary: {
          backgroundColor: '#6B7280',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#4B5563',
          },
        },
        outlined: {
          backgroundColor: '#FFFFFF',
          color: '#1F2937',
          borderColor: '#1F2937',
          '&:hover': {
            backgroundColor: '#F5F0E8',
            borderColor: '#1F2937',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          height: 32,
          border: '2px solid #1F2937',
          fontWeight: 600,
        },
        filled: {
          backgroundColor: '#6366F1',
          color: '#FFFFFF',
          borderColor: '#1F2937',
        },
        outlined: {
          backgroundColor: '#FFFFFF',
          color: '#1F2937',
          borderColor: '#1F2937',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          border: '2px solid #1F2937',
          boxShadow: 'none',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: '2px solid #1F2937',
          fontWeight: 500,
        },
        standardError: {
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          borderColor: '#EF4444',
        },
        standardWarning: {
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          borderColor: '#F59E0B',
        },
        standardSuccess: {
          backgroundColor: '#D1FAE5',
          color: '#065F46',
          borderColor: '#10B981',
        },
        standardInfo: {
          backgroundColor: '#E0E7FF',
          color: '#3730A3',
          borderColor: '#6366F1',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          transition: 'box-shadow 150ms ease, border-color 150ms ease',
          '& .MuiOutlinedInput-notchedOutline': {
            border: '2px solid #1F2937',
            transition: 'border-color 150ms ease',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6366F1',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6366F1',
            boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.12)',
          },
        },
        input: {
          paddingBlock: 14,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#6B7280',
          '&.Mui-focused': {
            color: '#6366F1',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          '&:hover': {
            backgroundColor: '#F5F0E8',
          },
          '&.Mui-selected': {
            backgroundColor: '#E0E7FF',
            '&:hover': {
              backgroundColor: '#C7D2FE',
            },
          },
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          gap: 4,
        },
      },
    },
    MuiStepContent: {
      styleOverrides: {
        root: {
          borderLeftColor: '#E5E7EB',
          marginLeft: 15,
          paddingLeft: 16,
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        root: {
          padding: '8px 0',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E5E7EB',
        },
      },
    },
  },
});

export default theme;
