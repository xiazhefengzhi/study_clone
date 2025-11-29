/** Sign Up Page */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Mail, Loader2, Gift } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function SignUpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp, user, supabaseUser, loading: authLoading } = useAuth()

  // 从 URL 获取推荐码
  const refCode = searchParams.get('ref') || ''

  // 所有 useState 必须在条件返回之前声明
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: refCode,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isUserExist, setIsUserExist] = useState(false)
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // 已登录用户重定向到首页（使用 supabaseUser 因为它更早被设置）
  useEffect(() => {
    if (supabaseUser) {
      router.replace('/')
    }
  }, [supabaseUser, router])

  // 当 URL 参数变化时更新推荐码
  useEffect(() => {
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }))
    }
  }, [refCode])

  // 应用推荐码
  const applyReferralCode = async (code: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token || !code) return

      const res = await fetch(`${API_URL}/api/v1/referrals/apply?referral_code=${encodeURIComponent(code)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        console.log('Referral code applied successfully')
      }
    } catch (error) {
      console.error('Failed to apply referral code:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsUserExist(false)
    setRequiresEmailVerification(false)

    // Validate username
    if (!formData.username || formData.username.trim().length < 2) {
      setError('用户名至少需要 2 个字符')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址')
      return
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('密码至少需要 8 个字符')
      return
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)

    try {
      const result = await signUp(formData.email, formData.password, formData.username.trim())

      if (result.requiresEmailVerification) {
        // Show email verification message
        setRequiresEmailVerification(true)
        setSuccessMessage(result.message)
        // 保存推荐码，首次登录后应用
        if (formData.referralCode) {
          localStorage.setItem('pending_referral_code', formData.referralCode)
        }
      } else {
        // Direct login - apply referral code if present
        if (formData.referralCode) {
          await applyReferralCode(formData.referralCode)
        }
        // Redirect to user center
        router.push('/learn/user-center')
      }
    } catch (err) {
      let errorMessage = '注册失败，请稍后重试'

      if (err instanceof Error) {
        const msg = err.message.toLowerCase()

        if (msg.includes('already been registered') || msg.includes('user already exists') || msg.includes('already registered') || msg.includes('已被注册')) {
          errorMessage = '该邮箱已被注册，请直接登录'
          setIsUserExist(true)
        } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('handshake')) {
          errorMessage = '网络连接异常，请检查您的网络后重试'
        } else if (msg.includes('invalid email')) {
          errorMessage = '邮箱格式不正确'
        } else if (msg.includes('password')) {
          errorMessage = '密码不符合要求，请使用至少8位密码'
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 已登录用户或加载中显示 loading
  if (authLoading || supabaseUser || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show email verification success screen
  if (requiresEmailVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              请验证您的邮箱
            </CardTitle>
            <CardDescription className="text-base">
              {successMessage || '我们已向您的邮箱发送了验证链接'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-2">下一步：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>打开您的邮箱 <span className="font-medium">{formData.email}</span></li>
                <li>点击验证邮件中的链接</li>
                <li>验证完成后即可登录</li>
              </ol>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              没有收到邮件？请检查垃圾邮件文件夹
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/sign-in" className="w-full">
              <Button variant="outline" className="w-full">
                返回登录
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            创建账户
          </CardTitle>
          <CardDescription className="text-center">
            开始使用 XiaZheStudy AI 学习平台
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant={isUserExist ? "default" : "destructive"}>
                <AlertDescription>
                  {error}
                  {isUserExist && (
                    <Link
                      href="/sign-in"
                      className="ml-2 text-primary hover:underline font-medium"
                    >
                      立即登录
                    </Link>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="John Doe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少 8 个字符"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            {/* 推荐码输入框 */}
            <div className="space-y-2">
              <Label htmlFor="referralCode" className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-purple-500" />
                推荐码 (可选)
              </Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="输入好友的推荐码"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                disabled={loading}
                className={formData.referralCode ? "border-purple-300 bg-purple-50/50" : ""}
              />
              {formData.referralCode && (
                <p className="text-xs text-purple-600">
                  注册成功后，您和您的好友都将获得积分奖励！
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              已有账户？{' '}
              <Link
                href="/sign-in"
                className="text-primary hover:underline font-medium"
              >
                立即登录
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
