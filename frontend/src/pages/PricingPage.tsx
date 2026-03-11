import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { Check, Crown, Zap, Rocket } from 'lucide-react'
import { apiRequest } from '../api/apiClient'

export default function PricingPage() {
  const [plans, setPlans] = useState<Array<{
    name: string
    icon: JSX.Element
    price: string
    period: string
    description: string
    features: string[]
    limitations: string[]
    cta: string
    highlighted: boolean
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadPlans = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiRequest<Array<{ id: string; name: string; features: string[] }>>('/plans')
        const mapped = data.map(plan => {
          const name = plan.name
          if (name.toLowerCase().includes('enterprise')) {
            return {
              name: 'Enterprise',
              icon: <Rocket className="w-8 h-8 text-purple-600" />,
              price: 'По запросу',
              period: '',
              description: 'Для крупных компаний',
              features: plan.features,
              limitations: [],
              cta: 'Связаться с нами',
              highlighted: false
            }
          }
          if (name.toLowerCase().includes('pro')) {
            return {
              name: 'Pro',
              icon: <Crown className="w-8 h-8 text-yellow-500" />,
              price: '1990',
              period: 'в месяц',
              description: 'Для профессионалов и агентств',
              features: plan.features,
              limitations: [],
              cta: 'Попробовать Pro',
              highlighted: true
            }
          }
          return {
            name: 'Free',
            icon: <Zap className="w-8 h-8 text-gray-600" />,
            price: '0',
            period: 'навсегда',
            description: 'Для знакомства с платформой',
            features: plan.features,
            limitations: [],
            cta: 'Начать бесплатно',
            highlighted: false
          }
        })
        if (isMounted) {
          setPlans(mapped)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Не удалось загрузить тарифы')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadPlans()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Выберите подходящий тариф
          </h1>
          <p className="text-xl text-gray-600">
            Начните бесплатно, обновитесь когда будете готовы
          </p>
        </div>

        {/* Pricing Cards */}
        {loading ? (
          <div className="text-center text-gray-600 mb-16">Загрузка тарифов...</div>
        ) : error ? (
          <div className="text-center text-red-600 mb-16">{error}</div>
        ) : plans.length === 0 ? (
          <div className="text-center text-gray-600 mb-16">
            Тарифы пока не добавлены. Запустите `python seed_db.py`, чтобы загрузить демо-данные.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-xl shadow-sm overflow-hidden ${
                  plan.highlighted ? 'ring-2 ring-primary-600 relative' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-primary-600 text-white text-center py-2 text-sm font-semibold">
                    Популярный выбор
                  </div>
                )}
                
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    {plan.icon}
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price === 'По запросу' ? '' : '₽'}{plan.price}
                      </span>
                      {plan.period && (
                        <span className="ml-2 text-gray-600">/ {plan.period}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                  </div>

                  <Link
                    to={plan.name === 'Enterprise' ? '#' : '/signup'}
                    className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition mb-6 ${
                      plan.highlighted
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, i) => (
                      <div key={i} className="flex items-start space-x-3 opacity-50">
                        <span className="text-gray-400">✕</span>
                        <span className="text-gray-600">{limitation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Частые вопросы</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Могу ли я сменить тариф позже?',
                a: 'Да, вы можете обновить или понизить тариф в любое время из настроек аккаунта.'
              },
              {
                q: 'Что происходит после окончания пробного периода?',
                a: 'Вы можете продолжить использовать бесплатный план или обновиться до Pro.'
              },
              {
                q: 'Есть ли возврат средств?',
                a: 'Да, мы предлагаем 30-дневную гарантию возврата денег без вопросов.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
