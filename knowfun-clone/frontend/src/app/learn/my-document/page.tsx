/** My Documents Page - 我的文档 */

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Upload, Trash2, Loader2, Search } from 'lucide-react'

interface Document {
  id: number
  title: string
  description: string | null
  file_type: string
  file_size: number
  status: string
  created_at: string
}

export default function MyDocumentsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Upload dialog state
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  // Fetch documents
  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getDocuments(1, 100)
      setDocuments(response.documents)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill title from filename
      if (!uploadTitle) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        setUploadTitle(nameWithoutExt)
      }
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploadLoading(true)
    setError('')

    try {
      await apiClient.uploadDocument(selectedFile, uploadTitle, uploadDescription)

      // Reset form
      setSelectedFile(null)
      setUploadTitle('')
      setUploadDescription('')
      setShowUpload(false)

      // Refresh documents
      await fetchDocuments()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个文档吗？')) return

    try {
      await apiClient.deleteDocument(id)
      await fetchDocuments()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">我的文档</h1>
          <p className="text-muted-foreground mt-1">
            管理您上传的学习资料
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="mr-2 h-4 w-4" />
          上传文档
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Dialog */}
      {showUpload && (
        <Card className="mb-6">
          <form onSubmit={handleUpload}>
            <CardHeader>
              <CardTitle>上传新文档</CardTitle>
              <CardDescription>
                支持 PDF、PPT、Word 文件
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">选择文件</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={handleFileSelect}
                  required
                  disabled={uploadLoading}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    已选择: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="输入文档标题"
                  required
                  disabled={uploadLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述（可选）</Label>
                <Input
                  id="description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="简单描述文档内容"
                  disabled={uploadLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                type="submit"
                disabled={uploadLoading || !selectedFile}
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    上传中...
                  </>
                ) : (
                  '上传'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUpload(false)
                  setSelectedFile(null)
                  setUploadTitle('')
                  setUploadDescription('')
                }}
                disabled={uploadLoading}
              >
                取消
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索文档..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? '未找到匹配的文档' : '还没有上传任何文档'}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                onClick={() => setShowUpload(true)}
                className="mt-4"
              >
                上传第一个文档
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <CardTitle className="text-lg line-clamp-1">
                  {doc.title}
                </CardTitle>
                {doc.description && (
                  <CardDescription className="line-clamp-2">
                    {doc.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardFooter className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="uppercase text-xs font-medium">
                    {doc.file_type.replace('.', '')}
                  </span>
                  <span>•</span>
                  <span>{formatFileSize(doc.file_size)}</span>
                </div>
                <span>{formatDate(doc.created_at)}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Statistics */}
      {documents.length > 0 && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            共 {documents.length} 个文档 •
            已使用 {formatFileSize(documents.reduce((sum, doc) => sum + doc.file_size, 0))}
          </p>
        </div>
      )}
    </div>
  )
}
