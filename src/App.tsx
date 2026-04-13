import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { Navbar } from './components/ui/Navbar'
import { ToastContainer } from './components/ui/Toast'
import { LandingPage } from './pages/LandingPage'
import { CreatorPage } from './pages/CreatorPage'
import { GalleryPage } from './pages/GalleryPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-ink)' }}>
            <Navbar />
            <Routes>
              <Route path="/"        element={<LandingPage />} />
              <Route path="/create"  element={<CreatorPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
            <ToastContainer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
