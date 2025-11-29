export interface User {
  id: number
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string
  subscription_tier: string
  points_balance: number
  storage_used: number
}

export interface AuthResponse {
  access_token: string
  token_type: string
  refresh_token: string
  user: User
}

export interface RegisterResponse {
  message: string
  requires_email_verification: boolean
  access_token?: string
  refresh_token?: string
  user?: User
}

export interface Document {
  id: number
  title: string
  description?: string
  file_path: string
  file_type: string
  file_size: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  user_id: number
}

export interface Course {
  id: number
  title: string
  description?: string
  style: string
  difficulty: string
  status: 'draft' | 'generating' | 'completed' | 'failed'
  thumbnail_url?: string
  video_url?: string
  created_at: string
  updated_at: string
  user_id: number
  document_id?: number
  likes_count: number
  views_count: number
  is_public: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface StreamEvent {
  token?: string
  event?: string
  error?: string
}
