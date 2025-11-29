"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-client'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { User as UserIcon, Mail, Calendar, FileText, BookOpen, Eye, Heart, HardDrive, Coins, Plus, FolderOpen, Globe, PenTool, Save, X, Settings, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
}

export default function UserCenterPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      setUsername(user.username || '') // Ensure username is not null
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await apiClient.request<UserStats>('/api/v1/users/me/stats')
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
      toast.error('无法加载用户统计数据')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user || username === user.username) {
      setEditing(false);
      return;
    }
    try {
      await apiClient.request('/api/v1/users/me', {
        method: 'PUT',
        body: JSON.stringify({ username })
      })
      await refreshUser()
      setEditing(false)
      toast.success('用户名更新成功！')
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('更新失败，请重试')
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
      free: 'bg-gray-500/10 text-gray-700 border-gray-200',
      basic: 'bg-blue-500/10 text-blue-700 border-blue-200',
      plus: 'bg-purple-500/10 text-purple-700 border-purple-200',
      pro: 'bg-amber-500/10 text-amber-700 border-amber-200'
    }
    return colors[tier] || 'bg-gray-500/10 text-gray-700 border-gray-200'
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={itemVariants} className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            我的个人中心
          </h1>
          <p className="text-muted-foreground text-lg">
            管理您的账户资料和查看您的学习数据概览
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial="hidden" animate="visible" variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Button
            onClick={() => router.push('/learn/course-creation')}
            className="h-auto py-5 flex flex-col gap-2 rounded-xl border-2 hover:shadow-lg transition-all bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 hover:text-purple-700"
            variant="outline"
          >
            <Plus className="h-7 w-7" />
            <span className="text-base font-semibold">创建新动画</span>
          </Button>
          <Button
            onClick={() => router.push('/learn/my-courses')}
            className="h-auto py-5 flex flex-col gap-2 rounded-xl border-2 hover:shadow-lg transition-all bg-blue-500/10 text-blue-600 hover:text-blue-700"
            variant="outline"
          >
            <FolderOpen className="h-7 w-7" />
            <span className="text-base font-semibold">我的动画库</span>
          </Button>
          <Button
            onClick={() => router.push('/fun-square')} // Assuming fun-square is for explore
            className="h-auto py-5 flex flex-col gap-2 rounded-xl border-2 hover:shadow-lg transition-all bg-green-500/10 text-green-600 hover:text-green-700"
            variant="outline"
          >
            <Globe className="h-7 w-7" />
            <span className="text-base font-semibold">探索广场</span>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div initial="hidden" animate="visible" variants={itemVariants} className="lg:col-span-1">
            <Card className="h-full rounded-2xl border-2 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-lg shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <UserIcon className="h-6 w-6 text-purple-600" />
                  个人资料
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setEditing(!editing)}>
                  {editing ? <X className="h-5 w-5" /> : <PenTool className="h-5 w-5" />}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="username" className="text-muted-foreground text-sm">用户名</Label>
                  {editing ? (
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-2 text-lg font-medium border-purple-300 focus:ring-purple-500"
                    />
                  ) : (
                    <p className="mt-2 text-xl font-semibold text-foreground">{user.username}</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">邮箱</Label>
                  <p className="mt-2 text-base text-foreground">{user.email}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">订阅等级</Label>
                  <div className="mt-2">
                    <Badge className={cn("text-base font-semibold py-1.5 px-3", getTierBadgeColor(user.subscription_tier))}>
                      {user.subscription_tier.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">注册时间</Label>
                  <p className="mt-2 text-base text-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>

                {editing && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleUpdateProfile} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
                      <Save className="h-4 w-4 mr-2" /> 保存
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setEditing(false)
                      setUsername(user.username)
                    }} className="flex-1">
                      <X className="h-4 w-4 mr-2" /> 取消
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 space-y-8">
            {/* Points and Storage */}
            <motion.div initial="hidden" animate="visible" variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl border-2 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-lg shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Coins className="h-5 w-5 text-amber-500" />
                    积分余额
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl font-extrabold text-amber-600 drop-shadow-md"
                  >
                    {stats?.points_balance || 0}
                  </motion.div>
                  <p className="text-sm text-muted-foreground mt-2">可用于动画生成</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-lg shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-cyan-500" />
                    存储空间
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-sm text-muted-foreground">加载中...</div>
                  ) : stats ? (
                    <>
                      <div className="text-lg font-medium mb-3 text-foreground">
                        {formatBytes(stats.storage_used)} / {formatBytes(stats.storage_limit)}
                      </div>
                      <Progress value={stats.storage_used_percent} className="h-2.5 rounded-full bg-secondary/50" indicatorClassName="bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md" />
                      <p className="text-xs text-muted-foreground mt-2">
                        已使用 {stats.storage_used_percent.toFixed(1)}%
                      </p>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>

            {/* Content Stats */}
            <motion.div initial="hidden" animate="visible" variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="rounded-2xl border-2 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-lg shadow-xl text-center p-4">
                <CardContent className="space-y-2 p-0">
                  <FileText className="h-7 w-7 text-blue-600 mx-auto" />
                  <div className="text-3xl font-bold text-blue-600">{stats?.documents_count || 0}</div>
                  <div className="text-sm text-muted-foreground">文档</div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-lg shadow-xl text-center p-4">
                <CardContent className="space-y-2 p-0">
                  <BookOpen className="h-7 w-7 text-purple-600 mx-auto" />
                  <div className="text-3xl font-bold text-purple-600">{stats?.courses_count || 0}</div>
                  <div className="text-sm text-muted-foreground">动画</div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-lg shadow-xl text-center p-4">
                <CardContent className="space-y-2 p-0">
                  <Eye className="h-7 w-7 text-green-600 mx-auto" />
                  <div className="text-3xl font-bold text-green-600">{stats?.total_views || 0}</div>
                  <div className="text-sm text-muted-foreground">浏览量</div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-lg shadow-xl text-center p-4">
                <CardContent className="space-y-2 p-0">
                  <Heart className="h-7 w-7 text-rose-600 mx-auto" />
                  <div className="text-3xl font-bold text-rose-600">{stats?.total_likes || 0}</div>
                  <div className="text-sm text-muted-foreground">点赞数</div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Public Content - Always show, even if 0 */}
            <motion.div initial="hidden" animate="visible" variants={itemVariants}>
                <Card className="rounded-2xl border-2 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-lg shadow-xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="h-5 w-5 text-emerald-500" />
                            公开动画
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-emerald-600 drop-shadow-md">
                            {stats?.public_courses_count || 0}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            已发布到内容广场的动画数量
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}