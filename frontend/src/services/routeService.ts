import { request } from './http'
import type { Route } from '../types'

export const routeService = {
  list: () => request<Route[]>('/admin/routes'),

  create: (name: string, code: string, origin: string, destination: string) =>
    request<Route>('/admin/routes', {
      method: 'POST',
      body: JSON.stringify({ name, code, origin, destination }),
    }),

  update: (id: string, name: string, code: string, origin: string, destination: string) =>
    request<Route>(`/admin/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, code, origin, destination }),
    }),
}
