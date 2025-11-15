'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Settings, Moon, Sun, Gift, Zap, User, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/contexts/auth-context'

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { user, supabaseUser, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/sign-in')
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-xl font-bold text-transparent">
            KnowFun
          </span>
        </Link>

        {/* Center Navigation */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/learn/course-creation"
            className="transition-colors hover:text-foreground/80 text-foreground"
          >
            工作室
          </Link>
          <Link
            href="/fun-square"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            内容广场
          </Link>
          <Link
            href="/pricing"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            价格
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-purple-600">
            <Gift className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 hover:opacity-90 transition-opacity cursor-pointer">
                <span className="text-sm font-medium text-white">
                  {user?.username?.charAt(0).toUpperCase() || supabaseUser?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {/* User Info */}
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

              {/* Menu Items */}
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/user-center" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>管理账户</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/user-center" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>个人中心</span>
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
        </div>
      </div>
    </header>
  )
}
