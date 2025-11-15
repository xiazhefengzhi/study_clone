"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Loader2, FileText, Type, Sparkles, Eye, Save } from 'lucide-react'

interface Document {
  id: number
  title: string
  file_type: string
  created_at: string
}

const COURSE_STYLES = [
  { value: 'standard', label: '标准讲解 - 专业清晰' },
  { value: 'humorous', label: '幽默风格 - 轻松有趣' },
  { value: 'academic', label: '学术风格 - 严谨理论' },
  { value: 'storytelling', label: '故事风格 - 引人入胜' },
  { value: 'practical', label: '实践风格 - 应用案例' },
]

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: '初学者 - 简单基础' },
  { value: 'intermediate', label: '中级 - 适中深度' },
  { value: 'advanced', label: '高级 - 深入复杂' },
]

export default function CourseCreationPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [inputType, setInputType] = useState<'document' | 'text'>('document')
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [textInput, setTextInput] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [style, setStyle] = useState('standard')
  const [difficulty, setDifficulty] = useState('intermediate')

  // AI Generation state
  const [generatedContent, setGeneratedContent] = useState('')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [tokenCount, setTokenCount] = useState(0)
  const [createdCourseId, setCreatedCourseId] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  const fetchDocuments = async () => {
    try {
      const response = await apiClient.getDocuments(1, 100)
      setDocuments(response.documents)
    } catch (err: any) {
      console.error('Failed to fetch documents:', err)
    }
  }

  const handleGenerateAI = async () => {
    setError('')
    setSuccess('')
    setGenerating(true)
    setGeneratedContent('')
    setTokenCount(0)
    setGenerationProgress(0)

    try {
      // Validate input
      if (inputType === 'document' && !selectedDocumentId) {
        setError('请选择一个文档')
        setGenerating(false)
        return
      }

      if (inputType === 'text' && !textInput.trim()) {
        setError('请输入文本内容')
        setGenerating(false)
        return
      }

      let accumulated = ''

      // Generate from document or text
      if (inputType === 'document') {
        for await (const token of apiClient.generateFromDocument(
          parseInt(selectedDocumentId),
          style,
          difficulty,
          title || '智能生成讲解',
          (token) => {
            setTokenCount(count => count + 1)
            setGenerationProgress(Math.min((tokenCount / 1000) * 100, 99))
          }
        )) {
          accumulated += token
          setGeneratedContent(accumulated)
        }
      } else {
        for await (const token of apiClient.generateFromText(
          textInput,
          style,
          difficulty,
          title || '智能生成讲解',
          (token) => {
            setTokenCount(count => count + 1)
            setGenerationProgress(Math.min((tokenCount / 1000) * 100, 99))
          }
        )) {
          accumulated += token
          setGeneratedContent(accumulated)
        }
      }

      setGenerationProgress(100)
      setSuccess('生成完成！您可以预览或保存讲解。')
    } catch (err: any) {
      console.error('AI generation failed:', err)
      setError(err.message || 'AI 生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveCourse = async () => {
    if (!generatedContent) {
      setError('没有可保存的内容')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const courseData: any = {
        title: title || '智能生成讲解',
        style,
        difficulty,
        description,
        content: generatedContent,
      }

      if (inputType === 'document') {
        courseData.document_id = parseInt(selectedDocumentId)
      } else {
        courseData.text_content = textInput
      }

      const course = await apiClient.createCourse(courseData)
      setCreatedCourseId(course.id)
      setSuccess('讲解保存成功！')

      setTimeout(() => {
        router.push(`/learn/courses/${course.id}`)
      }, 1500)
    } catch (err: any) {
      setError(err.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">🎨 AI 讲解制作</h1>
          <p className="text-gray-600 mt-2">
            使用 AI 将学习资料转化为精美的动画讲解视频
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Settings */}
          <div className="space-y-6">
            {/* Input Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>选择输入方式</CardTitle>
                <CardDescription>
                  从已上传的文档创建，或直接输入文本
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'document' | 'text')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="document">
                      <FileText className="mr-2 h-4 w-4" />
                      从文档创建
                    </TabsTrigger>
                    <TabsTrigger value="text">
                      <Type className="mr-2 h-4 w-4" />
                      文本输入
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="document" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>选择文档</Label>
                      <Select
                        value={selectedDocumentId}
                        onValueChange={setSelectedDocumentId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择一个已上传的文档" />
                        </SelectTrigger>
                        <SelectContent>
                          {documents.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              暂无文档，请先上传
                            </div>
                          ) : (
                            documents.map((doc) => (
                              <SelectItem key={doc.id} value={doc.id.toString()}>
                                {doc.title} ({doc.file_type.replace('.', '').toUpperCase()})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {documents.length === 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/learn/my-document')}
                      >
                        前往上传文档
                      </Button>
                    )}
                  </TabsContent>

                  <TabsContent value="text" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="textInput">输入文本内容</Label>
                      <Textarea
                        id="textInput"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="输入您想要学习的内容、问题或知识点...&#10;&#10;例如：&#10;- 讲解 Python 列表推导式的用法&#10;- 解释什么是机器学习&#10;- 快速排序算法原理"
                        rows={8}
                        className="resize-none font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        支持输入文本、URL、问题等（Ctrl+Enter 快速生成）
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Course Settings */}
            <Card>
              <CardHeader>
                <CardTitle>讲解设置</CardTitle>
                <CardDescription>
                  个性化您的讲解风格和难度
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">讲解标题</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入标题或留空自动生成"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">描述（可选）</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="简单描述讲解内容"
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>讲解风格</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_STYLES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>难度等级</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleGenerateAI}
                disabled={generating || (inputType === 'document' && !selectedDocumentId) || (inputType === 'text' && !textInput.trim())}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    AI 生成中... ({tokenCount} tokens)
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    开始 AI 生成
                  </>
                )}
              </Button>

              {generatedContent && (
                <Button
                  onClick={handleSaveCourse}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      保存讲解
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Progress */}
            {generating && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">生成进度</span>
                      <span className="font-medium">{generationProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                    <p className="text-xs text-gray-500 text-center">
                      已生成 {tokenCount} tokens
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Preview */}
          <Card className="lg:sticky lg:top-6" style={{ height: 'calc(100vh - 100px)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                实时预览
              </CardTitle>
              <CardDescription>
                AI 生成的讲解内容将实时显示在这里
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-100px)]">
              {generatedContent ? (
                <iframe
                  srcDoc={generatedContent}
                  className="w-full h-full border-0 rounded-lg bg-white"
                  title="生成预览"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Sparkles className="h-16 w-16 mb-4" />
                  <p className="text-lg">等待生成...</p>
                  <p className="text-sm mt-2">点击"开始 AI 生成"按钮开始</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
