'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, LogOut, Settings, User, Compass, Wand2, FileText, BookOpen, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useUIStore } from '@/stores/use-ui-store'
import { useEffect } from 'react'

const navItems = [
  { href: '/fun-square', icon: Compass, label: '内容广场' },
  { href: '/learn/course-creation', icon: Wand2, label: '动画制作' },
  { href: '/learn/my-document', icon: FileText, label: '我的文档' },
  { href: '/learn/my-courses', icon: BookOpen, label: '我的动画' },
  { href: '/exports', icon: Download, label: '导出任务' },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore()

  // Close menu on route change
  useEffect(() => {
    closeMobileMenu()
  }, [pathname, closeMobileMenu])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-[300px] border-l bg-background shadow-xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold">XiaZheStudy</span>
                </div>
                <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-2 space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>

                {user && (
                  <div className="mt-6 px-4">
                    <div className="rounded-lg border p-4 bg-muted/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.username}</p>
                          <p className="text-xs text-muted-foreground">Basic Plan</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Link href="/user-center">
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <User className="mr-2 h-4 w-4" />
                            个人中心
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t p-4 space-y-2">
                {user ? (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      signOut()
                      closeMobileMenu()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/sign-in">
                      <Button variant="outline" className="w-full">登录</Button>
                    </Link>
                    <Link href="/sign-up">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">注册</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
