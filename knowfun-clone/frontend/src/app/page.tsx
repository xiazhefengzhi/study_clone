import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, FileText, Sparkles, MessageSquare, Star } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50 via-white to-white dark:from-purple-950/20 dark:via-background dark:to-background">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  在<span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">乐趣</span>中知晓。
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  KnowFun 是一款AI驱动的革命性教育应用，以"让天下没有难学的知识"为使命，
                  将您的学习资料转化为个性化多模态内容，实现因材施教的学习体验。
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/learn/course-creation">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-lg h-12 px-8">
                    立即制作讲解
                  </Button>
                </Link>
                <Link href="/fun-square">
                  <Button size="lg" variant="outline" className="text-lg h-12 px-8">
                    了解更多
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative flex items-center justify-center">
              <div className="relative h-96 w-96">
                {/* Purple Orb */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-purple-600 to-pink-600 opacity-20 blur-3xl animate-pulse"></div>
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-30 blur-2xl"></div>
                <div className="absolute inset-16 flex items-center justify-center">
                  <div className="h-64 w-64 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-2xl shadow-purple-500/50">
                    <div className="h-full w-full rounded-full bg-gradient-to-tr from-purple-400/50 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">打破知识壁垒，畅享知识畅流</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {/* Feature Card 1 */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl">1分钟生成讲解</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  AI快速解析资料，生成个性化讲解内容
                </p>
              </CardContent>
            </Card>

            {/* Feature Card 2 */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900">
                    <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl">20+讲解风格</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  从幽默课堂到严肃学术，满足不同学习需求
                </p>
              </CardContent>
            </Card>

            {/* Feature Card 3 */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl">实时提问+测试</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  学习过程中随时提问，课后闯关测试强化记忆
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gradient-to-b from-white to-purple-50/30 dark:from-background dark:to-purple-950/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-bold">用例展示</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {/* Use Case Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    Research
                  </Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">4.9</span>
                  </div>
                </div>
                <CardTitle className="group-hover:text-purple-600 transition-colors">
                  狗与猫：主人眼中的宠物...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Research</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Technology
                  </Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">4.8</span>
                  </div>
                </div>
                <CardTitle className="group-hover:text-blue-600 transition-colors">
                  AI技术发展趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">深度学习与应用</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Education
                  </Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">5.0</span>
                  </div>
                </div>
                <CardTitle className="group-hover:text-green-600 transition-colors">
                  高效学习方法论
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">提升学习效率</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6 text-white">
            <h2 className="text-4xl md:text-5xl font-bold">
              准备好开始了吗？
            </h2>
            <p className="text-xl text-purple-100">
              立即体验AI驱动的学习革命，让知识学习变得简单有趣
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/learn/course-creation">
                <Button size="lg" variant="secondary" className="text-lg h-12 px-8">
                  立即开始
                </Button>
              </Link>
              <Link href="/fun-square">
                <Button size="lg" variant="outline" className="text-lg h-12 px-8 border-white text-white hover:bg-white/10">
                  浏览广场
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
