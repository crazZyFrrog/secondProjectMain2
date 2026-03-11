import { create } from 'zustand'
import { apiRequest, getAuthToken } from '../api/apiClient'

interface User {
  id: string
  name: string
  email: string
  avatar: string
  subscription: 'free' | 'pro' | 'enterprise'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (
    name: string,
    email: string,
    password: string,
    plan: string,
    acceptTerms: boolean,
    acceptPrivacy: boolean
  ) => Promise<void>
  logout: () => void
}

type ApiClient = {
  id: string
  company_type: string
  username: string
  email: string
  plan_id: string | null
}

type ApiPlan = {
  id: string
  name: string
  features: string[]
  limits: Record<string, number> | null
}

const subscriptionFromPlan = (planName: string | undefined) => {
  if (!planName) return 'free'
  const normalized = planName.toLowerCase()
  if (normalized.includes('enterprise')) return 'enterprise'
  if (normalized.includes('pro')) return 'pro'
  return 'free'
}

const mapClientToUser = (client: ApiClient, planName?: string): User => ({
  id: client.id,
  name: client.username,
  email: client.email,
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(client.username)}&background=0ea5e9&color=fff`,
  subscription: subscriptionFromPlan(planName)
})

const storedToken = localStorage.getItem('token')
const storedUser = localStorage.getItem('user')
if (!storedToken && storedUser) {
  localStorage.removeItem('user')
}

export const useAuthStore = create<AuthState>((set) => ({
  user: storedToken && storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedToken && !!storedUser,
  isLoading: false,
  error: null,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const auth = await apiRequest<{ token: string }>('/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      localStorage.setItem('token', auth.token)
      const client = await apiRequest<ApiClient>('/clients/me', {
        token: auth.token
      })

      let planName: string | undefined
      if (client.plan_id) {
        const plans = await apiRequest<ApiPlan[]>('/plans')
        planName = plans.find(plan => plan.id === client.plan_id)?.name
      }

      const user = mapClientToUser(client, planName)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Ошибка входа' })
      throw error
    }
  },
  
  signup: async (
    name: string,
    email: string,
    password: string,
    plan: string,
    acceptTerms: boolean,
    acceptPrivacy: boolean
  ) => {
    set({ isLoading: true, error: null })
    try {
      const companyType = plan === 'enterprise' ? 'large' : 'small'
      await apiRequest('/auth/register', {
        method: 'POST',
        body: {
          company_type: companyType,
          username: name,
          email,
          password,
          confirm_password: password,
          accept_terms: acceptTerms,
          accept_privacy: acceptPrivacy
        }
      })

      const auth = await apiRequest<{ token: string }>('/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      localStorage.setItem('token', auth.token)

      const plans = await apiRequest<ApiPlan[]>('/plans')
      const desiredPlanName = plan === 'pro' ? 'Pro' : plan === 'enterprise' ? 'Enterprise' : 'Starter'
      const desiredPlan = plans.find(planItem => planItem.name.toLowerCase() === desiredPlanName.toLowerCase())
      if (desiredPlan) {
        await apiRequest('/clients/me/plan', {
          method: 'PATCH',
          token: auth.token,
          body: { plan_id: desiredPlan.id }
        })
      }

      const client = await apiRequest<ApiClient>('/clients/me', {
        token: auth.token
      })
      const user = mapClientToUser(client, desiredPlan?.name)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Ошибка регистрации' })
      throw error
    }
  },
  
  logout: () => {
    const token = getAuthToken()
    if (token) {
      apiRequest('/auth/logout', { method: 'POST', token }).catch(() => null)
    }
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, isAuthenticated: false, error: null })
  }
}))
