import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { validateEmail } from '../api/apiClient'
import { LogIn } from 'lucide-react'

type FieldErrors = { email?: string; password?: string }

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const login = useAuthStore(state => state.login)
  const authError = useAuthStore(state => state.error)
  const navigate = useNavigate()

  useEffect(() => {
    useAuthStore.setState({ error: null })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: FieldErrors = {}
    if (!email.trim()) {
      errors.email = 'Введите email'
    } else if (!validateEmail(email)) {
      errors.email = 'Некорректный формат email'
    }
    if (!password) {
      errors.password = 'Введите пароль'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/dashboard')
    } catch (err: any) {
      const apiFieldErrors = err?.fieldErrors as Record<string, string> | undefined
      if (apiFieldErrors) {
        const mapped: FieldErrors = {}
        if (apiFieldErrors.email) mapped.email = apiFieldErrors.email
        if (apiFieldErrors.password) mapped.password = apiFieldErrors.password
        setFieldErrors(mapped)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center space-x-2 mb-6">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">LandingBuilder</span>
        </Link>
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Вход в аккаунт
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Или{' '}
          <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
            создайте новый аккаунт
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: undefined })) }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="ivan@example.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })) }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="••••••••"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Запомнить меня
                </label>
              </div>

              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                Забыли пароль?
              </a>
            </div>

            {authError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {authError}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <LogIn size={20} />
              <span>{loading ? 'Вход...' : 'Войти'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
