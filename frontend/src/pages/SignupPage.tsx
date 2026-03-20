import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { validateEmail } from '../api/apiClient'
import { UserPlus } from 'lucide-react'

const MIN_PASSWORD_LEN = 8
const MAX_PASSWORD_LEN = 72

type FieldErrors = Partial<{
  name: string
  email: string
  password: string
  confirmPassword: string
  agreed: string
  companyType: string
}>

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const signup = useAuthStore(state => state.signup)
  const authError = useAuthStore(state => state.error)
  const navigate = useNavigate()
  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)
  const rawPlan = (searchParams.get('plan') || 'free').toLowerCase()
  const selectedPlan: 'free' | 'pro' | 'enterprise' =
    rawPlan === 'pro' || rawPlan === 'enterprise' ? (rawPlan as 'pro' | 'enterprise') : 'free'

  useEffect(() => {
    useAuthStore.setState({ error: null })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors: FieldErrors = {}
    if (!name.trim()) {
      nextErrors.name = 'Введите имя'
    } else if (name.length > 30) {
      nextErrors.name = 'Максимум 30 символов'
    }
    if (!email.trim()) {
      nextErrors.email = 'Введите email'
    } else if (!validateEmail(email)) {
      nextErrors.email = 'Некорректный формат email'
    } else if (email.length > 100) {
      nextErrors.email = 'Максимум 100 символов'
    }
    if (!password) {
      nextErrors.password = 'Введите пароль'
    } else if (password.length < MIN_PASSWORD_LEN) {
      nextErrors.password = `Пароль должен быть не менее ${MIN_PASSWORD_LEN} символов`
    } else if (password.length > MAX_PASSWORD_LEN) {
      nextErrors.password = `Максимум ${MAX_PASSWORD_LEN} символов`
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Подтвердите пароль'
    } else if (confirmPassword.length > MAX_PASSWORD_LEN) {
      nextErrors.confirmPassword = `Максимум ${MAX_PASSWORD_LEN} символов`
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Пароли не совпадают'
    }
    if (!agreed) {
      nextErrors.agreed = 'Нужно согласиться с условиями'
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return
    }

    setLoading(true)
    setFieldErrors({})
    
    try {
      await signup(name, email, password, selectedPlan, agreed, agreed)
      navigate('/dashboard')
    } catch (error: any) {
      const apiFieldErrors = error?.fieldErrors as Record<string, string> | undefined
      if (apiFieldErrors) {
        const mapped: FieldErrors = {}
        if (apiFieldErrors.username) mapped.name = apiFieldErrors.username
        if (apiFieldErrors.email) mapped.email = apiFieldErrors.email
        if (apiFieldErrors.password) mapped.password = apiFieldErrors.password
        if (apiFieldErrors.confirm_password) mapped.confirmPassword = apiFieldErrors.confirm_password
        if (apiFieldErrors.company_type) mapped.companyType = apiFieldErrors.company_type
        if (apiFieldErrors.accept_terms || apiFieldErrors.accept_privacy) {
          mapped.agreed = apiFieldErrors.accept_terms || apiFieldErrors.accept_privacy
        }
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
          Создать аккаунт
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Войдите
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Имя
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Иван Петров"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="••••••••"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Подтвердите пароль
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="••••••••"
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                Я согласен с{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700">
                  условиями использования
                </a>{' '}
                и{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700">
                  политикой конфиденциальности
                </a>
              </label>
            </div>
            {fieldErrors.agreed && (
              <p className="text-sm text-red-600">{fieldErrors.agreed}</p>
            )}
            {fieldErrors.companyType && (
              <p className="text-sm text-red-600">{fieldErrors.companyType}</p>
            )}

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
              <UserPlus size={20} />
              <span>{loading ? 'Регистрация...' : 'Зарегистрироваться'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
