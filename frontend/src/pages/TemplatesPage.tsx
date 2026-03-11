import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { Template } from '../data/templates'
import { Crown } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { apiRequest } from '../api/apiClient'

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('Все')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true
    const loadTemplates = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiRequest<Template[]>('/templates')
        if (isMounted) {
          setTemplates(data)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Не удалось загрузить шаблоны')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadTemplates()
    return () => {
      isMounted = false
    }
  }, [])

  const categories = ['Все', ...Array.from(new Set(templates.map(t => t.category)))]
  const filteredTemplates = selectedCategory === 'Все'
    ? templates
    : templates.filter(t => t.category === selectedCategory)

  const handleUseTemplate = (templateId: string) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    navigate('/projects/new', { state: { templateId } })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Галерея шаблонов
          </h1>
          <p className="text-xl text-gray-600">
            Выберите готовый шаблон и начните создавать свой лендинг
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center text-gray-600">Загрузка шаблонов...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : templates.length === 0 ? (
          <div className="text-center text-gray-600">
            Шаблоны пока не добавлены. Запустите `python seed_db.py`, чтобы загрузить демо-данные.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden cursor-pointer"
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={template.preview_image}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                  {template.is_premium && (
                    <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                      <Crown size={14} />
                      <span>Premium</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{template.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUseTemplate(template.id)
                    }}
                    className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition font-medium"
                  >
                    Использовать шаблон
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Template Modal */}
        {selectedTemplate && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTemplate(null)}
          >
            <div
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const template = templates.find(t => t.id === selectedTemplate)!
                return (
                  <>
                    <div className="relative h-96">
                      <img
                        src={template.preview_image}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      {template.is_premium && (
                        <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-semibold flex items-center space-x-2">
                          <Crown size={18} />
                          <span>Premium</span>
                        </div>
                      )}
                    </div>
                    <div className="p-8">
                      <h2 className="text-3xl font-bold mb-2">{template.name}</h2>
                      <p className="text-gray-600 mb-6">{template.description}</p>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleUseTemplate(template.id)}
                          className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-medium"
                        >
                          Использовать шаблон
                        </button>
                        <button
                          onClick={() => setSelectedTemplate(null)}
                          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          Закрыть
                        </button>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
