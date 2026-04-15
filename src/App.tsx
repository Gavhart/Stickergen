import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { Navbar } from './components/ui/Navbar'
import { ToastContainer } from './components/ui/Toast'
import { LandingPage } from './pages/LandingPage'
import { FeedPage } from './pages/FeedPage'
import { CreateRecipePage } from './pages/CreateRecipePage'
import { RecipePage } from './pages/RecipePage'
import { MyRecipesPage } from './pages/MyRecipesPage'
import { PricingPage } from './pages/PricingPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-ink)' }}>
            <Navbar />
            <Routes>
              <Route path="/"           element={<LandingPage />} />
              <Route path="/feed"       element={<FeedPage />} />
              <Route path="/create"     element={<CreateRecipePage />} />
              <Route path="/recipe/:id" element={<RecipePage />} />
              <Route path="/my-recipes" element={<MyRecipesPage />} />
              <Route path="/pricing"    element={<PricingPage />} />
              <Route path="/profile"    element={<ProfilePage />} />
            </Routes>
            <ToastContainer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
