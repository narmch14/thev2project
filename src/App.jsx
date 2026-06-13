import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingV2 from './LandingV2'
import LegacyV1 from './LegacyV1'
import RadiografiaV2 from './RadiografiaV2'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingV2 />} />
        <Route path="/v1" element={<LegacyV1 />} />
        <Route path="/radiografia" element={<RadiografiaV2 />} />
      </Routes>
    </BrowserRouter>
  )
}
