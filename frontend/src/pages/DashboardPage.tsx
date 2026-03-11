import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { useProjectStore } from '../store/projectStore'
import { useAuthStore } from '../store/authStore'
import { Plus, FileText, MoreVertical, Edit, Trash, Download } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const projects = useProjectStore(state => state.projects)
  const deleteProject = useProjectStore(state => state.deleteProject)
  const loadProjects = useProjectStore(state => state.loadProjects)
  const loading = useProjectStore(state => state.isLoading)
  const error = useProjectStore(state => state.error)
  const user = useAuthStore(state => state.user)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleDelete = (id: string) => {
    if (confirm('Удалить проект?')) {
      deleteProject(id).catch(() => null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Привет, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            У вас {projects.length} {projects.length === 1 ? 'проект' : 'проектов'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-gray-900 mb-1">{projects.length}</div>
            <div className="text-gray-600">Всего проектов</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {projects.filter(p => p.status === 'completed').length}
            </div>
            <div className="text-gray-600">Завершено</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {user?.subscription === 'free' ? '3' : '∞'}
            </div>
            <div className="text-gray-600">Лимит проектов</div>
          </div>
        </div>

        {/* Create Project Button */}
        <div className="mb-8">
          <Link
            to="/projects/new"
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-medium"
          >
            <Plus size={20} />
            <span>Создать проект</span>
          </Link>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center text-gray-600">Загрузка проектов...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              У вас пока нет проектов
            </h3>
            <p className="text-gray-600 mb-6">
              Создайте свой первый лендинг прямо сейчас
            </p>
            <Link
              to="/projects/new"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition font-medium"
            >
              <Plus size={20} />
              <span>Создать проект</span>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div key={project.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
                <div className="h-40 bg-gray-200 overflow-hidden">
                  <img
                    src={project.thumbnailUrl}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {project.name}
                    </h3>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {menuOpen === project.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <Link
                            to={`/projects/${project.id}/edit`}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                          >
                            <Edit size={16} />
                            <span>Редактировать</span>
                          </Link>
                          <Link
                            to={`/projects/${project.id}/export`}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                          >
                            <Download size={16} />
                            <span>Экспорт</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-red-600 w-full"
                          >
                            <Trash size={16} />
                            <span>Удалить</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      project.status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {project.status === 'completed' ? 'Готов' : 'Черновик'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(project.updatedAt)}
                    </span>
                  </div>

                  <Link
                    to={`/projects/${project.id}/edit`}
                    className="block w-full text-center bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition font-medium"
                  >
                    Открыть
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
