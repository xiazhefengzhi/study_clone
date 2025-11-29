'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { SUBSCRIPTION_TIERS, formatBytes, getStorageLimit, getPointsLimit } from "@/lib/subscription-config"
import {
  User,
  Mail,
  Camera,
  FileText,
  BookOpen,
  Download,
  Zap,
  Settings,
  Crown,
  Loader2
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function UserCenterPage() {
  const router = useRouter()
  const { user, supabaseUser, loading: authLoading, refreshUser } = useAuth()

  // 权限检查：未登录用户重定向到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [username, setUsername] = useState(user?.username || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get subscription info
  const tierKey = (user?.subscription_tier || 'free') as keyof typeof SUBSCRIPTION_TIERS
  const tierInfo = SUBSCRIPTION_TIERS[tierKey]
  const storageLimit = getStorageLimit(tierKey)
  const pointsLimit = getPointsLimit(tierKey)

  // 从 API 获取统计数据
  const [stats, setStats] = useState({
    documents: 0,
    courses: 0,
    exports: 0,
    totalViews: 0
  })

  useEffect(() => {
    // 获取用户统计数据
    const fetchStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return

        const res = await fetch(`${API_URL}/api/v1/users/me/stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setStats({
            documents: data.documents_count || 0,
            courses: data.courses_count || 0,
            exports: 0, // 可以后续添加导出统计
            totalViews: data.total_views || 0
          })
        }
      } catch {
        setStats({ documents: 0, courses: 0, exports: 0, totalViews: 0 })
      }
    }
    if (user) fetchStats()
  }, [user])

  // 头像上传处理
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        toast.error('请先登录')
        return
      }

      // 1. 上传头像图片
      const uploadRes = await fetch(`${API_URL}/api/v1/upload/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('上传失败')

      const uploadData = await uploadRes.json()
      const avatarUrl = uploadData.url

      // 2. 更新用户头像URL
      const updateRes = await fetch(`${API_URL}/api/v1/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      })
      if (!updateRes.ok) throw new Error('更新头像失败')

      toast.success('头像上传成功')
      // 刷新用户数据
      refreshUser()
    } catch {
      toast.error('头像上传失败')
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/v1/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      if (!res.ok) throw new Error('保存失败')
      toast.success('保存成功')
      setIsEditing(false)
    } catch {
      toast.error('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 认证加载中或未登录时显示加载状态
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header Card */}
      <Card className="mb-8 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500" />
        <CardContent className="relative -mt-16 pb-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary rounded-full hover:opacity-90 transition-opacity"
              >
                <Camera className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl font-bold">{user?.username || '用户'}</h1>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
                  <Crown className="h-3 w-3 mr-1" />
                  {tierInfo.name}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-4 w-4" />
                {supabaseUser?.email}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.documents}</div>
                <div className="text-xs text-muted-foreground">文档</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.courses}</div>
                <div className="text-xs text-muted-foreground">动画</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.exports}</div>
                <div className="text-xs text-muted-foreground">导出</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.totalViews}</div>
                <div className="text-xs text-muted-foreground">浏览</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="profile">个人信息</TabsTrigger>
          <TabsTrigger value="subscription">订阅管理</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  使用统计
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>积分余额</span>
                    <span className="font-medium">{user?.points_balance || 0} / {pointsLimit}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all"
                      style={{ width: `${((user?.points_balance || 0) / pointsLimit) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>存储空间</span>
                    <span className="font-medium">
                      {formatBytes(user?.storage_used || 0)} / {formatBytes(storageLimit)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                      style={{ width: `${((user?.storage_used || 0) / storageLimit) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  快捷操作
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button variant="outline" className="justify-start" onClick={() => router.push('/learn/my-document')}>
                  <FileText className="h-4 w-4 mr-2" />
                  管理文档
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => router.push('/learn/my-courses')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  我的动画
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => router.push('/exports')}>
                  <Download className="h-4 w-4 mr-2" />
                  导出记录
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>个人信息</CardTitle>
              <CardDescription>更新您的个人资料和联系信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={supabaseUser?.email || ''}
                  disabled
                />
                <p className="text-xs text-muted-foreground">邮箱不可修改</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">头像 URL</Label>
                <Input
                  id="avatar"
                  type="url"
                  value={user?.avatar_url || ''}
                  disabled={!isEditing}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        '保存更改'
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                      取消
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>编辑资料</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>订阅管理</CardTitle>
              <CardDescription>查看和管理您的订阅计划</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{tierInfo.name}</h3>
                    <p className="opacity-90">当前订阅</p>
                  </div>
                  <Crown className="h-12 w-12 opacity-80" />
                </div>
                <div className="space-y-2 opacity-90">
                  {tierInfo.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-white rounded-full" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                  onClick={() => router.push('/pricing')}
                >
                  升级方案
                </Button>
                {tierKey !== 'free' && (
                  <Button variant="outline" className="flex-1">
                    取消订阅
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
