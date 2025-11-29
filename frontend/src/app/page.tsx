"use client"

import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, PlayCircle, Sparkles, Zap, FileText, BrainCircuit, Rocket, Layout, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRef } from "react"
import { useAuth } from "@/contexts/auth-context"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
}

export default function HomePage() {
  const targetRef = useRef<HTMLDivElement>(null)
  const { user, supabaseUser } = useAuth()
  const isLoggedIn = !!user || !!supabaseUser

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 50])

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-background selection:bg-purple-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background">
        {/* Animated Gradient Mesh */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20 animate-gradient-xy bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20 blur-3xl"></div>
        
        {/* Grid Pattern */}
        <div className="absolute h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* Floating Orbs */}
        <div className="absolute left-[10%] top-[20%] h-72 w-72 rounded-full bg-purple-500/10 blur-[100px] animate-float duration-700"></div>
        <div className="absolute right-[10%] bottom-[20%] h-72 w-72 rounded-full bg-pink-500/10 blur-[100px] animate-float duration-500" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Hero Section */}
      <header ref={targetRef} className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-32 text-center px-4">
        <motion.div
          style={{ opacity, scale, y }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto space-y-10 relative z-10"
        >
          {/* Announcement Pill */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="group cursor-pointer relative inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-300 transition-all hover:bg-purple-500/10 hover:border-purple-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span>全新 LLM 2.0 引擎已上线</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight"
          >
            <span className="block text-foreground drop-shadow-sm">让复杂的知识</span>
            <span className="block mt-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent animate-gradient-x pb-2">
              像动画一样生动
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl leading-relaxed"
          >
            上传文档或输入主题，<span className="font-semibold text-foreground">XiaZheStudy</span> 瞬间为你生成互动式动画讲解。
            <br className="hidden sm:block" />
            不再死记硬背，让 AI 带你进入沉浸式学习新纪元。
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6"
          >
            <Link href={isLoggedIn ? "/learn/course-creation" : "/sign-up"}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-[0_0_30px_-10px_rgba(168,85,247,0.5)] border-0 ring-2 ring-purple-500/20 ring-offset-2 ring-offset-background transition-all">
                  <Rocket className="mr-2 h-5 w-5" />
                  {isLoggedIn ? "进入工作台" : "开始创作"}
                </Button>
              </motion.div>
            </Link>

            <Link href="/fun-square">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-full border-2 hover:bg-accent hover:text-accent-foreground transition-all">
                  <PlayCircle className="mr-2 h-5 w-5" /> 
                  探索广场
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats / Trusted By (Optional Visual Anchor) */}
          <motion.div variants={itemVariants} className="pt-12 flex items-center justify-center gap-8 text-muted-foreground grayscale opacity-70">
            <div className="flex items-center gap-2"><Zap size={16} /> <span>超快生成</span></div>
            <div className="w-1 h-1 rounded-full bg-current"></div>
            <div className="flex items-center gap-2"><Layout size={16} /> <span>多端适配</span></div>
            <div className="w-1 h-1 rounded-full bg-current"></div>
            <div className="flex items-center gap-2"><BrainCircuit size={16} /> <span>深度理解</span></div>
          </motion.div>
        </motion.div>
      </header>

      {/* Visual Demo Section (Glassmorphism) */}
      <section className="relative z-20 -mt-20 mb-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="relative rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden dark:bg-black/40 dark:border-white/10 aspect-[16/9] md:aspect-[21/9] group">
            {/* Abstract Interface Mockup */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="w-20 h-20 rounded-full bg-white/90 dark:bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer transition-transform"
              >
                <PlayCircle className="w-10 h-10 text-purple-600 ml-1" />
              </motion.div>
            </div>

            {/* Floating Elements in Mockup */}
            <div className="absolute top-10 left-10 w-64 h-32 bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-xl border border-white/20 p-4 shadow-lg transform -rotate-2 transition-transform group-hover:rotate-0 group-hover:scale-105 duration-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center"><FileText size={16} className="text-purple-600"/></div>
                <div className="h-2 w-24 bg-gray-200 rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-gray-100 rounded-full"></div>
                <div className="h-2 w-4/5 bg-gray-100 rounded-full"></div>
              </div>
            </div>

            <div className="absolute bottom-10 right-10 w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-xl border border-white/20 p-4 shadow-lg transform rotate-2 transition-transform group-hover:rotate-0 group-hover:scale-105 duration-500 delay-75">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs border-pink-200 text-pink-600 bg-pink-50">AI Generating...</Badge>
              </div>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gradient-to-b from-background to-purple-50/50 dark:to-purple-950/10 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">打破知识壁垒，重塑学习体验</h2>
            <p className="text-muted-foreground text-lg">
              我们利用最先进的生成式 AI 技术，将枯燥的文档转化为引人入胜的视觉故事。
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "极速生成",
                desc: "上传文档，一杯咖啡的时间，AI 即可为你生成完整的动画讲解脚本与分镜。",
                color: "text-yellow-500",
                bg: "bg-yellow-500/10",
                border: "group-hover:border-yellow-500/50"
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "风格百变",
                desc: "支持幽默、学术、科幻等多种叙事风格，让同一个知识点焕发不同魅力。",
                color: "text-purple-500",
                bg: "bg-purple-500/10",
                border: "group-hover:border-purple-500/50"
              },
              {
                icon: <BrainCircuit className="w-6 h-6" />,
                title: "智能交互",
                desc: "不仅是看动画，更能随时打断提问，AI 角色即时回应，打造一对一私教体验。",
                color: "text-pink-500",
                bg: "bg-pink-500/10",
                border: "group-hover:border-pink-500/50"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-xl ${feature.bg}`} />
                <Card className={`relative h-full border-2 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${feature.border}`}>
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.bg} ${feature.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Carousel Section */}
      <section className="py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">精选动画案例</h2>
              <p className="text-muted-foreground">来自社区的优秀作品</p>
            </div>
            <Link href="/fun-square" className="hidden md:flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors">
              查看更多 <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "量子力学入门",
                author: "ScienceLab",
                views: "12k",
                cover: "bg-gradient-to-br from-indigo-500 to-blue-600",
                tag: "科普",
              },
              {
                title: "2025 宏观经济分析",
                author: "FinTech Pro",
                views: "8.5k",
                cover: "bg-gradient-to-br from-emerald-500 to-teal-600",
                tag: "财经",
              },
              {
                title: "人类简史：认知革命",
                author: "HistoryBuff",
                views: "23k",
                cover: "bg-gradient-to-br from-orange-500 to-red-600",
                tag: "历史",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4 shadow-lg">
                  <div className={`absolute inset-0 ${item.cover} transition-transform duration-700 group-hover:scale-110`}></div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <PlayCircle className="w-8 h-8 fill-current" />
                    </div>
                  </div>

                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/50 hover:bg-black/70 border-0 backdrop-blur-md text-white">
                      {item.tag}
                    </Badge>
                  </div>
                </div>
                <h3 className="font-bold text-lg group-hover:text-purple-600 transition-colors">{item.title}</h3>
                <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                    <span>{item.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    <span>{item.views} 次播放</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Button variant="ghost" className="text-purple-600">查看更多 <ArrowRight className="ml-2 w-4 h-4" /></Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 -z-20"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 -z-10"></div>
        
        <div className="container mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              开启你的沉浸式学习之旅
            </h2>
            <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto">
              加入超过 10,000+ 学习者的社区，体验 AI 带来的知识革命。
              <br />无需信用卡，免费开始使用。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isLoggedIn ? "/learn/course-creation" : "/sign-up"}>
                <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full w-full sm:w-auto shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                  {isLoggedIn ? "开始新的创作" : "免费注册"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-purple-200 mt-8">
              支持 PDF, Word, PPT 等多种格式导入
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}