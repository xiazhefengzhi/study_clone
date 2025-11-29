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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FileText, Upload, Trash2, Loader2, Search, Eye, Download, ExternalLink } from 'lucide-react'
import { DocumentPreview } from '@/components/document-preview'

interface Document {
  id: number
  title: string
  description: string | null
  file_type: string
  file_size: number
  file_url: string  // 文件访问链接
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

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

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

  const openDeleteDialog = (id: number) => {
    setDeleteTargetId(id)
    setDeleteDialogOpen(true)
  }

  const openPreview = (doc: Document) => {
    setPreviewDoc(doc)
    setPreviewOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTargetId) return

    try {
      await apiClient.deleteDocument(deleteTargetId)
      await fetchDocuments()
      setDeleteDialogOpen(false)
      setDeleteTargetId(null)
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
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpload}>
            <DialogHeader>
              <DialogTitle>上传新文档</DialogTitle>
              <DialogDescription>
                支持 PDF、PPT、Word 文件
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
            </div>
            <DialogFooter>
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
            <Card key={doc.id} className="hover:shadow-lg transition-shadow group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(doc.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
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
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <span className="uppercase text-xs font-medium text-muted-foreground">
                    {doc.file_type.replace('.', '')}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                </div>
                <span className="text-sm text-muted-foreground">{formatDate(doc.created_at)}</span>
              </CardContent>
              <CardFooter className="flex gap-2 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openPreview(doc)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  查看
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <a href={doc.file_url} download={doc.title}>
                    <Download className="h-4 w-4 mr-1" />
                    下载
                  </a>
                </Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              此操作无法撤销，确定要删除这个文档吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      {previewDoc && (
        <DocumentPreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          fileUrl={previewDoc.file_url}
          fileName={previewDoc.title}
          fileType={previewDoc.file_type}
        />
      )}
    </div>
  )
}
