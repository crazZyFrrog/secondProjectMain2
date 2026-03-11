import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import { Template } from '../data/templates'
import { useProjectStore, Project } from '../store/projectStore'
import { ArrowRight, Crown } from 'lucide-react'
import { apiRequest } from '../api/apiClient'

export default function CreateProjectPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const addProject = useProjectStore(state => state.addProject)
  
  const preselectedTemplateId = location.state?.templateId
  const [selectedTemplateId, setSelectedTemplateId] = useState(preselectedTemplateId || '')
  const [projectName, setProjectName] = useState('')
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [templatesError, setTemplatesError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadTemplates = async () => {
      setLoadingTemplates(true)
      setTemplatesError(null)
      try {
        const data = await apiRequest<Template[]>('/templates')
        if (isMounted) {
          setTemplates(data)
        }
      } catch (err: any) {
        if (isMounted) {
          setTemplatesError(err.message || 'Не удалось загрузить шаблоны')
        }
      } finally {
        if (isMounted) {
          setLoadingTemplates(false)
        }
      }
    }
    loadTemplates()
    return () => {
      isMounted = false
    }
  }, [])

  const handleCreate = async () => {
    if (!selectedTemplateId || !projectName) {
      alert('Выберите шаблон и введите название проекта')
      return
    }

    setCreating(true)
    setCreateError(null)

    const newProject: Project = {
      id: '',
      name: projectName,
      templateId: selectedTemplateId,
      createdAt: '',
      updatedAt: '',
      status: 'draft',
      thumbnailUrl: templates.find(t => t.id === selectedTemplateId)?.preview_image || '',
      data: {
        company: { name: '', logo: '', description: '', mission: '', values: [] },
        products: [],
        audience: [],
        benefits: [],
        pricing: [],
        contacts: { phone: '', email: '', address: '', socials: {} },
        cases: [],
        faq: []
      }
    }

    try {
      const created = await addProject(newProject)
      navigate(`/projects/${created.id}/edit`)
    } catch (err: any) {
      setCreateError(err.message || 'Не удалось создать проект')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Создать новый проект</h1>

        {/* Project Name */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название проекта
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Например: Лендинг для IT-консалтинга"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Template Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Выберите шаблон</h2>
          {loadingTemplates ? (
            <div className="text-gray-600">Загрузка шаблонов...</div>
          ) : templatesError ? (
            <div className="text-red-600">{templatesError}</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                    selectedTemplateId === template.id
                      ? 'border-primary-600 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="relative h-32">
                    <img
                      src={template.preview_image}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                    {template.is_premium && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1">
                        <Crown size={12} />
                        <span>Pro</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-xs text-gray-600">{template.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          {createError && (
            <div className="mr-auto text-sm text-red-600 self-center">{createError}</div>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedTemplateId || !projectName || creating}
            className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{creating ? 'Создание...' : 'Создать проект'}</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
