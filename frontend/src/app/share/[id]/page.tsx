"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Heart, Calendar, Zap, Download } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Course {
  id: number
  title: string
  description: string
  content: { generated?: string } | null
  style: string
  difficulty: string
  status: string
  is_public: boolean
  views_count: number
  likes_count: number
  created_at: string
  user?: {
    username: string
    avatar_url?: string
  }
}

export default function SharePage() {
  const params = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const courseId = params.id as string

  useEffect(() => {
    loadCourse()
  }, [courseId])

  const loadCourse = async () => {
    try {
      setLoading(true)
      setError(null)

      // 直接调用 API，不带 token（公开访问）
      const response = await fetch(`${API_URL}/api/v1/courses/${courseId}`)

      if (!response.ok) {
        if (response.status === 403) {
          setError('该内容未公开，无法访问')
        } else if (response.status === 404) {
          setError('内容不存在')
        } else {
          setError('加载失败')
        }
        return
      }

      const data = await response.json()
      setCourse(data)
    } catch (err) {
      console.error('Failed to load course:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 导出 HTML
  const handleExportHtml = () => {
    if (!course?.content?.generated) return

    const blob = new Blob([course.content.generated], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${course.title}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="text-3xl">😢</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">无法访问</h2>
            <p className="text-gray-400 mb-6">{error || '内容不存在'}</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                返回首页
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-lg font-bold text-transparent">
                XiaZheStudy
              </span>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportHtml}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                <Download className="h-4 w-4 mr-1" />
                下载
              </Button>
              <Link href="/sign-up">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600">
                  免费注册
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Title Bar */}
      <div className="border-b border-slate-700/50 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white mb-2">{course.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{course.views_count} 次观看</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{course.likes_count} 次点赞</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(course.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {course.content?.generated ? (
          <div
            className="w-full bg-white rounded-xl overflow-hidden shadow-2xl"
            style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}
          >
            <iframe
              srcDoc={course.content.generated}
              className="w-full h-full border-0"
              title={course.title}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p>内容尚未生成</p>
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent py-6 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 text-center pointer-events-auto">
          <p className="text-gray-400 mb-3">喜欢这个动画？立即创建你自己的！</p>
          <Link href="/learn/course-creation">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/25">
              免费制作动画
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
