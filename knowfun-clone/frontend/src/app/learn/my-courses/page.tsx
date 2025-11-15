/** My Courses Page - 我的讲解 */

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Loader2, Search, Trash2, Eye, Heart, Plus, Edit } from 'lucide-react'

interface Course {
  id: number
  title: string
  description: string | null
  style: string
  difficulty: string
  status: string
  views_count: number
  likes_count: number
  is_public: boolean
  created_at: string
}

export default function MyCoursesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  // Fetch courses
  useEffect(() => {
    if (user) {
      fetchCourses()
    }
  }, [user, statusFilter])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getCourses(
        1,
        100,
        statusFilter === 'all' ? undefined : statusFilter
      )
      setCourses(response.courses)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个讲解吗？')) return

    try {
      await apiClient.deleteCourse(id)
      await fetchCourses()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const togglePublic = async (id: number, isPublic: boolean) => {
    try {
      await apiClient.updateCourse(id, { is_public: !isPublic })
      await fetchCourses()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: 'secondary', label: '草稿' },
      published: { variant: 'default', label: '已发布' },
      archived: { variant: 'outline', label: '已归档' },
    }
    const config = variants[status] || variants.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getDifficultyBadge = (difficulty: string) => {
    const labels: Record<string, string> = {
      beginner: '入门',
      intermediate: '中级',
      advanced: '高级',
    }
    return <Badge variant="outline">{labels[difficulty] || difficulty}</Badge>
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">我的讲解</h1>
          <p className="text-muted-foreground mt-1">
            管理您创建的讲解内容
          </p>
        </div>
        <Button onClick={() => router.push('/learn/course-creation')}>
          <Plus className="mr-2 h-4 w-4" />
          创建讲解
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索讲解..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="draft">草稿</TabsTrigger>
            <TabsTrigger value="published">已发布</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? '未找到匹配的讲解' : '还没有创建任何讲解'}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push('/learn/course-creation')}>
                <Plus className="mr-2 h-4 w-4" />
                创建第一个讲解
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div className="flex gap-2">
                    {getStatusBadge(course.status)}
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2">
                  {course.title}
                </CardTitle>
                {course.description && (
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  {getDifficultyBadge(course.difficulty)}
                  <Badge variant="outline">{course.style}</Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {course.views_count}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {course.likes_count}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {formatDate(course.created_at)}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/learn/my-courses/${course.id}`)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  编辑
                </Button>
                <Button
                  variant={course.is_public ? 'secondary' : 'default'}
                  size="sm"
                  onClick={() => togglePublic(course.id, course.is_public)}
                >
                  {course.is_public ? '取消发布' : '发布'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(course.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Statistics */}
      {courses.length > 0 && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            共 {courses.length} 个讲解 •
            {courses.filter(c => c.is_public).length} 个已发布 •
            总浏览量 {courses.reduce((sum, c) => sum + c.views_count, 0)}
          </p>
        </div>
      )}
    </div>
  )
}
