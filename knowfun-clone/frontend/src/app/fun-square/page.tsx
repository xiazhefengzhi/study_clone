"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, TrendingUp, Clock, Heart, Eye, User } from 'lucide-react'

interface Post {
  id: number
  course_id: number
  title: string
  description: string
  category: string
  views: number
  likes: number
  created_at: string
  course: {
    id: number
    title: string
    style: string
    difficulty: string
  }
  user: {
    id: number
    username: string
  }
}

export default function FunSquarePage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadPosts()
  }, [category, sortBy, page])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPosts({
        page,
        pageSize: 12,
        category: category !== 'all' ? category : undefined,
        sortBy,
        search: searchQuery || undefined
      })

      setPosts(response.posts)
      setTotal(response.total)
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadPosts()
  }

  const handleLike = async (postId: number) => {
    try {
      await apiClient.likePost(postId)
      // Refresh posts
      loadPosts()
    } catch (error) {
      console.error('Failed to like post:', error)
    }
  }

  const handleViewPost = async (post: Post) => {
    try {
      // Increment view count
      await apiClient.viewPost(post.id)
      // Navigate to course detail
      router.push(`/learn/courses/${post.course_id}`)
    } catch (error) {
      console.error('Failed to record view:', error)
    }
  }

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      technology: 'bg-blue-500',
      science: 'bg-green-500',
      language: 'bg-purple-500',
      business: 'bg-orange-500',
      art: 'bg-pink-500',
      other: 'bg-gray-500'
    }
    return colors[cat] || 'bg-gray-500'
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    }
    return colors[difficulty] || 'bg-gray-100 text-gray-800'
  }

  const getStyleLabel = (style: string) => {
    const labels: Record<string, string> = {
      standard: '标准',
      humorous: '幽默',
      academic: '学术',
      storytelling: '故事',
      practical: '实践'
    }
    return labels[style] || style
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎨 趣味广场
          </h1>
          <p className="text-gray-600">
            探索社区分享的精彩讲解内容
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="搜索讲解内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  搜索
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分类</SelectItem>
                <SelectItem value="technology">技术</SelectItem>
                <SelectItem value="science">科学</SelectItem>
                <SelectItem value="language">语言</SelectItem>
                <SelectItem value="business">商业</SelectItem>
                <SelectItem value="art">艺术</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="latest">
                  <Clock className="h-4 w-4 mr-1" />
                  最新
                </TabsTrigger>
                <TabsTrigger value="popular">
                  <Heart className="h-4 w-4 mr-1" />
                  最热
                </TabsTrigger>
                <TabsTrigger value="trending">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  趋势
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">暂无内容</p>
            <p className="text-gray-400 mt-2">试试其他筛选条件</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader onClick={() => handleViewPost(post)}>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getCategoryColor(post.category)}>
                        {post.category}
                      </Badge>
                      <Badge className={getDifficultyColor(post.course.difficulty)} variant="outline">
                        {post.course.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.description || '暂无描述'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent onClick={() => handleViewPost(post)}>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="h-4 w-4" />
                      <span>{post.user.username}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {getStyleLabel(post.course.style)}
                      </Badge>
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-between items-center">
                    <div className="flex gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLike(post.id)
                      }}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      点赞
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  上一页
                </Button>
                <div className="flex items-center px-4 text-sm text-gray-600">
                  第 {page} 页 / 共 {Math.ceil(total / 12)} 页
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / 12)}
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
