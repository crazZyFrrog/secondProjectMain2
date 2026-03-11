import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useProjectStore } from '../store/projectStore'
import { Sparkles, ArrowLeft, Wand2 } from 'lucide-react'
import { apiRequest, getAuthToken } from '../api/apiClient'

export default function AIGeneratePage() {
  const { id } = useParams<{ id: string }>()
  const project = useProjectStore(state => state.getProjectById(id!))
  const updateProject = useProjectStore(state => state.updateProject)
  const loadProjects = useProjectStore(state => state.loadProjects)
  const loading = useProjectStore(state => state.isLoading)
  const projectError = useProjectStore(state => state.error)
  const navigate = useNavigate()
  
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [products, setProducts] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [usp, setUsp] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!project) {
      loadProjects()
    }
  }, [project, loadProjects])

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const data = await apiRequest('/ai/generate', {
        method: 'POST',
        token: getAuthToken(),
        body: { companyName, industry, products, targetAudience, usp }
      })
      setGeneratedContent(data)
      setGenerated(true)
    } catch (err: any) {
      setError(err.message || 'Не удалось сгенерировать контент')
    } finally {
      setGenerating(false)
    }
  }

  const handleApply = () => {
    if (id && generatedContent) {
      updateProject(id, {
        data: {
          ...project!.data,
          company: generatedContent.company,
          products: generatedContent.products,
          benefits: generatedContent.benefits
        }
      })
      alert('Контент применен к проекту!')
      navigate(`/projects/${id}/edit`)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка проекта...</div>
  }

  if (projectError) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{projectError}</div>
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Проект не найден</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to={`/projects/${id}/edit`}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          <span>Назад к проекту</span>
        </Link>

        <div className="flex items-center space-x-3 mb-8">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI-генерация контента</h1>
        </div>

        {!generated ? (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <p className="text-gray-600 mb-8">
              Заполните информацию о вашей компании, и AI создаст профессиональный контент для лендинга
            </p>

            <div className="space-y-6">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название компании *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="TechSolutions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сфера деятельности *
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="IT-консалтинг, разработка ПО"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ключевые продукты/услуги *
                </label>
                <input
                  type="text"
                  value={products}
                  onChange={(e) => setProducts(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Разработка сайтов, мобильные приложения, консалтинг"
                />
                <p className="text-xs text-gray-500 mt-1">Через запятую</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Целевая аудитория *
                </label>
                <textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Малый и средний бизнес, стартапы, предприниматели..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Уникальное торговое предложение
                </label>
                <textarea
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Что отличает вас от конкурентов?"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!companyName || !industry || !products || !targetAudience || generating}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-primary-600 text-white py-4 rounded-lg hover:from-purple-700 hover:to-primary-700 transition font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wand2 size={24} />
                <span>{generating ? 'Генерация контента...' : 'Сгенерировать контент'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Generated Content Preview */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                <Sparkles className="text-purple-600" />
                <span>Сгенерированный контент</span>
              </h2>

              {/* Company */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">О компании</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2"><strong>Описание:</strong> {generatedContent.company.description}</p>
                  <p className="text-gray-700 mb-2"><strong>Миссия:</strong> {generatedContent.company.mission}</p>
                  <p className="text-gray-700"><strong>Ценности:</strong> {generatedContent.company.values.join(', ')}</p>
                </div>
              </div>

              {/* Products */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">Продукты ({generatedContent.products.length})</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {generatedContent.products.map((product: any) => (
                    <div key={product.id} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-1">{product.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                      <p className="text-primary-600 font-medium">{product.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">Преимущества</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {generatedContent.benefits.map((benefit: any) => (
                    <div key={benefit.id} className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-3xl mb-2">{benefit.icon}</div>
                      <h4 className="font-semibold mb-1">{benefit.title}</h4>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleApply}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-medium"
                >
                  Применить к проекту
                </button>
                <button
                  onClick={() => {
                    setGenerated(false)
                    setGeneratedContent(null)
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Сгенерировать заново
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
