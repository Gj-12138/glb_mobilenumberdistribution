import type { ApiResponse } from '@/types'

const BASE = '/api'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('phone_data_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    // Trigger logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('phone_data_token')
      window.location.reload()
    }
    throw new Error('未授权，请重新登录')
  }

  const data = await res.json()
  if (data.code !== 0) {
    throw new Error(data.message || '请求失败')
  }
  return data
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: import('@/types').UserInfo }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: () =>
    request<import('@/types').UserInfo>('/auth/me'),

  changePassword: (oldPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  // Users
  getUsers: (params: { page?: number; pageSize?: number; keyword?: string }) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', String(params.page))
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
    if (params.keyword) searchParams.set('keyword', params.keyword)
    return request<import('@/types').PaginatedResponse<import('@/types').UserInfo>>(
      `/users?${searchParams.toString()}`
    )
  },

  getUserOptions: () =>
    request<Array<{ id: number; nickname: string }>>('/users/options'),

  createUser: (data: { username: string; password: string; nickname: string; role: string }) =>
    request<import('@/types').UserInfo>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: number, data: { nickname?: string; role?: string }) =>
    request<import('@/types').UserInfo>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateUserStatus: (id: number, status: number) =>
    request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  resetPassword: (id: number, password: string) =>
    request(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  deleteUser: (id: number) =>
    request(`/users/${id}`, { method: 'DELETE' }),

  // Phone Data
  getPhoneData: (params: import('@/types').PhoneDataListParams) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', String(params.page))
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
    if (params.status) searchParams.set('status', params.status)
    if (params.keyword) searchParams.set('keyword', params.keyword)
    if (params.assignedTo) searchParams.set('assignedTo', String(params.assignedTo))
    if (params.source) searchParams.set('source', params.source)
    return request<import('@/types').PaginatedResponse<import('@/types').PhoneDataItem>>(
      `/phone-data?${searchParams.toString()}`
    )
  },

  getMyPhoneData: (params: { page?: number; pageSize?: number; status?: string; keyword?: string }) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', String(params.page))
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
    if (params.status) searchParams.set('status', params.status)
    if (params.keyword) searchParams.set('keyword', params.keyword)
    return request<import('@/types').PaginatedResponse<import('@/types').PhoneDataItem>>(
      `/phone-data/my?${searchParams.toString()}`
    )
  },

  importPhones: (phones: string[], source?: string) =>
    request<{ count: number }>('/phone-data/import', {
      method: 'POST',
      body: JSON.stringify({ phones, source }),
    }),

  distributePhones: (ids: number[], assignedTo: number) =>
    request('/phone-data/distribute', {
      method: 'POST',
      body: JSON.stringify({ ids, assignedTo }),
    }),

  autoDistribute: () =>
    request('/phone-data/auto-distribute', { method: 'POST' }),

  recyclePhones: (ids: number[]) =>
    request('/phone-data/recycle', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  updatePhoneStatus: (id: number, status: string) =>
    request(`/phone-data/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  batchUpdateStatus: (ids: number[], status: string) =>
    request('/phone-data/batch-status', {
      method: 'PATCH',
      body: JSON.stringify({ ids, status }),
    }),

  deletePhoneData: (id: number) =>
    request(`/phone-data/${id}`, { method: 'DELETE' }),

  batchDeletePhoneData: (ids: number[]) =>
    request<{ count: number }>('/phone-data/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  getSourceOptions: () =>
    request<string[]>('/phone-data/sources'),

  getPhoneDataStats: (params: { keyword?: string; source?: string } = {}) => {
    const searchParams = new URLSearchParams()
    if (params.keyword) searchParams.set('keyword', params.keyword)
    if (params.source) searchParams.set('source', params.source)
    return request<{ total: number; pending: number; connected: number; unreachable: number; noAnswer: number }>(
      `/phone-data/stats?${searchParams.toString()}`
    )
  },

  // Logs
  getLogs: (params: import('@/types').LogListParams) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', String(params.page))
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
    if (params.operType) searchParams.set('operType', params.operType)
    if (params.keyword) searchParams.set('keyword', params.keyword)
    return request<import('@/types').PaginatedResponse<import('@/types').LogItem>>(
      `/logs?${searchParams.toString()}`
    )
  },
}