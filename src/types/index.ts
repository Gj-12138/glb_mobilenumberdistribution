// User types
export interface UserInfo {
  id: number
  username: string
  nickname: string
  role: 'admin' | 'user'
  status: number
  passwordText?: string | null
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: UserInfo
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

// Phone data types
export type PhoneStatus = 'pending' | 'no_answer' | 'unreachable' | 'connected'

export interface PhoneDataItem {
  id: number
  phone: string
  name: string | null
  remark: string | null
  source: string | null
  status: PhoneStatus
  assignedTo: number | null
  assignedAt: string | null
  followedUpAt: string | null
  createdBy: number
  createdAt: string
  updatedAt: string
  assignedUser?: { id: number; nickname: string } | null
}

export interface PhoneDataListParams {
  page?: number
  pageSize?: number
  status?: PhoneStatus | ''
  keyword?: string
  assignedTo?: number | ''
  source?: string
}

export interface ImportRequest {
  phones: string[]
  source?: string
}

export interface DistributeRequest {
  ids: number[]
  assignedTo: number
}

export interface BatchStatusRequest {
  ids: number[]
  status: PhoneStatus
}

export interface RecycleRequest {
  ids: number[]
}

// Operation log types
export type OperType = 'login' | 'import' | 'distribute' | 'recycle' | 'status_change'

export interface LogItem {
  id: number
  userId: number
  userNickname: string
  operType: OperType
  operContent: string | null
  operTime: string
}

export interface LogListParams {
  page?: number
  pageSize?: number
  operType?: OperType | ''
  keyword?: string
}

// Pagination
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// API response
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// Status labels
export const STATUS_LABELS: Record<PhoneStatus, string> = {
  pending: '未跟进',
  no_answer: '无人接听',
  unreachable: '打不通',
  connected: '已打通',
}

export const STATUS_COLORS: Record<PhoneStatus, string> = {
  pending: 'bg-slate-100 text-slate-700',
  no_answer: 'bg-amber-50 text-amber-700 border border-amber-200',
  unreachable: 'bg-red-50 text-red-700 border border-red-200',
  connected: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

export const OPER_TYPE_LABELS: Record<OperType, string> = {
  login: '登录',
  import: '导入数据',
  distribute: '分发数据',
  recycle: '回收数据',
  status_change: '状态变更',
}
