'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, Moon, Sun, Gift, Zap, User, LogOut, Menu } from 'lucide-react'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { useTheme } from 'next-themes'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/use-ui-store'
import { MobileNav } from '@/components/layout/mobile-nav'

const navItems = [
  { name: '首页', href: '/' },
  { name: '工作室', href: '/learn/course-creation' },
  { name: '内容广场', href: '/fun-square' },
  { name: '价格', href: '/pricing' },
]

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { user, supabaseUser, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { toggleMobileMenu } = useUIStore()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/sign-in')
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  const isSignedIn = !!user || !!supabaseUser

  return (
    <>
      <MobileNav />
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight hidden md:inline-block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                XiaZheStudy
              </span>
            </Link>
          </div>

          {/* 桌面端导航链接 */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-foreground',
                  pathname === item.href
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-2">
            {isSignedIn && (
              <>
                <Button variant="ghost" size="icon" className="text-purple-600 hidden md:flex">
                  <Gift className="h-5 w-5" />
                </Button>
                <div className="hidden md:flex">
                  <NotificationBell />
                </div>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Settings className="h-5 w-5" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <span className="text-sm font-medium text-white">
                      {user?.username?.charAt(0).toUpperCase() || supabaseUser?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                      <span className="text-sm font-medium text-white">
                        {user?.username?.charAt(0).toUpperCase() || supabaseUser?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.username || '用户'}</span>
                      <span className="text-xs text-muted-foreground">{supabaseUser?.email || ''}</span>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/user-center" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>个人中心</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/user-center" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>管理账户</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">登录</Button>
                </Link>
                <Link href="/sign-up">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
                      免费开始
                    </Button>
                  </motion.div>
                </Link>
              </div>
            )}

            {/* 移动端菜单触发器 */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.header>
    </>
  )
}