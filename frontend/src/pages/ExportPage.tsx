import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../components/Header'
import { useProjectStore } from '../store/projectStore'
import { Download, FileText, Code, File, ArrowLeft } from 'lucide-react'
import { apiRequest, getAuthToken } from '../api/apiClient'

type ExportFormat = 'pdf' | 'html' | 'docx'

export default function ExportPage() {
  const { id } = useParams<{ id: string }>()
  const project = useProjectStore(state => state.getProjectById(id!))
  const loadProjects = useProjectStore(state => state.loadProjects)
  const loading = useProjectStore(state => state.isLoading)
  const projectError = useProjectStore(state => state.error)
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{ date: string; format: string; size: string }>>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadHistory = async () => {
      if (!id) return
      setHistoryLoading(true)
      setHistoryError(null)
      try {
        const token = getAuthToken()
        const data = await apiRequest<Array<{ date: string; format: string; size: string }>>(
          `/projects/${id}/exports`,
          { token }
        )
        if (isMounted) {
          setHistory(data)
        }
      } catch (err: any) {
        if (isMounted) {
          setHistoryError(err.message || 'Не удалось загрузить историю экспортов')
        }
      } finally {
        if (isMounted) {
          setHistoryLoading(false)
        }
      }
    }
    loadHistory()
    return () => {
      isMounted = false
    }
  }, [id])

  const handleExport = async () => {
    if (!id) return
    setExporting(true)
    setExportError(null)
    try {
      const token = getAuthToken()
      await apiRequest(`/projects/${id}/export`, {
        method: 'POST',
        token,
        body: { format }
      })
      const data = await apiRequest<Array<{ date: string; format: string; size: string }>>(
        `/projects/${id}/exports`,
        { token }
      )
      setHistory(data)
    } catch (err: any) {
      setExportError(err.message || 'Не удалось выполнить экспорт')
    } finally {
      setExporting(false)
    }
  }

  const formats = [
    {
      id: 'pdf',
      name: 'PDF',
      icon: <FileText className="w-8 h-8 text-red-500" />,
      description: 'Универсальный формат для печати и просмотра'
    },
    {
      id: 'html',
      name: 'HTML',
      icon: <Code className="w-8 h-8 text-blue-500" />,
      description: 'Готовый сайт для размещения на хостинге'
    },
    {
      id: 'docx',
      name: 'DOCX',
      icon: <File className="w-8 h-8 text-blue-600" />,
      description: 'Документ Word для редактирования'
    }
  ]

  useEffect(() => {
    if (!project) {
      loadProjects()
    }
  }, [project, loadProjects])

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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Экспорт проекта</h1>
        <p className="text-gray-600 mb-8">{project.name}</p>

        {/* Format Selection */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6">Выберите формат экспорта</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {formats.map(fmt => (
              <button
                key={fmt.id}
                onClick={() => setFormat(fmt.id as ExportFormat)}
                className={`p-6 rounded-xl border-2 transition text-left ${
                  format === fmt.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-3">{fmt.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{fmt.name}</h3>
                <p className="text-sm text-gray-600">{fmt.description}</p>
              </button>
            ))}
          </div>

          {/* Export Options */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold mb-4">Настройки экспорта</h3>
            
            {format === 'pdf' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Размер страницы
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>A4</option>
                    <option>Letter</option>
                    <option>A3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ориентация
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>Портретная</option>
                    <option>Альбомная</option>
                  </select>
                </div>
              </div>
            )}

            {format === 'html' && (
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Включить CSS inline</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">Минифицировать код</span>
                </label>
              </div>
            )}

            {format === 'docx' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Стиль документа
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Стандартный</option>
                  <option>Деловой</option>
                  <option>Современный</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Export Button */}
        {exportError && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {exportError}
          </div>
        )}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full bg-primary-600 text-white py-4 rounded-lg hover:bg-primary-700 transition font-medium text-lg flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Download size={24} />
          <span>{exporting ? 'Экспорт...' : `Скачать ${format.toUpperCase()}`}</span>
        </button>

        {/* Export History */}
        <div className="mt-12 bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-semibold mb-6">История экспортов</h2>
          <div className="space-y-3">
            {historyLoading ? (
              <div className="text-gray-600">Загрузка истории...</div>
            ) : historyError ? (
              <div className="text-red-600">{historyError}</div>
            ) : history.length === 0 ? (
              <div className="text-gray-500 text-center py-6">Экспортов пока нет</div>
            ) : (
              history.map((exp, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <FileText className="text-gray-400" size={24} />
                    <div>
                      <div className="font-medium text-gray-900">{exp.format}</div>
                      <div className="text-sm text-gray-500">{exp.date} • {exp.size}</div>
                    </div>
                  </div>
                  <button className="text-primary-600 hover:text-primary-700 font-medium">
                    Скачать
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
