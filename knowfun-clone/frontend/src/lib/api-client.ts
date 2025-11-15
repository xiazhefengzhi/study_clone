/**
 * API client for backend communication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class APIClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = API_URL) {
    this.baseURL = baseURL
  }

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: 'An error occurred'
      }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async register(email: string, password: string, username: string) {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    })
  }

  async login(email: string, password: string) {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getCurrentUser() {
    return this.request('/api/v1/auth/me')
  }

  async refreshToken(refreshToken: string) {
    return this.request('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  }

  // Documents endpoints
  async uploadDocument(file: File, title: string, description?: string) {
    const formData = new FormData()
    formData.append('file', file)

    const url = new URL(`${this.baseURL}/api/v1/documents/upload`)
    url.searchParams.append('title', title)
    if (description) {
      url.searchParams.append('description', description)
    }

    const headers: HeadersInit = {}
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: 'Upload failed'
      }))
      throw new Error(error.detail)
    }

    return response.json()
  }

  async getDocuments(page = 1, pageSize = 20) {
    return this.request(`/api/v1/documents/?page=${page}&page_size=${pageSize}`)
  }

  async getDocument(id: number) {
    return this.request(`/api/v1/documents/${id}`)
  }

  async deleteDocument(id: number) {
    return this.request(`/api/v1/documents/${id}`, {
      method: 'DELETE',
    })
  }

  // Courses endpoints
  async createCourse(data: {
    title: string
    document_id?: number
    style?: string
    difficulty?: string
    description?: string
  }) {
    return this.request('/api/v1/courses/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCourses(page = 1, pageSize = 20, status?: string) {
    let url = `/api/v1/courses/?page=${page}&page_size=${pageSize}`
    if (status) {
      url += `&status=${status}`
    }
    return this.request(url)
  }

  async getCourse(id: number) {
    return this.request(`/api/v1/courses/${id}`)
  }

  async updateCourse(id: number, data: any) {
    return this.request(`/api/v1/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCourse(id: number) {
    return this.request(`/api/v1/courses/${id}`, {
      method: 'DELETE',
    })
  }

  async likeCourse(id: number) {
    return this.request(`/api/v1/courses/${id}/like`, {
      method: 'POST',
    })
  }

  // AI Generation endpoints (SSE streaming)
  async* generateFromDocument(
    documentId: number,
    style: string,
    difficulty: string,
    title: string,
    onToken?: (token: string) => void
  ): AsyncGenerator<string, void, unknown> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseURL}/api/v1/ai/generate/document`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        document_id: documentId,
        style,
        difficulty,
        title,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body')
    }

    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))

            if (data.token) {
              accumulated += data.token
              if (onToken) {
                onToken(data.token)
              }
              yield data.token
            } else if (data.event === '[DONE]') {
              return
            } else if (data.error) {
              throw new Error(data.error)
            }
          } catch (e) {
            // Ignore JSON parse errors for partial chunks
            if (!(e instanceof SyntaxError)) {
              throw e
            }
          }
        }
      }
    }
  }

  async* generateFromText(
    text: string,
    style: string,
    difficulty: string,
    title: string,
    onToken?: (token: string) => void
  ): AsyncGenerator<string, void, unknown> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseURL}/api/v1/ai/generate/text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text,
        style,
        difficulty,
        title,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body')
    }

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))

            if (data.token) {
              if (onToken) {
                onToken(data.token)
              }
              yield data.token
            } else if (data.event === '[DONE]') {
              return
            } else if (data.error) {
              throw new Error(data.error)
            }
          } catch (e) {
            // Ignore JSON parse errors for partial chunks
            if (!(e instanceof SyntaxError)) {
              throw e
            }
          }
        }
      }
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient()
