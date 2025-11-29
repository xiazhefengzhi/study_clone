"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Bell,
  Check,
  CheckCheck,
  MailOpen,
  Loader2,
  Sparkles,
  AlertCircle,
  Gift,
  Info
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/auth-context"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Message {
  id: number
  title: string
  content: string
  message_type: string
  is_read: boolean
  related_course_id: number | null
  created_at: string
  read_at: string | null
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // 权限检查
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  // 获取消息列表
  const fetchMessages = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setLoading(false)
        return
      }

      const res = await fetch(`${API_URL}/api/v1/messages/?page=1&page_size=50`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (!res.ok) throw new Error("获取消息失败")

      const data = await res.json()
      setMessages(data.messages || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error(error)
      toast.error("加载消息失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchMessages()
    }
  }, [user, fetchMessages])

  // 标记单条为已读
  const handleMarkAsRead = async (messageId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const res = await fetch(`${API_URL}/api/v1/messages/${messageId}/read`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (!res.ok) throw new Error("标记失败")

      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, is_read: true } : m
      ))

      // 触发全局事件通知其他组件更新未读数
      window.dispatchEvent(new CustomEvent('notification-read'))
    } catch (error) {
      toast.error("操作失败")
    }
  }

  // 全部标记为已读
  const handleMarkAllAsRead = async () => {
    const unreadMessages = messages.filter(m => !m.is_read)
    for (const msg of unreadMessages) {
      await handleMarkAsRead(msg.id)
    }
    toast.success("已全部标记为已读")
  }

  // 获取消息类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "animation_success":
        return <Sparkles className="h-5 w-5 text-green-500" />
      case "animation_failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "credit_added":
        return <Gift className="h-5 w-5 text-purple-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
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

  const unreadCount = messages.filter(m => !m.is_read).length

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-[200px]">
        <div className="container max-w-3xl py-8 px-4 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Bell className="h-8 w-8" />
                消息中心
              </h1>
              <p className="text-muted-foreground mt-1">
                共 {total} 条消息，{unreadCount} 条未读
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                全部已读
              </Button>
            )}
          </div>

          {/* Message List */}
          <div className="space-y-3">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </>
            ) : messages.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <MailOpen className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">暂无消息</p>
                    <p className="text-sm mt-1">当您有新动态时，会在这里收到通知</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              messages.map((msg) => (
                <Card
                  key={msg.id}
                  className={cn(
                    "hover:shadow-md transition-all relative overflow-hidden cursor-pointer",
                    !msg.is_read
                      ? "border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10"
                      : "opacity-75"
                  )}
                  onMouseEnter={() => {
                    if (!msg.is_read) handleMarkAsRead(msg.id)
                  }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        !msg.is_read ? "bg-red-100 dark:bg-red-900/30" : "bg-muted"
                      )}>
                        {getTypeIcon(msg.message_type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={cn(
                              "flex items-center gap-2",
                              !msg.is_read ? "font-semibold" : "font-normal text-muted-foreground"
                            )}>
                              {msg.title}
                              {!msg.is_read && (
                                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {msg.content}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(msg.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>

                        {/* Actions */}
                        {msg.related_course_id && (
                          <div className="mt-3">
                            <Link
                              href={`/learn/course/${msg.related_course_id}`}
                              className="text-sm text-primary hover:underline font-medium"
                            >
                              查看详情
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
