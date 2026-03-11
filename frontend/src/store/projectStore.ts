import { create } from 'zustand'
import { apiRequest, getAuthToken } from '../api/apiClient'

export interface Project {
  id: string
  name: string
  templateId: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'completed'
  thumbnailUrl: string
  data: {
    company: {
      name: string
      logo: string
      description: string
      mission: string
      values: string[]
    }
    products: Array<{
      id: string
      name: string
      description: string
      price: string
      image: string
    }>
    audience: Array<{
      id: string
      segment: string
      description: string
      pains: string[]
      needs: string[]
    }>
    benefits: Array<{
      id: string
      icon: string
      title: string
      description: string
    }>
    pricing: Array<{
      id: string
      name: string
      price: string
      period: string
      features: string[]
      isRecommended: boolean
    }>
    contacts: {
      phone: string
      email: string
      address: string
      socials: { [key: string]: string }
    }
    cases: Array<{
      id: string
      title: string
      client: string
      challenge: string
      solution: string
      results: string
      images: string[]
    }>
    faq: Array<{
      id: string
      question: string
      answer: string
    }>
  }
}

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  loadProjects: () => Promise<void>
  addProject: (project: Project) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (id: string) => void
  getProjectById: (id: string) => Project | undefined
}

type ApiProject = {
  id: string
  name: string
  template_id: string
  created_at: string
  updated_at: string
  status: 'draft' | 'completed'
  thumbnail_url: string
  data: Project['data']
}

const mapApiProject = (project: ApiProject): Project => ({
  id: project.id,
  name: project.name,
  templateId: project.template_id,
  createdAt: project.created_at,
  updatedAt: project.updated_at,
  status: project.status,
  thumbnailUrl: project.thumbnail_url,
  data: project.data
})

const toApiProjectPayload = (project: Project) => ({
  name: project.name,
  template_id: project.templateId,
  status: project.status,
  thumbnail_url: project.thumbnailUrl,
  data: project.data
})

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  
  loadProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = getAuthToken()
      const data = await apiRequest<ApiProject[]>('/projects', { token })
      set({ projects: data.map(mapApiProject), isLoading: false })
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Не удалось загрузить проекты' })
    }
  },
  
  addProject: async (project) => {
    set({ isLoading: true, error: null })
    try {
      const token = getAuthToken()
      const created = await apiRequest<ApiProject>('/projects', {
        method: 'POST',
        token,
        body: toApiProjectPayload(project)
      })
      const mapped = mapApiProject(created)
      set(state => ({ projects: [...state.projects, mapped], isLoading: false }))
      return mapped
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Не удалось создать проект' })
      throw error
    }
  },
  
  updateProject: async (id, updates) => {
    set(state => {
      const newProjects = state.projects.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
      return {
        projects: newProjects,
        currentProject: state.currentProject?.id === id
          ? { ...state.currentProject, ...updates }
          : state.currentProject
      }
    })
    try {
      const token = getAuthToken()
      await apiRequest(`/projects/${id}`, {
        method: 'PATCH',
        token,
        body: {
          name: updates.name,
          status: updates.status,
          thumbnail_url: updates.thumbnailUrl,
          data: updates.data
        }
      })
      set({ isLoading: false })
    } catch (error: any) {
      const message = error.message || 'Не удалось обновить проект'
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },
  
  deleteProject: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const token = getAuthToken()
      await apiRequest(`/projects/${id}`, { method: 'DELETE', token })
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        isLoading: false
      }))
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Не удалось удалить проект' })
      throw error
    }
  },

  setCurrentProject: (id) => {
    const project = get().projects.find(p => p.id === id)
    set({ currentProject: project || null })
  },
  
  getProjectById: (id) => {
    return get().projects.find(p => p.id === id)
  }
}))
