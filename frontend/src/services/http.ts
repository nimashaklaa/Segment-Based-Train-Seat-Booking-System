declare global {
  interface Window {
    __ENV__?: { API_URL?: string }
  }
}

export const BASE =
  window.__ENV__?.API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new HttpError(res.status, text || `HTTP ${res.status}`)
  }
  return (await res.json()) as Promise<T>
}