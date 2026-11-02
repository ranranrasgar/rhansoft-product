import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@/lib/telemetry'
import App from './App.tsx'

// Suppress cross-origin "Script error" and benign getBoundingClientRect errors
// from third-party scripts (Google Identity Services, fonts, etc.)
window.addEventListener('error', (e) => {
  if (e.message === 'Script error.' || e.message?.includes('getBoundingClientRect')) {
    e.preventDefault()
    e.stopPropagation()
    return true
  }
}, true)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
