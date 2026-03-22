import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#65558F',
      light: '#E9DDFF',
      dark: '#4D3D75',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#625B71',
      light: '#E8DEF8',
      dark: '#4A4458',
      contrastText: '#FFFFFF',
    },
    tertiary: {
      main: '#7D5260',
      light: '#FFD8E4',
      dark: '#633B48',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#BA1A1A',
      light: '#FFDAD6',
      dark: '#93000A',
    },
    background: {
      default: '#FFFBFE',
      paper: '#FEF7FF',
    },
    text: {
      primary: '#1C1B1F',
      secondary: '#49454F',
    },
    divider: '#CAC4D0',
    outline: '#7A757F',
    surfaceTint: '#65558F',
    surfaceVariant: '#E7E0EB',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F7F2FA',
    surfaceContainer: '#F3EDF7',
    surfaceContainerHigh: '#ECE6F0',
    surfaceContainerHighest: '#E6E0E9',
  },
  typography: {
    fontFamily: '"JetBrains Maple Mono", monospace',
    h1: {
      fontSize: 'clamp(2.4rem, 4vw, 4rem)',
      lineHeight: 1.05,
      letterSpacing: '-0.04em',
      fontWeight: 700,
    },
    h2: {
      fontSize: 'clamp(1.6rem, 2.4vw, 2.2rem)',
      lineHeight: 1.15,
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.25rem',
      lineHeight: 1.2,
      fontWeight: 600,
    },
    h4: {
      fontSize: '1rem',
      lineHeight: 1.25,
      fontWeight: 600,
    },
    h5: {
      fontSize: '0.95rem',
      lineHeight: 1.35,
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: '1rem',
      lineHeight: 1.65,
      color: '#49454F',
    },
    body1: {
      lineHeight: 1.7,
    },
    body2: {
      lineHeight: 1.6,
    },
    button: {
      fontSize: '0.95rem',
      fontWeight: 700,
      letterSpacing: '0.01em',
    },
    overline: {
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: [
            'radial-gradient(circle at top left, rgba(233, 221, 255, 0.96), transparent 30%)',
            'radial-gradient(circle at top right, rgba(255, 216, 228, 0.78), transparent 26%)',
            'linear-gradient(180deg, #FFFBFE 0%, #F6F0FA 100%)',
          ].join(','),
          backgroundAttachment: 'fixed',
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
          minHeight: 48,
          textTransform: 'none',
          borderRadius: 999,
          paddingInline: 24,
        },
        contained: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(101, 85, 143, 0.22)',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 6px 16px rgba(101, 85, 143, 0.2)',
          },
        },
        outlined: {
          borderColor: '#7A757F',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          height: 34,
        },
        filled: {
          backgroundColor: '#E8DEF8',
          color: '#4A4458',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: 'rgba(254, 247, 255, 0.92)',
          border: '1px solid rgba(122, 117, 127, 0.14)',
          boxShadow: '0 1px 2px rgba(28, 27, 31, 0.08), 0 12px 32px rgba(103, 80, 164, 0.08)',
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
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: 'rgba(247, 242, 250, 0.92)',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(122, 117, 127, 0.36)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#65558F',
          },
          '&.Mui-focused': {
            backgroundColor: '#FFFFFF',
            boxShadow: '0 0 0 4px rgba(101, 85, 143, 0.12)',
          },
        },
        input: {
          paddingBlock: 16,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: '#65558F',
          },
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          gap: 8,
        },
      },
    },
    MuiStepContent: {
      styleOverrides: {
        root: {
          borderLeftColor: 'rgba(101, 85, 143, 0.28)',
        },
      },
    },
  },
});

export default theme;
