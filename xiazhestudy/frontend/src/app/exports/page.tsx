"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Download,
  FileText,
  Video,
  FileImage,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ExternalLink
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/auth-context"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface ExportTask {
  id: number
  course_id: number
  export_type: string
  status: string
  file_name: string
  file_size: number | null
  file_url: string | null
  progress: number
  created_at: string
  completed_at: string | null
  course_title: string | null
}

export default function ExportsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<ExportTask[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    total_exports: number
    by_type: { html: number; pdf: number; mp4: number }
  } | null>(null)

  // 权限检查：未登录用户重定向到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  // 获取导出任务列表
  const fetchTasks = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        toast.error("请先登录")
        setLoading(false)
        return
      }

      const res = await fetch(`${API_URL}/api/v1/export-tasks/?page=1&page_size=50`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (!res.ok) throw new Error("获取导出记录失败")

      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error(error)
      toast.error("加载失败")
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const res = await fetch(`${API_URL}/api/v1/export-tasks/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchStats()
  }, [fetchTasks, fetchStats])

  // 删除导出记录
  const handleDelete = async (taskId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const res = await fetch(`${API_URL}/api/v1/export-tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (!res.ok) throw new Error("删除失败")

      toast.success("删除成功")
      fetchTasks()
      fetchStats()
    } catch (error) {
      toast.error("删除失败")
    }
  }

  // 获取导出类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "html":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "pdf":
        return <FileImage className="h-5 w-5 text-red-500" />
      case "mp4":
        return <Video className="h-5 w-5 text-purple-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            已完成
          </Badge>
        )
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            处理中
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            等待中
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            失败
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 认证加载中或未登录时显示加载状态
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
        <div className="container max-w-5xl py-8 px-4 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">导出任务</h1>
              <p className="text-muted-foreground mt-1">查看和管理您的导出记录</p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total_exports}</div>
                  <div className="text-sm text-muted-foreground">总导出次数</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold">{stats.by_type.html}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">HTML 导出</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <FileImage className="h-5 w-5 text-red-500" />
                    <span className="text-2xl font-bold">{stats.by_type.pdf}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">PDF 导出</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-purple-500" />
                    <span className="text-2xl font-bold">{stats.by_type.mp4}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">视频导出</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">导出记录</h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Download className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-lg font-medium">暂无导出记录</p>
                    <p className="text-sm mt-1">在动画预览页面点击"导出 HTML"即可生成导出记录</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Type Icon */}
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            {getTypeIcon(task.export_type)}
                          </div>

                          {/* Info */}
                          <div>
                            <div className="font-medium">
                              {task.course_title || task.file_name}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="uppercase">{task.export_type}</span>
                              <span>·</span>
                              <span>{formatFileSize(task.file_size)}</span>
                              <span>·</span>
                              <span>{new Date(task.created_at).toLocaleString('zh-CN')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          {getStatusBadge(task.status)}

                          {task.file_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={task.file_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                下载
                              </a>
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除这条导出记录吗？此操作无法撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(task.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Progress Bar (for processing tasks) */}
                      {task.status === "processing" && (
                        <div className="mt-3">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            处理进度: {task.progress}%
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
