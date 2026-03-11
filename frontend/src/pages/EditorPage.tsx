import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import { Eye, Download, Sparkles, Menu } from 'lucide-react'

type Section = 'company' | 'products'

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const project = useProjectStore(state => state.getProjectById(id!))
  const updateProject = useProjectStore(state => state.updateProject)
  const loadProjects = useProjectStore(state => state.loadProjects)
  const loading = useProjectStore(state => state.isLoading)
  const error = useProjectStore(state => state.error)
  const [activeSection, setActiveSection] = useState<Section>('company')
  const [formData, setFormData] = useState(project?.data || {
    company: { name: '', logo: '', description: '', mission: '', values: [] },
    products: [],
    audience: [],
    benefits: [],
    pricing: [],
    contacts: { phone: '', email: '', address: '', socials: {} },
    cases: [],
    faq: []
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (project) {
      setFormData(project.data)
    }
  }, [project])

  useEffect(() => {
    if (!project) {
      loadProjects()
    }
  }, [project, loadProjects])

  const handleSave = async () => {
    if (!id) return
    setSaveStatus('saving')
    try {
      await updateProject(id, { data: formData })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const sections: { id: Section; name: string }[] = [
    { id: 'company', name: 'О компании' },
    { id: 'products', name: 'Продукты/Услуги' }
  ]

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка проекта...</div>
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Проект не найден</div>
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          <input
            type="text"
            value={project.name}
            onChange={(e) => updateProject(id!, { name: e.target.value })}
            className="text-xl font-semibold border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2"
          />
          {saveStatus === 'saving' && (
            <span className="text-sm text-gray-500">Сохранение...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-sm font-medium text-green-600">Сохранено!</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-600">Ошибка сохранения</span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/projects/${id}/ai-generate`}
            className="flex items-center space-x-2 px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition"
          >
            <Sparkles size={18} />
            <span className="hidden sm:inline">AI-генерация</span>
          </Link>
          <Link
            to={`/projects/${id}/preview`}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Eye size={18} />
            <span className="hidden sm:inline">Превью</span>
          </Link>
          <Link
            to={`/projects/${id}/export`}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Экспорт</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Разделы</h3>
              <nav className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as Section)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      activeSection === section.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{section.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Company Section */}
            {activeSection === 'company' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">О компании</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название компании
                    </label>
                    <input
                      type="text"
                      value={formData.company?.name || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        company: { ...formData.company, name: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="TechSolutions"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Описание компании
                    </label>
                    <textarea
                      value={formData.company?.description || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        company: { ...formData.company, description: e.target.value }
                      })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Расскажите о вашей компании..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Миссия
                    </label>
                    <input
                      type="text"
                      value={formData.company?.mission || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        company: { ...formData.company, mission: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Наша миссия..."
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Сохранить изменения
                  </button>
                </div>
              </div>
            )}

            {/* Products Section */}
            {activeSection === 'products' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Продукты и услуги</h2>
                <p className="text-gray-600 mb-6">
                  Добавьте продукты или услуги вашей компании
                </p>
                <button className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 text-gray-500 hover:border-primary-600 hover:text-primary-600 transition">
                  + Добавить продукт
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="mt-6 w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Сохранить изменения
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
