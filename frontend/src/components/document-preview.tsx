"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Download, ExternalLink, FileText, AlertCircle } from "lucide-react"

interface DocumentPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileUrl: string
  fileName: string
  fileType: string  // .pdf, .doc, .docx, .ppt, .pptx, .md, .txt
}

export function DocumentPreview({
  open,
  onOpenChange,
  fileUrl,
  fileName,
  fileType,
}: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [textContent, setTextContent] = useState<string>('')

  // 获取预览 URL
  const getPreviewUrl = () => {
    const ext = fileType.toLowerCase().replace('.', '')

    // PDF - 直接用浏览器预览
    if (ext === 'pdf') {
      return fileUrl
    }

    // Office 格式 - 使用 Microsoft Office Online Viewer
    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
    }

    // Google Docs Viewer (备用，支持更多格式)
    // return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`

    // 文本文件直接显示
    if (['txt', 'md', 'json', 'csv'].includes(ext)) {
      return fileUrl
    }

    return null
  }

  const previewUrl = getPreviewUrl()
  const ext = fileType.toLowerCase().replace('.', '')
  const isTextFile = ['txt', 'md', 'json', 'csv'].includes(ext)

  // 检查 URL 是否有效，文本文件加载内容
  useEffect(() => {
    if (open && fileUrl) {
      setLoading(true)
      setError(false)
      setTextContent('')

      // 文本文件直接获取内容
      if (isTextFile) {
        fetch(fileUrl)
          .then(async (res) => {
            if (!res.ok) throw new Error(`Status: ${res.status}`)
            const text = await res.text()
            setTextContent(text)
            setLoading(false)
          })
          .catch((err) => {
            console.error("Text file load failed:", err)
            setError(true)
            setLoading(false)
          })
        return
      }

      // 预检请求
      fetch(fileUrl, { method: 'HEAD' })
        .then(async (res) => {
          if (!res.ok) {
            // 如果 HEAD 失败，尝试 GET 获取错误详情 (可能是 JSON 报错)
            const errRes = await fetch(fileUrl);
            const errText = await errRes.text();
            if (errText.includes("Bucket not found")) {
               throw new Error("Bucket not found");
            }
            throw new Error(`Status: ${res.status}`);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Preview URL check failed:", err);
          setError(true);
          setLoading(false);
        });
    }
  }, [open, fileUrl, isTextFile]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg">{fileName}</DialogTitle>
              <span className="text-xs uppercase px-2 py-0.5 bg-muted rounded">
                {ext}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  新窗口
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={fileUrl} download={fileName}>
                  <Download className="h-4 w-4 mr-1" />
                  下载
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden bg-muted/30">
          {error ? (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
              <AlertCircle className="h-12 w-12 mb-4 text-destructive" />
              <p className="text-lg font-medium text-foreground">无法加载预览</p>
              <p className="text-sm mt-2 max-w-md">
                {error && typeof error === 'object' ? "存储桶未找到或文件不存在" : "文件可能已被删除或您没有访问权限。"}
              </p>
              <p className="text-xs text-muted-foreground mt-4 bg-muted p-2 rounded">
                提示: 请检查 Supabase Storage 是否有名为 &quot;knowfun-files&quot; 的 Public Bucket。
              </p>
              <Button className="mt-6" asChild variant="outline">
                <a href={fileUrl} download={fileName}>
                  <Download className="h-4 w-4 mr-2" />
                  尝试直接下载
                </a>
              </Button>
            </div>
          ) : !previewUrl ? (
            // 不支持预览的格式
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">暂不支持预览此格式</p>
              <p className="text-sm mt-2">请下载后使用本地应用打开</p>
              <Button className="mt-4" asChild>
                <a href={fileUrl} download={fileName}>
                  <Download className="h-4 w-4 mr-2" />
                  下载文件
                </a>
              </Button>
            </div>
          ) : isTextFile ? (
            // 文本文件预览
            <div className="h-full overflow-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm bg-background p-4 rounded-lg border">
                  {textContent}
                </pre>
              )}
            </div>
          ) : (
            // iframe 预览 (PDF, Office)
            <div className="relative h-full">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">正在加载文档...</p>
                  </div>
                </div>
              )}
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title={fileName}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false)
                  setError(true)
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
