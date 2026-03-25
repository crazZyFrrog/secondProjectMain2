import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useState, useEffect, useRef } from 'react'
import { LogOut, LayoutDashboard, ChevronDown, Menu, X } from 'lucide-react'

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/')
    setProfileMenuOpen(false)
  }

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMobileNavOpen(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
        setMobileNavOpen(false)
      }
    }

    if (profileMenuOpen || mobileNavOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [profileMenuOpen, mobileNavOpen])

  return (
    <header ref={headerRef} className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={() => setMobileNavOpen(false)}>
            <span className="text-xl font-bold text-gray-900">LandingBuilder</span>
          </Link>

          {/* Navigation — desktop */}
          <nav className="hidden md:flex items-center space-x-8" aria-label="Основная навигация">
            <Link to="/templates" className="text-gray-600 hover:text-gray-900 transition">
              Шаблоны
            </Link>
            <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition">
              Тарифы
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition">
                  <LayoutDashboard size={18} />
                  <span>Проекты</span>
                </Link>
                
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition"
                  >
                    <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-medium">{user?.name}</span>
                    <ChevronDown size={16} />
                  </button>
                  
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Настройки
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <LogOut size={16} />
                        <span>Выйти</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-gray-900 transition">
                  Войти
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Начать бесплатно
                </Link>
              </div>
            )}
          </nav>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-expanded={mobileNavOpen}
            aria-controls="header-mobile-nav"
            aria-label={mobileNavOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileNavOpen && (
          <nav
            id="header-mobile-nav"
            className="md:hidden border-t border-gray-100 py-4 space-y-1"
            aria-label="Мобильная навигация"
          >
            <Link
              to="/templates"
              className="block px-2 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileNavOpen(false)}
            >
              Шаблоны
            </Link>
            <Link
              to="/pricing"
              className="block px-2 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileNavOpen(false)}
            >
              Тарифы
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-2 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  Проекты
                </Link>
                <Link
                  to="/settings"
                  className="block px-2 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Настройки
                </Link>
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <p className="px-2 py-1 text-xs text-gray-500">{user?.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false)
                      handleLogout()
                    }}
                    className="w-full text-left flex items-center gap-2 px-2 py-2.5 text-red-600 hover:bg-gray-50 rounded-lg"
                  >
                    <LogOut size={18} />
                    Выйти
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  className="block px-2 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg text-center border border-gray-200"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Войти
                </Link>
                <Link
                  to="/signup"
                  className="block px-2 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Начать бесплатно
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
