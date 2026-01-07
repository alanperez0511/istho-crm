/**
 * ISTHO CRM - Tema Material-UI
 * Colores corporativos ISTHO (naranja/gris del logo)
 */

import { createTheme } from '@mui/material/styles';

// Colores corporativos ISTHO
const isthoColors = {
  primary: {
    main: '#E65100',      // Naranja ISTHO
    light: '#FF833A',
    dark: '#AC1900',
    contrastText: '#FFFFFF'
  },
  secondary: {
    main: '#455A64',      // Gris azulado
    light: '#718792',
    dark: '#1C313A',
    contrastText: '#FFFFFF'
  }
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: isthoColors.primary,
    secondary: isthoColors.secondary,
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF'
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50'
    },
    warning: {
      main: '#ED6C02',
      light: '#FF9800'
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350'
    },
    info: {
      main: '#0288D1',
      light: '#03A9F4'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#F5F5F5'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6
        }
      }
    }
  }
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: isthoColors.primary,
    secondary: {
      main: '#90A4AE',
      light: '#B0BEC5',
      dark: '#607D8B'
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundImage: 'none'
        }
      }
    }
  }
});
