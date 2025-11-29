'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Gift, Sparkles, Crown, Loader2, PartyPopper, Coins, Calendar } from "lucide-react"
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-config"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import confetti from 'canvas-confetti'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// 套餐图标映射
const TIER_ICONS: Record<string, React.ElementType> = {
  basic: Sparkles,
  plus: Crown,
  pro: Crown,
}

// 套餐颜色映射
const TIER_COLORS: Record<string, string> = {
  basic: "from-blue-500 to-cyan-500",
  plus: "from-yellow-500 to-orange-500",
  pro: "from-purple-600 to-pink-600",
}

// 套餐按钮颜色
const TIER_BUTTON_COLORS: Record<string, string> = {
  basic: "bg-gradient-to-r from-blue-500 to-cyan-500",
  plus: "bg-gradient-to-r from-yellow-500 to-orange-500",
  pro: "bg-gradient-to-r from-purple-600 to-pink-600",
}

export default function PricingPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()

  // 激活码弹窗状态
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [activationCode, setActivationCode] = useState('')
  const [isActivating, setIsActivating] = useState(false)

  // 成功弹窗状态
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [activationResult, setActivationResult] = useState<{
    tier: string
    tierName: string
    pointsAdded: number
    durationDays: number
    expiresAt: string
  } | null>(null)

  // 打开激活码输入弹窗
  const handleOpenActivateDialog = (tierKey: string) => {
    if (!user) {
      toast.error("请先登录")
      router.push('/sign-in?redirect=/pricing')
      return
    }
    setSelectedTier(tierKey)
    setActivationCode('')
    setShowActivateDialog(true)
  }

  // 激活码激活
  const handleActivate = async () => {
    if (!activationCode.trim()) {
      toast.error("请输入激活码")
      return
    }

    if (!user) {
      toast.error("请先登录")
      router.push('/sign-in?redirect=/pricing')
      return
    }

    setIsActivating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        toast.error("请先登录")
        return
      }

      const res = await fetch(`${API_URL}/api/v1/activation-codes/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: activationCode.trim(), tier: selectedTier }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.detail || "激活失败")
        return
      }

      // 关闭输入弹窗
      setShowActivateDialog(false)

      // 激活成功
      setActivationResult({
        tier: data.tier,
        tierName: data.tier_name,
        pointsAdded: data.points_added,
        durationDays: data.duration_days,
        expiresAt: data.expires_at,
      })
      setShowSuccessDialog(true)
      setActivationCode('')

      // 刷新用户数据
      await refreshUser()

      // 触发彩带效果
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

    } catch (error) {
      console.error("Activation error:", error)
      toast.error("激活失败，请重试")
    } finally {
      setIsActivating(false)
    }
  }

  const tiers = [
    { key: 'free', recommended: false, badge: null },
    { key: 'basic', recommended: true, badge: '推荐' },
    { key: 'plus', recommended: false, badge: '最受欢迎' },
    { key: 'pro', recommended: false, badge: null },
  ]

  // 获取选中套餐的信息
  const selectedTierInfo = selectedTier ? SUBSCRIPTION_TIERS[selectedTier as keyof typeof SUBSCRIPTION_TIERS] : null

  return (
    <main className="min-h-screen py-20 bg-gradient-to-b from-purple-50/30 via-white to-white dark:from-purple-950/10 dark:via-background dark:to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold">选择适合您的方案</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            从免费体验到企业级解决方案，我们为不同需求的用户提供灵活的价格选择
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {tiers.map(({ key, recommended, badge }) => {
            const tier = SUBSCRIPTION_TIERS[key as keyof typeof SUBSCRIPTION_TIERS]
            const isFree = key === 'free'
            const isPlus = key === 'plus'
            const isCurrentPlan = user?.subscription_tier === key

            return (
              <Card
                key={key}
                className={`relative ${
                  isPlus
                    ? 'border-2 border-yellow-500 shadow-xl scale-105'
                    : recommended
                    ? 'border-2 border-blue-500 shadow-lg'
                    : 'border-2'
                }`}
              >
                {badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge
                      className={`${
                        isPlus
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white px-4 py-1`}
                    >
                      {badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-6">
                  <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                  <CardDescription>
                    {isFree && '免费体验基础功能'}
                    {key === 'basic' && '个人用户的最佳选择'}
                    {key === 'plus' && '专业用户的理想选择'}
                    {key === 'pro' && '企业级用户首选'}
                  </CardDescription>

                  <div className="mt-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">${tier.price}</span>
                      {!isFree && <span className="text-muted-foreground">/月</span>}
                    </div>
                    {!isFree && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {key === 'basic' && (
                          <>
                            <span className="line-through">原价$12.99</span>
                            <span className="text-green-600 ml-2">Save 25%</span>
                            <div>按月付费仅 $0.31/天</div>
                          </>
                        )}
                        {key === 'plus' && (
                          <>
                            <span className="line-through">原价$29.99</span>
                            <span className="text-green-600 ml-2">Save 35%</span>
                            <div>按月付费仅 $0.63/天</div>
                          </>
                        )}
                        {key === 'pro' && (
                          <>
                            <span className="line-through">原价$84.99</span>
                            <span className="text-green-600 ml-2">Save 40%</span>
                            <div>按月付费仅 $1.61/天</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button - 点击弹出激活码输入框 */}
                  <Button
                    className={`w-full mt-6 ${
                      isPlus
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90'
                        : recommended
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90'
                        : isFree
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:opacity-90'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90'
                    }`}
                    onClick={() => !isFree && handleOpenActivateDialog(key)}
                    disabled={isFree || isCurrentPlan}
                  >
                    {isCurrentPlan ? '当前方案' : isFree ? '免费方案' : '立即升级'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-20 text-center">
          <p className="text-sm text-muted-foreground">
            所有方案都支持随时取消 • 安全支付 • 7天无理由退款
          </p>
        </div>
      </div>

      {/* 激活码输入弹窗 */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className={`mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br ${selectedTier ? TIER_COLORS[selectedTier] || 'from-purple-500 to-pink-500' : 'from-purple-500 to-pink-500'} flex items-center justify-center`}>
              <Gift className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl text-center">
              激活 {selectedTierInfo?.name || ''} 套餐
            </DialogTitle>
            <DialogDescription className="text-center">
              请输入您的激活码来升级到 {selectedTierInfo?.name || ''} 套餐
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="activation-code">激活码</Label>
              <Input
                id="activation-code"
                placeholder="请输入激活码，如：XIAZHE888"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                className="text-center font-mono text-lg tracking-widest uppercase"
                disabled={isActivating}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              测试激活码：BASIC2024、PLUS2024、PRO2024、XIAZHE888
            </p>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowActivateDialog(false)}
              disabled={isActivating}
            >
              取消
            </Button>
            <Button
              className={`flex-1 ${selectedTier ? TIER_BUTTON_COLORS[selectedTier] || 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'} hover:opacity-90`}
              onClick={handleActivate}
              disabled={isActivating || !activationCode.trim()}
            >
              {isActivating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  激活中
                </>
              ) : (
                '立即激活'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 激活成功弹窗 */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-bounce">
              <PartyPopper className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl text-center">
              🎉 激活成功！
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              恭喜您成功激活会员订阅
            </DialogDescription>
          </DialogHeader>

          {activationResult && (
            <div className="space-y-4 py-4">
              {/* 套餐信息卡片 */}
              <div className={`p-4 rounded-xl bg-gradient-to-r ${TIER_COLORS[activationResult.tier] || 'from-purple-500 to-pink-500'} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {TIER_ICONS[activationResult.tier] && (
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        {(() => {
                          const Icon = TIER_ICONS[activationResult.tier]
                          return <Icon className="h-5 w-5" />
                        })()}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-lg">{activationResult.tierName}</div>
                      <div className="text-sm opacity-90">已激活</div>
                    </div>
                  </div>
                  <Check className="h-8 w-8" />
                </div>
              </div>

              {/* 详情信息 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                  <Coins className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-bold text-blue-600">
                    +{activationResult.pointsAdded.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">积分已到账</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <div className="text-lg font-bold text-green-600">
                    {activationResult.durationDays} 天
                  </div>
                  <div className="text-xs text-muted-foreground">会员时长</div>
                </div>
              </div>

              {/* 到期时间 */}
              <div className="text-center text-sm text-muted-foreground">
                会员有效期至：{new Date(activationResult.expiresAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowSuccessDialog(false)}
            >
              继续浏览
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              onClick={() => {
                setShowSuccessDialog(false)
                router.push('/learn/user-center')
              }}
            >
              查看我的账户
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
