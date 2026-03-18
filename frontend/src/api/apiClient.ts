import { useForbiddenStore } from '../store/forbiddenStore'

// API Base URL Configuration
// В разработке используется прокси Vite (/api -> http://localhost:5001/api)
// В продакшене используется переменная окружения VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type RequestOptions = {
  method?: string
  body?: unknown
  token?: string | null
}

export function getAuthToken() {
  return localStorage.getItem('token')
}

function clearAuthAndRedirectToLogin() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options
  const token = options.token ?? getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  if (response.status === 401) {
    clearAuthAndRedirectToLogin()
    throw new Error('Unauthorized')
  }

  if (response.status === 403) {
    useForbiddenStore.getState().setForbidden('Нет прав')
    throw new Error('Нет прав')
  }

  const contentType = response.headers.get('content-type') || ''
  let data: any = null
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    const text = await response.text()
    data = text ? { message: text } : null
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.detail?.message ||
      `Request failed with status ${response.status}`
    const error = new Error(message)
    const fieldErrors = data?.fieldErrors || data?.detail?.fieldErrors
    if (fieldErrors) {
      ;(error as Error & { fieldErrors?: Record<string, string> }).fieldErrors = fieldErrors
    }
    throw error
  }

  return data as T
}

export function validateEmail(value: string): boolean {
  return EMAIL_REGEX.test((value || '').trim())
}
