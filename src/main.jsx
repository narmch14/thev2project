import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import RadiografiaV2 from './RadiografiaV2.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/TheV2Project-2.0/radiografia" element={<RadiografiaV2 />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
