'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Compass,
  Wand2,
  FileText,
  BookOpen,
  Download,
  Bell,
  User,
  Gift,
  Globe,
  Zap,
  LogOut,
  Crown
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { SUBSCRIPTION_TIERS, formatBytes, getStorageLimit, getPointsLimit } from '@/lib/subscription-config'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  // 获取未读消息数
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return

        const res = await fetch(`${API_URL}/api/v1/messages/unread-count`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unread_count || 0)
        }
      } catch (error) {
        console.error("Failed to fetch unread count", error)
      }
    }

    // 监听消息已读事件，实时更新未读数
    const handleNotificationRead = () => {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }

    if (user) {
      fetchUnreadCount()
      const timer = setInterval(fetchUnreadCount, 30000)

      // 添加事件监听
      window.addEventListener('notification-read', handleNotificationRead)

      return () => {
        clearInterval(timer)
        window.removeEventListener('notification-read', handleNotificationRead)
      }
    }
  }, [user])

  // Get subscription tier info
  let tierKey = (user?.subscription_tier || 'free') as keyof typeof SUBSCRIPTION_TIERS
  if (!SUBSCRIPTION_TIERS[tierKey]) {
    tierKey = 'free'
  }
  const tierInfo = SUBSCRIPTION_TIERS[tierKey]
  const storageLimit = getStorageLimit(tierKey)
  const pointsLimit = getPointsLimit(tierKey)
  const storageUsed = user?.storage_used || 0
  const pointsUsed = user?.points_balance || 0
  
  // Calculate percentages
  const pointsPercentage = Math.min(100, (pointsUsed / pointsLimit) * 100)
  const storagePercentage = Math.min(100, (storageUsed / storageLimit) * 100)

  const navItems = [
    { href: '/fun-square', icon: Compass, label: '内容广场' },
    { href: '/learn/course-creation', icon: Wand2, label: '创作工作室', highlight: true },
    { href: '/learn/my-document', icon: FileText, label: '我的文档' },
    { href: '/learn/my-courses', icon: BookOpen, label: '我的动画' },
    { href: '/exports', icon: Download, label: '导出任务' },
  ]

  const bottomItems = [
    { icon: Bell, label: '消息中心', href: '/notifications' },
    { icon: User, label: '用户中心', href: '/user-center' },
    { icon: Gift, label: '推荐有礼', href: '/referral' },
  ]

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-[240px] flex-col bg-background/80 backdrop-blur-xl border-r border-border/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-border/40">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/20 transition-transform group-hover:scale-110">
            <Zap className="h-6 w-6 text-white" />
            <div className="absolute inset-0 rounded-xl bg-white/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-lg font-bold text-transparent">
              XiaZheStudy
            </span>
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">AI Learning</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-none">
        <div className="text-xs font-semibold text-muted-foreground/50 px-2 mb-2 uppercase tracking-wider">Menu</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative group block"
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                item.highlight && !isActive && 'text-foreground font-semibold'
              )}>
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isActive ? "bg-purple-500/10" : "bg-transparent group-hover:bg-secondary"
                )}>
                  <item.icon className={cn("h-4 w-4", isActive && "fill-current")} />
                </div>
                {item.label}
                {item.highlight && (
                    <span className="ml-auto flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-pink-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                    </span>
                )}
              </div>
            </Link>
          )
        })}

        <div className="mt-8 text-xs font-semibold text-muted-foreground/50 px-2 mb-2 uppercase tracking-wider">Settings</div>
        {bottomItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <div className="relative">
              <item.icon className="h-4 w-4" />
              {item.href === '/notifications' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </div>
            <span className="flex-1">{item.label}</span>
            {item.href === '/notifications' && unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Link>
        ))}
      </div>

      {/* Subscription Status Card */}
      <div className="p-4 border-t border-border/40 bg-gradient-to-b from-transparent to-secondary/10">
        <div className={cn(
          "rounded-2xl border p-4 shadow-sm space-y-4",
          tierKey === 'pro' ? "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800" :
          tierKey === 'plus' ? "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800" :
          tierKey === 'basic' ? "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800" :
          "bg-card border-border/50"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-lg",
                tierKey === 'pro' ? "bg-purple-100 dark:bg-purple-900/50 text-purple-600" :
                tierKey === 'plus' ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600" :
                tierKey === 'basic' ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600" :
                "bg-gray-100 dark:bg-gray-800 text-gray-600"
              )}>
                <Crown className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm">{tierInfo.name}</span>
            </div>
            <Badge className={cn(
              "text-[10px] px-1.5 h-5",
              tierKey === 'pro' ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0" :
              tierKey === 'plus' ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0" :
              tierKey === 'basic' ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0" :
              "bg-gray-100 dark:bg-gray-800 text-gray-600 border-gray-200"
            )}>
              {tierKey === 'free' ? '免费版' : tierKey === 'basic' ? 'Basic' : tierKey === 'plus' ? 'Plus' : 'Pro'}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Credits</span>
                <span>{Math.round(pointsPercentage)}%</span>
              </div>
              <Progress
                value={pointsPercentage}
                className="h-1.5 bg-secondary"
                indicatorClassName={cn(
                  "bg-gradient-to-r",
                  tierKey === 'pro' ? "from-purple-500 to-pink-500" :
                  tierKey === 'plus' ? "from-yellow-500 to-orange-500" :
                  tierKey === 'basic' ? "from-blue-500 to-cyan-500" :
                  "from-gray-400 to-gray-500"
                )}
              />
              <div className="text-[10px] text-muted-foreground text-right">
                {pointsUsed.toLocaleString()} / {pointsLimit.toLocaleString()}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Storage</span>
                <span>{Math.round(storagePercentage)}%</span>
              </div>
              <Progress
                value={storagePercentage}
                className="h-1.5 bg-secondary"
                indicatorClassName={cn(
                  "bg-gradient-to-r",
                  tierKey === 'pro' ? "from-purple-500 to-pink-500" :
                  tierKey === 'plus' ? "from-yellow-500 to-orange-500" :
                  tierKey === 'basic' ? "from-blue-500 to-cyan-500" :
                  "from-gray-400 to-gray-500"
                )}
              />
            </div>
          </div>

          {tierKey === 'pro' ? (
            <div className="text-center text-[10px] text-purple-600 dark:text-purple-400 font-medium py-1">
              🎉 已解锁全部特权
            </div>
          ) : (
            <Link href="/pricing" className="w-full">
              <Button
                size="sm"
                className={cn(
                  "w-full text-xs h-8 shadow-lg",
                  tierKey === 'plus' ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90" :
                  tierKey === 'basic' ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:opacity-90" :
                  "bg-foreground text-background hover:bg-foreground/90"
                )}
              >
                升级套餐
              </Button>
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}