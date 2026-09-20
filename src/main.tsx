import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import axios from 'axios'

// Set default base URL for API requests (uses VITE_API_TARGET from .env in production)
axios.defaults.baseURL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_TARGET || ''
// Enable sending cookies with requests
axios.defaults.withCredentials = true
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
