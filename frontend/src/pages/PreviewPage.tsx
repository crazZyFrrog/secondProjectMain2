import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import { ArrowLeft, Monitor, Tablet, Smartphone } from 'lucide-react'

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const project = useProjectStore(state => state.getProjectById(id!))
  const loadProjects = useProjectStore(state => state.loadProjects)
  const loading = useProjectStore(state => state.isLoading)
  const error = useProjectStore(state => state.error)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useEffect(() => {
    if (!project) {
      loadProjects()
    }
  }, [project, loadProjects])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка проекта...</div>
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Проект не найден</div>
  }

  const deviceWidths = {
    desktop: 'w-full',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]'
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link
          to={`/projects/${id}/edit`}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          <span>Назад к редактору</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-2 rounded ${device === 'desktop' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Monitor size={20} />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-2 rounded ${device === 'tablet' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Tablet size={20} />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-2 rounded ${device === 'mobile' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Smartphone size={20} />
          </button>
        </div>

        <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
          Поделиться
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto flex justify-center items-start p-8">
        <div className={`${deviceWidths[device]} bg-white shadow-2xl transition-all duration-300`}>
          {/* Rendered Landing Page Preview */}
          <div className="min-h-screen">
            {/* Hero */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20 px-8">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-5xl font-bold mb-4">
                  {project.data.company?.name || 'Название компании'}
                </h1>
                <p className="text-xl text-primary-100">
                  {project.data.company?.description || 'Описание компании появится здесь'}
                </p>
              </div>
            </div>

            {/* Company Info */}
            <div className="py-16 px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">О нас</h2>
                <p className="text-gray-600 text-lg mb-6">
                  {project.data.company?.mission || 'Миссия компании'}
                </p>
                {project.data.company?.values && project.data.company.values.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {project.data.company.values.map((value, idx) => (
                      <span key={idx} className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full">
                        {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Products */}
            {project.data.products && project.data.products.length > 0 && (
              <div className="py-16 px-8 bg-gray-50">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-3xl font-bold mb-8">Наши продукты</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {project.data.products.map(product => (
                      <div key={product.id} className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                        <p className="text-gray-600 mb-4">{product.description}</p>
                        <div className="text-2xl font-bold text-primary-600">{product.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="bg-gray-900 text-white py-12 px-8">
              <div className="max-w-4xl mx-auto text-center">
                <p className="text-gray-400">© 2026 {project.data.company?.name || 'Компания'}. Все права защищены.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
