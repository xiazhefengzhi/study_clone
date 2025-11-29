"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  PlayCircle,
  Eye,
  Heart,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";

// --- 1. 分类和类型定义 ---
const CATEGORIES = ["全部", "科技", "商业", "历史", "生活", "艺术", "编程", "心理学"];

interface CourseItem {
  id: number;
  title: string;
  description: string;
  category?: string;
  style?: string;
  cover_image?: string;
  views_count: number;
  likes_count: number;
  created_at: string;
  user?: {
    username: string;
  };
}

interface ApiResponse {
  courses: CourseItem[];
  total: number;
  page: number;
  page_size: number;
}

// 预定义的渐变主题
const GRADIENT_THEMES = [
  "from-violet-500 to-purple-500",
  "from-pink-500 to-rose-500",
  "from-blue-500 to-indigo-500",
  "from-fuchsia-500 to-pink-500",
  "from-cyan-500 to-blue-500",
  "from-purple-500 to-indigo-500",
  "from-orange-400 to-pink-500",
  "from-teal-400 to-emerald-500",
];

// 分类对应的 Emoji
const CATEGORY_EMOJI: Record<string, string> = {
  "科技": "🤖",
  "商业": "🚀",
  "历史": "📚",
  "生活": "🧘",
  "艺术": "🎨",
  "编程": "💻",
  "心理学": "🧠",
};

// 工具函数
const getInitials = (name: string) => {
  return name?.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) || "??";
};

const getThemeByIndex = (index: number) => GRADIENT_THEMES[index % GRADIENT_THEMES.length];
const getEmojiByCategory = (category?: string) => CATEGORY_EMOJI[category || ""] || "✨";

// --- 2. Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

export default function SquarePage() {
  const router = useRouter();

  // --- State ---
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "rating">("latest");
  const [total, setTotal] = useState(0);

  // --- 加载数据 ---
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: "1",
        page_size: "50",
        sort_by: sortBy,
      });

      if (activeCategory !== "全部") {
        params.append("category", activeCategory);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const data = await apiClient.request<ApiResponse>(
        `/api/v1/courses/public/list?${params.toString()}`
      );

      setCourses(data.courses || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load courses:", err);
      setError("加载失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // --- 监听筛选条件变化 ---
  useEffect(() => {
    loadCourses();
  }, [activeCategory, sortBy]);

  // --- 搜索防抖 ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadCourses();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* --- Header Section --- */}
      <div className="bg-background/50 pt-8 pb-6 px-4 md:px-8 backdrop-blur-sm border-b border-border/40">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">内容广场</h1>
              <p className="text-muted-foreground mt-1">
                发现由 AI 生成的精彩动画 · 共 {total} 个作品
              </p>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索感兴趣的话题..."
                  className="pl-9 bg-secondary/50 border-transparent focus:bg-background transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={sortBy} onValueChange={(value: "latest" | "popular" | "rating") => setSortBy(value)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">最新发布</SelectItem>
                  <SelectItem value="popular">最多观看</SelectItem>
                  <SelectItem value="rating">最多点赞</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* --- Sticky Category Filter --- */}
      <div className="sticky top-16 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border/40 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <Filter className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                  : "bg-secondary/50 text-secondary-foreground hover:bg-secondary hover:text-foreground"
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* --- Content Grid --- */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadCourses} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" /> 重试
            </Button>
          </div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="bg-secondary/50 p-6 rounded-full mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">暂无公开内容</h3>
            <p className="text-muted-foreground mt-2">
              {searchQuery || activeCategory !== "全部"
                ? "尝试切换关键词或分类看看"
                : "快去创建你的第一个动画吧！"}
            </p>
            <Button
              variant="link"
              onClick={() => { setActiveCategory("全部"); setSearchQuery(""); }}
              className="mt-4 text-primary"
            >
              重置所有筛选
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {courses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// --- 3. Sub-Component: Course Card ---
function CourseCard({ course, index }: { course: CourseItem; index: number }) {
  const router = useRouter();

  return (
    <motion.div
      layout
      variants={cardVariants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={() => router.push(`/learn/courses/${course.id}`)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
    >
      {/* 封面区域 */}
      <div className={`relative h-48 w-full overflow-hidden ${!course.cover_image ? `bg-gradient-to-br ${getThemeByIndex(index)}` : ''}`}>
        {course.cover_image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.cover_image}
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', getThemeByIndex(index).replace('bg-gradient-to-br ', ''));
              }}
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
            {/* 中心 Emoji */}
            <div className="absolute inset-0 flex items-center justify-center transform transition-transform duration-500 group-hover:scale-110">
              <span className="text-7xl drop-shadow-lg filter select-none">
                {getEmojiByCategory(course.category)}
              </span>
            </div>
          </>
        )}

        {/* 播放按钮覆盖层 */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button size="icon" className="rounded-full h-12 w-12 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-none">
            <PlayCircle className="h-6 w-6 fill-current" />
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs font-normal text-primary border-primary/20 bg-primary/5">
            {course.category || "未分类"}
          </Badge>
          <div className="flex items-center text-xs text-rose-500 font-medium">
            <Heart className="h-3 w-3 mr-1 fill-current" />
            {course.likes_count || 0}
          </div>
        </div>

        <h3 className="font-semibold leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
          {course.description || "精彩的 AI 生成动画，等你来发现！"}
        </p>

        {/* 底部元数据 */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-white dark:ring-slate-800">
              <span className="font-bold text-[10px] text-white">
                {getInitials(course.user?.username || "匿名")}
              </span>
            </div>
            <span className="text-xs font-medium">{course.user?.username || "匿名用户"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{course.views_count >= 1000 ? `${(course.views_count / 1000).toFixed(1)}k` : course.views_count}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
