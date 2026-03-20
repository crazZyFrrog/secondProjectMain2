import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useForbiddenStore } from './store/forbiddenStore'

/** Ленивая подгрузка страниц — меньше одиночный JS-файл при первом запросе (полезно при net::ERR_CONNECTION_CLOSED на «длинных» ответах). */
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CreateProjectPage = lazy(() => import('./pages/CreateProjectPage'))
const EditorPage = lazy(() => import('./pages/EditorPage'))
const PreviewPage = lazy(() => import('./pages/PreviewPage'))
const ExportPage = lazy(() => import('./pages/ExportPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const AIGeneratePage = lazy(() => import('./pages/AIGeneratePage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
      Загрузка…
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function ForbiddenBanner() {
  const message = useForbiddenStore(state => state.message)
  const setForbidden = useForbiddenStore(state => state.setForbidden)
  const location = useLocation()

  useEffect(() => {
    setForbidden(null)
  }, [location.pathname, setForbidden])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setForbidden(null), 5000)
    return () => clearTimeout(t)
  }, [message, setForbidden])

  if (!message) return null
  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
      <span>{message}</span>
      <button type="button" onClick={() => setForbidden(null)} className="underline opacity-90 hover:opacity-100">
        Закрыть
      </button>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ForbiddenBanner />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><CreateProjectPage /></ProtectedRoute>} />
          <Route path="/projects/:id/edit" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
          <Route path="/projects/:id/preview" element={<ProtectedRoute><PreviewPage /></ProtectedRoute>} />
          <Route path="/projects/:id/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
          <Route path="/projects/:id/ai-generate" element={<ProtectedRoute><AIGeneratePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
