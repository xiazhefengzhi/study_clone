'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  Zap
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { SUBSCRIPTION_TIERS, formatBytes, getStorageLimit, getPointsLimit } from '@/lib/subscription-config'

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Get subscription tier info
  const tierKey = (user?.subscription_tier || 'free') as keyof typeof SUBSCRIPTION_TIERS
  const tierInfo = SUBSCRIPTION_TIERS[tierKey]
  const storageLimit = getStorageLimit(tierKey)
  const pointsLimit = getPointsLimit(tierKey)
  const storageUsed = user?.storage_used || 0

  const navItems = [
    { href: '/fun-square', icon: Compass, label: '内容广场' },
    { href: '/learn/course-creation', icon: Wand2, label: '讲解制作', highlight: true },
    { href: '/learn/my-document', icon: FileText, label: '我的文档' },
    { href: '/learn/my-courses', icon: BookOpen, label: '我的讲解' },
    { href: '/exports', icon: Download, label: '导出任务' },
  ]

  const bottomItems = [
    { icon: Bell, label: '消息中心', href: '/notifications' },
    { icon: User, label: '用户中心', href: '/user-center' },
    { icon: Gift, label: '推荐有礼', href: '/referral' },
    { icon: Globe, label: '语言切换', href: '/settings/language' },
  ]

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[200px] border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-xl font-bold text-transparent">
            KnowFun
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : item.highlight
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:opacity-90'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Status */}
        <div className="border-t p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {tierInfo.name}
            </span>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>积分使用情况</span>
              <span>{user?.points_balance || 0} / {pointsLimit}</span>
            </div>
            <div className="flex justify-between">
              <span>存储使用情况</span>
              <span>{formatBytes(storageUsed)} / {formatBytes(storageLimit)}</span>
            </div>
          </div>
          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
            升级
          </Button>
        </div>

        {/* Bottom Actions */}
        <div className="border-t p-2">
          {bottomItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}
