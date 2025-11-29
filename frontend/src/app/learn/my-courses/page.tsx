"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Loader2,
  Share2,
  MoreHorizontal,
  Clock,
  XCircle,
  PlayCircle,
  Film,
  Calendar,
  Eye,
  Globe,
  Lock,
  Plus,
  Trash2,
  Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublishCourseDialog } from "@/components/courses/PublishCourseDialog";
import { Course, CourseStatus } from "@/types/course";
import { cn } from "@/lib/utils";

// 优化的课程封面图片组件 - 带懒加载和加载状态
function OptimizedCourseImage({ src, alt, courseId }: { src: string; alt: string; courseId: number }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 渐变背景色数组
  const gradients = [
    "from-purple-500/80 to-pink-500/80",
    "from-blue-500/80 to-cyan-500/80",
    "from-orange-500/80 to-amber-500/80",
    "from-green-500/80 to-emerald-500/80"
  ];

  if (hasError) {
    return (
      <div className={cn(
        "w-full h-full flex items-center justify-center bg-gradient-to-br",
        gradients[courseId % 4]
      )}>
        <div className="text-white/90 text-center p-4">
          <Sparkles className="w-10 h-10 mx-auto mb-2" />
          <span className="text-sm font-medium line-clamp-2">{alt}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-secondary/30 animate-pulse flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        className={cn(
          "object-cover transition-all duration-700 group-hover:scale-110",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </>
  );
}

export default function MyCoursesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  // 权限检查：未登录用户重定向到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, authLoading, router]);

  // 发布弹窗状态
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // 获取课程列表
  const fetchCourses = useCallback(async (statusFilter: string = "all") => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        // toast.error("请先登录");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: "1",
        page_size: "50",
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const res = await fetch(`${API_URL}/api/v1/courses/my-courses?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("获取课程列表失败");

      const data = await res.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error(error);
      toast.error("无法加载课程列表");
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载和Tab切换
  useEffect(() => {
    setLoading(true);
    fetchCourses(activeTab);
  }, [activeTab, fetchCourses]);

  // 使用 useRef 保存最新的 courses，避免闭包陷阱
  const coursesRef = useRef(courses);
  useEffect(() => {
    coursesRef.current = courses;
  }, [courses]);

  // 自动轮询：每5秒检查一次
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentCourses = coursesRef.current;
      const hasPendingTasks = currentCourses.some(c =>
        c.status === 'pending' || c.status === 'processing'
      );

      if (hasPendingTasks || activeTab === 'pending' || activeTab === 'processing') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          const token = session?.access_token;
          if (!token) return;

          const params = new URLSearchParams({ page: "1", page_size: "50" });
          if (activeTab !== "all") params.append("status", activeTab);

          fetch(`${API_URL}/api/v1/courses/my-courses?${params.toString()}`, {
            headers: { "Authorization": `Bearer ${token}` },
          })
            .then(res => res.json())
            .then(data => {
              if (data.courses) setCourses(data.courses);
            })
            .catch(console.error);
        });
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activeTab]);

  // 处理取消发布
  const handleUnpublish = async (courseId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch(`${API_URL}/api/v1/courses/${courseId}/unpublish`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("取消发布失败");

      toast.success("已取消发布");
      fetchCourses(activeTab);
    } catch (error) {
      toast.error("操作失败，请重试");
    }
  };

    // 处理删除
    const handleDelete = async (courseId: number) => {
        if (!confirm("确定要删除这个课程吗？此操作无法撤销。")) return;
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (!token) return;
    
          const res = await fetch(`${API_URL}/api/v1/courses/${courseId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
          });
    
          if (!res.ok) throw new Error("删除失败");
    
          toast.success("删除成功");
          // Optimistic update
          setCourses(prev => prev.filter(c => c.id !== courseId));
        } catch (error) {
          toast.error("操作失败，请重试");
        }
      };

  const openPublishDialog = (course: Course) => {
    setSelectedCourse(course);
    setPublishDialogOpen(true);
  };

  const renderStatusBadge = (status: CourseStatus) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20">已完成</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="text-blue-600 bg-blue-500/10 border-blue-200"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> 生成中</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-500/10 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> 排队中</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20">生成失败</Badge>;
      default:
        return null;
    }
  };

  // 认证加载中或未登录时显示加载状态
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
      <div className="container max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">我的动画库</h1>
            <p className="text-muted-foreground mt-1">管理您创作的所有 AI 互动课程</p>
          </div>
          <Button onClick={() => router.push('/learn/course-creation')} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md hover:shadow-lg transition-all hover:scale-105">
            <Plus className="w-4 h-4 mr-2" /> 新建动画
          </Button>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start h-auto p-1 bg-secondary/30 rounded-xl border border-border/50 overflow-x-auto flex-nowrap">
            {["all", "completed", "processing", "failed"].map((tab) => (
              <TabsTrigger 
                key={tab} 
                value={tab}
                className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                {tab === 'all' && "全部"}
                {tab === 'completed' && "已完成"}
                {tab === 'processing' && "进行中"}
                {tab === 'failed' && "失败"}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-[220px] w-full rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center bg-secondary/10 rounded-3xl border border-dashed border-border">
                <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6 text-muted-foreground">
                  <Film className="w-10 h-10 opacity-50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">暂无动画记录</h3>
                <p className="text-muted-foreground mb-8 max-w-sm">
                  您的创作空间还是空的，快去制作您的第一个 AI 互动动画吧！
                </p>
                <Button onClick={() => router.push('/learn/course-creation')} variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                  <Plus className="w-4 h-4 mr-2" /> 开始创作
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {courses.map((course) => (
                    <motion.div
                      key={course.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        onClick={() => course.status === 'completed' && router.push(`/learn/courses/${course.id}`)}
                        className={cn(
                          "group relative overflow-hidden flex flex-col h-full transition-all duration-300 border-2",
                          course.status === 'completed'
                            ? 'cursor-pointer hover:border-purple-500/50 hover:shadow-xl hover:-translate-y-1'
                            : 'cursor-default opacity-90'
                        )}
                      >
                        {/* 封面区域 */}
                        <div className="relative aspect-[16/10] bg-secondary/20 overflow-hidden">
                          {course.status === 'completed' ? (
                            <>
                                {course.cover_image ? (
                                    <OptimizedCourseImage
                                        src={course.cover_image}
                                        alt={course.title}
                                        courseId={course.id}
                                    />
                                ) : (
                                    <div className={cn(
                                        "w-full h-full flex items-center justify-center",
                                        "bg-gradient-to-br",
                                        course.id % 4 === 0 ? "from-purple-500/80 to-pink-500/80" :
                                        course.id % 4 === 1 ? "from-blue-500/80 to-cyan-500/80" :
                                        course.id % 4 === 2 ? "from-orange-500/80 to-amber-500/80" :
                                        "from-green-500/80 to-emerald-500/80"
                                    )}>
                                        <div className="text-white/90 text-center p-4">
                                            <Sparkles className="w-10 h-10 mx-auto mb-2" />
                                            <span className="text-sm font-medium line-clamp-2">{course.title}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-50 group-hover:scale-100">
                                    <div className="w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-purple-600">
                                        <PlayCircle size={28} fill="currentColor" className="text-white" />
                                    </div>
                                </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/30 p-4 text-center">
                                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
                                {course.status === 'failed' ? (
                                    <div className="z-10 flex flex-col items-center text-red-500">
                                        <XCircle className="w-10 h-10 mb-2" />
                                        <span className="text-sm font-medium">生成失败</span>
                                    </div>
                                ) : (
                                    <div className="z-10 flex flex-col items-center text-purple-600">
                                        <div className="relative mb-3">
                                            <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-full animate-pulse"></div>
                                            <Loader2 className="w-8 h-8 animate-spin relative z-10" />
                                        </div>
                                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/50 backdrop-blur-sm border border-purple-100">
                                            {course.status === 'pending' ? '正在排队...' : 'AI 生成中...'}
                                        </span>
                                    </div>
                                )}
                            </div>
                          )}

                          <div className="absolute top-3 right-3 flex gap-2 z-20">
                            {renderStatusBadge(course.status)}
                            {course.is_public && (
                              <Badge variant="default" className="bg-blue-500/90 hover:bg-blue-600 backdrop-blur-sm shadow-sm border-0">
                                <Globe className="w-3 h-3 mr-1" /> 已发布
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* 内容区域 */}
                        <CardContent className="flex-1 p-5 space-y-3">
                          <div>
                            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-purple-700 transition-colors" title={course.title}>
                                {course.title || "未命名课程"}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(course.created_at).toLocaleDateString()}</span>
                                </div>
                                {course.status === 'completed' && (
                                    <div className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        <span>{course.views_count}</span>
                                    </div>
                                )}
                            </div>
                          </div>
                          
                          {course.status === 'failed' && course.fail_reason && (
                            <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 leading-relaxed">
                              原因: {course.fail_reason}
                            </div>
                          )}
                        </CardContent>

                        {/* 底部操作按钮 */}
                        <CardFooter className="p-4 pt-0 mt-auto border-t bg-secondary/5">
                          <div className="w-full flex gap-2 pt-3">
                            {course.status === 'completed' ? (
                                <>
                                    {course.is_public ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                            onClick={(e) => { e.stopPropagation(); handleUnpublish(course.id); }}
                                        >
                                            <Lock className="w-3 h-3 mr-1.5" /> 取消发布
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 text-xs h-8 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50"
                                            onClick={(e) => { e.stopPropagation(); openPublishDialog(course); }}
                                        >
                                            <Share2 className="w-3 h-3 mr-1.5" /> 发布
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : course.status === 'failed' ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }}
                                >
                                    <Trash2 className="w-3 h-3 mr-1.5" /> 删除
                                </Button>
                            ) : (
                                <Button variant="secondary" disabled size="sm" className="w-full h-8 text-xs opacity-70">
                                    等待完成...
                                </Button>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </Tabs>

        {/* 发布弹窗组件 */}
        {selectedCourse && (
          <PublishCourseDialog
            course={selectedCourse}
            open={publishDialogOpen}
            onOpenChange={setPublishDialogOpen}
            onSuccess={() => {
              setPublishDialogOpen(false);
              fetchCourses(activeTab);
            }}
          />
        )}
      </div>
    </div>
  );
}