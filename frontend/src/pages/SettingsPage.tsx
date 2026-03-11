import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { useAuthStore } from '../store/authStore'
import { User, Lock, CreditCard, Bell, Crown } from 'lucide-react'
import { apiRequest, getAuthToken } from '../api/apiClient'

type Tab = 'profile' | 'security' | 'subscription' | 'notifications'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const user = useAuthStore(state => state.user)
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    planName: string
    limits: Record<string, number> | null
    usage: Record<string, number>
    expiresAt: string | null
  } | null>(null)
  const [payments, setPayments] = useState<Array<{ date: string; amount: string; status: string }>>([])
  const [notifications, setNotifications] = useState<Array<{ label: string; checked: boolean }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const [notificationsSuccess, setNotificationsSuccess] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const tabs = [
    { id: 'profile', name: 'Профиль', icon: <User size={20} /> },
    { id: 'security', name: 'Безопасность', icon: <Lock size={20} /> },
    { id: 'subscription', name: 'Подписка', icon: <CreditCard size={20} /> },
    { id: 'notifications', name: 'Уведомления', icon: <Bell size={20} /> }
  ]

  useEffect(() => {
    let isMounted = true
    const loadSettings = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = getAuthToken()
        const subscription = await apiRequest<{
          plan_name: string
          limits: Record<string, number> | null
          usage: Record<string, number>
          expires_at: string | null
        }>('/clients/me/subscription', { token })
        const paymentList = await apiRequest<Array<{ date: string; amount: string; status: string }>>(
          '/clients/me/payments',
          { token }
        )
        const notificationList = await apiRequest<Array<{ label: string; checked: boolean }>>(
          '/clients/me/notifications',
          { token }
        )

        if (isMounted) {
          setSubscriptionInfo({
            planName: subscription.plan_name,
            limits: subscription.limits,
            usage: subscription.usage,
            expiresAt: subscription.expires_at
          })
          setPayments(paymentList)
          setNotifications(notificationList)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Не удалось загрузить настройки')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadSettings()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Настройки</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Tabs Sidebar */}
          <div className="md:w-64">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Профиль</h2>
                
                <div className="space-y-6">
                  {loading && <div className="text-gray-600">Загрузка профиля...</div>}
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}
                  <div className="flex items-center space-x-4 mb-6">
                    <img src={user?.avatar} alt={user?.name} className="w-20 h-20 rounded-full" />
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Изменить фото
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Компания</label>
                    <input
                      type="text"
                      placeholder="Название вашей компании"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition">
                    Сохранить изменения
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Безопасность</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Изменить пароль</h3>
                    <div className="space-y-4">
                      <input
                        type="password"
                        placeholder="Новый пароль"
                        value={newPassword}
                        onChange={(e) => {
                          setPasswordError(null)
                          setPasswordSuccess(null)
                          setNewPassword(e.target.value)
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {passwordError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      {passwordSuccess}
                    </div>
                  )}

                  <button
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={savingPassword || newPassword.trim().length === 0}
                    onClick={async () => {
                      const trimmed = newPassword.trim()
                      if (!trimmed) {
                        setPasswordError('Введите новый пароль')
                        return
                      }
                      if (trimmed.length > 30) {
                        setPasswordError('Максимум 30 символов')
                        return
                      }
                      setSavingPassword(true)
                      setPasswordError(null)
                      setPasswordSuccess(null)
                      try {
                        const token = getAuthToken()
                        await apiRequest('/clients/me/password', {
                          method: 'PATCH',
                          token,
                          body: { password: trimmed }
                        })
                        setPasswordSuccess('Пароль обновлен')
                        setNewPassword('')
                      } catch (err: any) {
                        setPasswordError(err.message || 'Не удалось обновить пароль')
                      } finally {
                        setSavingPassword(false)
                      }
                    }}
                  >
                    {savingPassword ? 'Сохранение...' : 'Обновить пароль'}
                  </button>
                </div>
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h2 className="text-2xl font-bold mb-6">Текущая подписка</h2>
                  
                  {loading && <div className="text-gray-600">Загрузка подписки...</div>}
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg mb-6">
                    <div className="flex items-center space-x-4">
                      <Crown className="w-10 h-10 text-primary-600" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 capitalize">
                          {subscriptionInfo?.planName || user?.subscription} Plan
                        </h3>
                        <p className="text-gray-600">
                          {subscriptionInfo?.expiresAt
                            ? `Активна до ${subscriptionInfo.expiresAt}`
                            : 'Бесплатный тариф'}
                        </p>
                      </div>
                    </div>
                    {user?.subscription === 'free' && (
                      <Link
                        to="/pricing"
                        className="inline-flex items-center bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
                      >
                        Обновить до Pro
                      </Link>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Проекты</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {subscriptionInfo?.limits?.projects
                          ? `${subscriptionInfo.usage.projects || 0} / ${subscriptionInfo.limits.projects}`
                          : `${subscriptionInfo?.usage.projects || 0} / ∞`}
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Экспорты в месяц</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {subscriptionInfo?.limits?.exports
                          ? `${subscriptionInfo.usage.exports || 0} / ${subscriptionInfo.limits.exports}`
                          : `${subscriptionInfo?.usage.exports || 0} / ∞`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing History */}
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-xl font-semibold mb-4">История платежей</h3>
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-gray-600">Загрузка платежей...</div>
                    ) : payments.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">История платежей пуста</p>
                    ) : (
                      payments.map((payment, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{payment.date}</div>
                            <div className="text-sm text-gray-500">{payment.amount}</div>
                          </div>
                          <span className="text-sm text-green-600 font-medium">{payment.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Уведомления</h2>
                
                <div className="space-y-6">
                  {loading ? (
                    <div className="text-gray-600">Загрузка уведомлений...</div>
                  ) : notifications.length === 0 ? (
                    <div className="text-gray-500 text-center py-6">Нет данных об уведомлениях</div>
                  ) : notifications.map((notif, idx) => (
                    <label key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <span className="text-gray-700">{notif.label}</span>
                      <input
                        type="checkbox"
                        checked={notif.checked}
                        onChange={(e) => {
                          setNotificationsSuccess(null)
                          setNotifications(prev => prev.map((item, index) => (
                            index === idx ? { ...item, checked: e.target.checked } : item
                          )))
                        }}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                  ))}
                </div>

                {notificationsError && (
                  <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {notificationsError}
                  </div>
                )}
                {notificationsSuccess && (
                  <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    {notificationsSuccess}
                  </div>
                )}

                <button
                  className="mt-6 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={savingNotifications || loading || notifications.length === 0}
                  onClick={async () => {
                    setSavingNotifications(true)
                    setNotificationsError(null)
                    setNotificationsSuccess(null)
                    try {
                      const token = getAuthToken()
                      await apiRequest('/clients/me/notifications', {
                        method: 'PATCH',
                        token,
                        body: { notifications }
                      })
                      setNotificationsSuccess('Настройки сохранены')
                    } catch (err: any) {
                      setNotificationsError(err.message || 'Не удалось сохранить настройки')
                    } finally {
                      setSavingNotifications(false)
                    }
                  }}
                >
                  Сохранить настройки
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
