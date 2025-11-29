"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Gift,
  Copy,
  Check,
  Users,
  Coins,
  Share2,
  Loader2,
  Crown,
  Sparkles
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/auth-context"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface ReferralStats {
  success_count: number
  total_points_earned: number
  recent_referrals: {
    id: number
    referee_name: string
    reward_points: number
    is_completed: boolean
    reward_status: string
    created_at: string
    completed_at: string | null
  }[]
}

export default function ReferralPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState("")
  const [referralLink, setReferralLink] = useState("")
  const [referrerReward, setReferrerReward] = useState(200)
  const [refereeReward, setRefereeReward] = useState(100)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)

  // 权限检查
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  // 获取推荐码
  const fetchReferralCode = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const res = await fetch(`${API_URL}/api/v1/referrals/code`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setReferralCode(data.referral_code)
        setReferralLink(data.referral_link)
        setReferrerReward(data.referrer_reward)
        setRefereeReward(data.referee_reward)
      }
    } catch (error) {
      console.error(error)
    }
  }, [])

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const res = await fetch(`${API_URL}/api/v1/referrals/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchReferralCode()
      fetchStats()
    }
  }, [user, fetchReferralCode, fetchStats])

  // 复制链接
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success("邀请链接已复制")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("复制失败")
    }
  }

  // 分享
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'XiaZheStudy AI 学习平台',
          text: `我正在使用 XiaZheStudy，邀请你一起来体验 AI 动画学习！使用我的邀请码 ${referralCode} 注册可获得 ${refereeReward} 积分奖励！`,
          url: referralLink
        })
      } catch {
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  // 认证加载中
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-[200px]">
        <div className="container max-w-4xl py-8 px-4 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">推荐有礼</h1>
            <p className="text-muted-foreground">
              邀请好友注册，双方都能获得积分奖励
            </p>
          </div>

          {/* Reward Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">您将获得</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {referrerReward} 积分
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">好友将获得</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {refereeReward} 积分
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Code Card */}
          <Card>
            <CardHeader>
              <CardTitle>我的邀请码</CardTitle>
              <CardDescription>
                分享邀请码或链接给好友，好友注册后双方都能获得积分
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Code Display */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={referralCode}
                    readOnly
                    className="text-center text-2xl font-mono font-bold tracking-widest h-14 bg-muted"
                  />
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-6"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Link Display */}
              <div className="flex items-center gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="text-sm text-muted-foreground"
                />
              </div>

              {/* Share Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  onClick={handleCopy}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  复制链接
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  分享给好友
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">成功邀请</div>
                    <div className="text-3xl font-bold">
                      {loading ? <Skeleton className="h-9 w-16" /> : stats?.success_count || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <Coins className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">累计获得积分</div>
                    <div className="text-3xl font-bold">
                      {loading ? <Skeleton className="h-9 w-20" /> : stats?.total_points_earned || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Referrals */}
          <Card>
            <CardHeader>
              <CardTitle>邀请记录</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : stats?.recent_referrals && stats.recent_referrals.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_referrals.map((ref) => (
                    <div
                      key={ref.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {ref.referee_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{ref.referee_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(ref.created_at).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={ref.is_completed ? "default" : "secondary"}>
                          {ref.is_completed ? "已完成" : "进行中"}
                        </Badge>
                        <div className="text-sm text-green-600 font-medium mt-1">
                          +{ref.reward_points} 积分
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>暂无邀请记录</p>
                  <p className="text-sm mt-1">快去邀请好友吧！</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle>如何邀请</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-xl font-bold text-purple-600">1</span>
                  </div>
                  <h4 className="font-medium">复制邀请码</h4>
                  <p className="text-sm text-muted-foreground">
                    复制您的专属邀请码或链接
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-xl font-bold text-purple-600">2</span>
                  </div>
                  <h4 className="font-medium">分享给好友</h4>
                  <p className="text-sm text-muted-foreground">
                    通过社交媒体或消息分享
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-xl font-bold text-purple-600">3</span>
                  </div>
                  <h4 className="font-medium">获得奖励</h4>
                  <p className="text-sm text-muted-foreground">
                    好友注册后双方都获得积分
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
