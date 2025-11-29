"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'
import { Course } from '@/types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Heart, Eye, User, Calendar, Edit, Trash2 } from 'lucide-react'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)

  const courseId = params.id as string

  useEffect(() => {
    loadCourse()
  }, [courseId])

  const loadCourse = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getCourse(parseInt(courseId))
      setCourse(data)
    } catch (error) {
      console.error('Failed to load course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!course) return

    try {
      await apiClient.likeCourse(course.id)
      setLiked(true)
      setCourse({
        ...course,
        likes_count: course.likes_count + 1
      })
    } catch (error) {
      console.error('Failed to like course:', error)
    }
  }

  const handleEdit = () => {
    router.push(`/learn/course-creation?id=${course?.id}`)
  }

  const handleDelete = async () => {
    if (!course) return

    try {
      await apiClient.deleteCourse(course.id)
      router.push('/learn/my-courses')
    } catch (error) {
      console.error('Failed to delete course:', error)
    }
  }

  const getStyleLabel = (style: string) => {
    const labels: Record<string, string> = {
      standard: '标准风格',
      humorous: '幽默风格',
      academic: '学术风格',
      storytelling: '故事风格',
      practical: '实践风格'
    }
    return labels[style] || style
  }

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      beginner: '初学者',
      intermediate: '中级',
      advanced: '高级'
    }
    return labels[difficulty] || difficulty
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    }
    return colors[difficulty] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>动画不存在</CardTitle>
            <CardDescription>该动画可能已被删除或您没有访问权限</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = user && user.id === course.user_id

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>

            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要删除这个动画吗？此操作无法撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Course Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{course.title}</CardTitle>
                {course.description && (
                  <CardDescription className="text-lg">{course.description}</CardDescription>
                )}
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <Badge className={getDifficultyColor(course.difficulty)}>
                  {getDifficultyLabel(course.difficulty)}
                </Badge>
                <Badge variant="outline">{getStyleLabel(course.style)}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{course.views_count} 次浏览</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{course.likes_count} 个点赞</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(course.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!isOwner && !liked && (
              <Button onClick={handleLike} className="mb-4">
                <Heart className="mr-2 h-4 w-4" />
                点赞
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Course Content */}
        <Card>
          <CardHeader>
            <CardTitle>动画内容</CardTitle>
          </CardHeader>
          <CardContent>
            {course.content?.generated ? (
              <div className="w-full" style={{ height: 'calc(100vh - 400px)', minHeight: '600px' }}>
                <iframe
                  srcDoc={course.content.generated}
                  className="w-full h-full border-0 rounded-lg"
                  title={course.title}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>暂无内容</p>
                <p className="text-sm mt-2">动画内容尚未生成</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
