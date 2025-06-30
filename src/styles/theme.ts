import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2EF297', // Bright green accent
      light: '#50F5A9',
      dark: '#26D584',
    },
    secondary: {
      main: '#1E2A35', // Dark blue-grey
      light: '#2C3E4F',
      dark: '#151F27',
    },
    background: {
      default: '#1A1F24', // Dark background
      paper: '#1E2A35',   // Slightly lighter for cards
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B8C1',
    },
    success: {
      main: '#2EF297', // Same as primary for consistency
    },
    error: {
      main: '#FF4D4D', // Bright red
    },
    warning: {
      main: '#FFB74D', // Bright orange
    },
    info: {
      main: '#4DC3FF', // Bright blue
    },
  },
  components: {
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: '#2EF297',
            '& + .MuiSwitch-track': {
              backgroundColor: '#2EF297',
              opacity: 0.5,
            },
          },
        },
        track: {
          backgroundColor: '#4A5A6A',
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        thumb: {
          color: '#2EF297',
        },
        track: {
          color: '#2EF297',
        },
        rail: {
          color: '#4A5A6A',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#4A5A6A',
            },
            '&:hover fieldset': {
              borderColor: '#2EF297',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2EF297',
            },
          },
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
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        contained: {
          backgroundColor: '#2EF297',
          color: '#151F27',
          '&:hover': {
            backgroundColor: '#50F5A9',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    button: {
      textTransform: 'none',
    },
  },
}); 