import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#c97998',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#26151d',
    },
    background: {
      default: '#fffbfc',
      paper: '#ffffff',
    },
    text: {
      primary: '#24151c',
      secondary: '#705b65',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: "'Roboto', 'Segoe UI', sans-serif",
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #edd6df',
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderLeft: '1px solid #edd6df',
        },
      },
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
