import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Force cache bust: 2025-08-13-v2

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
