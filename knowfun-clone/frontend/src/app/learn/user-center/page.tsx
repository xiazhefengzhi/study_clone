"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { User, Mail, Calendar, FileText, BookOpen, Eye, Heart, HardDrive, Coins } from 'lucide-react'

interface UserStats {
  documents_count: number
  courses_count: number
  public_courses_count: number
  points_balance: number
  storage_used: number
  storage_limit: number
  storage_used_percent: number
  total_views: number
  total_likes: number
}

export default function UserCenterPage() {
  const { user, refreshUser } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (user) {
      setUsername(user.username)
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getUserStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      await apiClient.updateUserProfile({ username })
      await refreshUser()
      setEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTierBadgeColor = (tier: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-500',
      basic: 'bg-blue-500',
      plus: 'bg-purple-500',
      pro: 'bg-yellow-500'
    }
    return colors[tier] || 'bg-gray-500'
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>请先登录</CardTitle>
            <CardDescription>您需要登录才能访问用户中心</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            👤 用户中心
          </h1>
          <p className="text-gray-600">
            管理您的账户和查看统计信息
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                个人资料
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>用户名</Label>
                {editing ? (
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-lg font-medium">{user.username}</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  邮箱
                </Label>
                <p className="mt-1 text-sm text-gray-600">{user.email}</p>
              </div>

              <div>
                <Label>订阅等级</Label>
                <div className="mt-1">
                  <Badge className={getTierBadgeColor(user.subscription_tier)}>
                    {user.subscription_tier.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  注册时间
                </Label>
                <p className="mt-1 text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>

              {editing ? (
                <div className="flex gap-2">
                  <Button onClick={handleUpdateProfile} className="flex-1">
                    保存
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setEditing(false)
                    setUsername(user.username)
                  }}>
                    取消
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setEditing(true)} className="w-full">
                  编辑资料
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Points and Storage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    积分余额
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {stats?.points_balance || 0}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">可用积分</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-blue-500" />
                    存储空间
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-sm text-gray-500">加载中...</div>
                  ) : stats ? (
                    <>
                      <div className="text-sm font-medium mb-2">
                        {formatBytes(stats.storage_used)} / {formatBytes(stats.storage_limit)}
                      </div>
                      <Progress value={stats.storage_used_percent} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        已使用 {stats.storage_used_percent.toFixed(1)}%
                      </p>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            {/* Content Stats */}
            <Card>
              <CardHeader>
                <CardTitle>内容统计</CardTitle>
                <CardDescription>您的创作数据</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                ) : stats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.documents_count}
                      </div>
                      <div className="text-sm text-gray-600">文档</div>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <BookOpen className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.courses_count}
                      </div>
                      <div className="text-sm text-gray-600">讲解</div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Eye className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {stats.total_views}
                      </div>
                      <div className="text-sm text-gray-600">浏览量</div>
                    </div>

                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <Heart className="h-6 w-6 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-600">
                        {stats.total_likes}
                      </div>
                      <div className="text-sm text-gray-600">点赞数</div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Public Content */}
            {stats && stats.public_courses_count > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>公开内容</CardTitle>
                  <CardDescription>在趣味广场展示的讲解</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {stats.public_courses_count}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    已发布 {stats.public_courses_count} 个讲解到广场
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
