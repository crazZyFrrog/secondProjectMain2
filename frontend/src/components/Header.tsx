import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useState, useEffect, useRef } from 'react'
import { LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/')
    setProfileMenuOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [profileMenuOpen])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">LandingBuilder</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
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
        </div>
      </div>
    </header>
  )
}
