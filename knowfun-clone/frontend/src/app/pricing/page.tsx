import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-config"

export default function PricingPage() {
  const tiers = [
    { key: 'free', recommended: false, badge: null },
    { key: 'basic', recommended: true, badge: '推荐' },
    { key: 'plus', recommended: false, badge: '最受欢迎' },
    { key: 'pro', recommended: false, badge: null },
  ]

  return (
    <main className="min-h-screen py-20 bg-gradient-to-b from-purple-50/30 via-white to-white dark:from-purple-950/10 dark:via-background dark:to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold">选择适合您的方案</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            从免费体验到企业级解决方案，我们为不同需求的用户提供灵活的价格选择
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {tiers.map(({ key, recommended, badge }) => {
            const tier = SUBSCRIPTION_TIERS[key as keyof typeof SUBSCRIPTION_TIERS]
            const isFree = key === 'free'
            const isPlus = key === 'plus'

            return (
              <Card
                key={key}
                className={`relative ${
                  isPlus
                    ? 'border-2 border-yellow-500 shadow-xl scale-105'
                    : recommended
                    ? 'border-2 border-blue-500 shadow-lg'
                    : 'border-2'
                }`}
              >
                {badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge
                      className={`${
                        isPlus
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white px-4 py-1`}
                    >
                      {badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-6">
                  <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                  <CardDescription>
                    {isFree && '免费体验基础功能'}
                    {key === 'basic' && '个人用户的最佳选择'}
                    {key === 'plus' && '专业用户的理想选择'}
                    {key === 'pro' && '企业级用户首选'}
                  </CardDescription>

                  <div className="mt-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">${tier.price}</span>
                      {!isFree && <span className="text-muted-foreground">/月</span>}
                    </div>
                    {!isFree && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {key === 'basic' && (
                          <>
                            <span className="line-through">原价$12.99</span>
                            <span className="text-green-600 ml-2">Save 25%</span>
                            <div>按月付费仅 $0.31/天</div>
                          </>
                        )}
                        {key === 'plus' && (
                          <>
                            <span className="line-through">原价$29.99</span>
                            <span className="text-green-600 ml-2">Save 35%</span>
                            <div>按月付费仅 $0.63/天</div>
                          </>
                        )}
                        {key === 'pro' && (
                          <>
                            <span className="line-through">原价$84.99</span>
                            <span className="text-green-600 ml-2">Save 40%</span>
                            <div>按月付费仅 $1.61/天</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className={`w-full mt-6 ${
                      isPlus
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90'
                        : recommended
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90'
                        : isFree
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:opacity-90'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90'
                    }`}
                  >
                    {isFree ? '当前方案' : '立即升级'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-20 text-center">
          <p className="text-sm text-muted-foreground">
            所有方案都支持随时取消 • 安全支付 • 7天无理由退款
          </p>
        </div>
      </div>
    </main>
  )
}
