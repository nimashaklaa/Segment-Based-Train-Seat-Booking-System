declare global {
  interface Window {
    __ENV__?: { API_URL?: string }
  }
}

export const BASE =
  window.__ENV__?.API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'HttpError'
  }
}

function getAdminToken(): string {
  try {
    return localStorage.getItem('admin_token') ?? ''
  } catch {
    return ''
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  }

  if (path.startsWith('/admin')) {
    const token = getAdminToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new HttpError(res.status, text || `HTTP ${res.status}`)
  }
  return (await res.json()) as Promise<T>
}