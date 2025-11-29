"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Eye } from "lucide-react";
import { toast } from "sonner";
import { Course } from "@/types/course";
import { supabase } from "@/lib/supabase";

interface PublishCourseDialogProps {
  course: Course;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TAGS_OPTIONS = ["科学类", "文学类", "商业类", "技术类", "生活类", "其他"];
const COVER_TYPES = ["default", "custom"] as const;
type CoverType = typeof COVER_TYPES[number];

export function PublishCourseDialog({
  course,
  open,
  onOpenChange,
  onSuccess
}: PublishCourseDialogProps) {
  const [title, setTitle] = useState(course.title);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isOriginal, setIsOriginal] = useState(false);
  const [coverType, setCoverType] = useState<CoverType>("default");
  const [customCover, setCustomCover] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      if (selectedTags.length >= 5) {
        toast.warning("最多选择5个标签");
        return;
      }
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) {
      toast.error("文件大小不能超过5MB");
      return;
    }

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件");
      return;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomCover(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    // 验证必填字段
    if (!title.trim()) {
      toast.error("请输入标题");
      return;
    }

    if (!isOriginal) {
      toast.error("请确认原创声明");
      return;
    }

    setIsSubmitting(true);
    try {
      // 从 Supabase session 获取 token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error("登录已过期，请重新登录");
        setIsSubmitting(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/api/v1/courses/${course.id}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          tags: selectedTags,
          is_original: isOriginal,
          cover_type: coverType
        }),
      });

      if (!response.ok) {
        throw new Error("发布失败");
      }

      toast.success("发布成功！您的动画已发布到广场");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("发布失败:", error);
      toast.error("发布遇到问题，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCover = coverType === "custom" && customCover
    ? customCover
    : course.cover_image || "/placeholder-course.jpg";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] max-h-[700px] flex flex-col p-0 overflow-hidden gap-0">
        <div className="flex flex-1 h-full overflow-hidden">
          {/* 左侧：预览区域 */}
          <div className="w-1/3 bg-muted/30 p-6 border-r flex flex-col items-center justify-start gap-4 overflow-y-auto">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Eye className="h-4 w-4" />
              <span>预览</span>
            </div>

            <div className="relative w-full aspect-[16/9] bg-black/5 rounded-lg overflow-hidden shadow-md border">
              <Image
                src={currentCover}
                alt="Cover Preview"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <h3 className="text-white font-medium text-sm truncate">
                  {title || "未命名课程"}
                </h3>
              </div>
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              {course.title}
            </div>
          </div>

          {/* 右侧：编辑区域 */}
          <div className="w-2/3 flex flex-col overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle>发布动画</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                将您的动画分享到内容广场
              </p>
            </DialogHeader>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* 讲解标题 */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  动画标题 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                  placeholder="请输入吸引人的标题"
                  className="font-medium"
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>标题将展示在广场列表中</span>
                  <span>{title.length}/50</span>
                </div>
              </div>

              {/* 封面设置 */}
              <div className="space-y-3">
                <Label>封面设置</Label>
                <Tabs value={coverType} onValueChange={(v) => setCoverType(v as CoverType)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="default">使用默认封面</TabsTrigger>
                    <TabsTrigger value="custom">上传自定义封面</TabsTrigger>
                  </TabsList>

                  <TabsContent value="custom" className="mt-4">
                    <label
                      htmlFor="cover-upload"
                      className="border-2 border-dashed border-input rounded-lg p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors group"
                    >
                      <Upload className="h-10 w-10 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <div className="text-center">
                        <div className="text-sm font-medium">点击上传封面图片</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          支持 JPG、PNG 格式，建议尺寸 16:9，文件小于 5MB
                        </div>
                      </div>
                      <input
                        id="cover-upload"
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </TabsContent>
                </Tabs>
              </div>

              {/* 标签选择 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>标签选择 <span className="text-red-500">*</span></Label>
                  <span className="text-xs text-muted-foreground">
                    已选择 {selectedTags.length}/5 个标签
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TAGS_OPTIONS.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5 text-sm transition-all hover:scale-105"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 原创声明 */}
              <div className="space-y-3 pt-2">
                <Label>原创声明</Label>
                <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30">
                  <Checkbox
                    id="original"
                    checked={isOriginal}
                    onCheckedChange={(checked) => setIsOriginal(!!checked)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="original"
                      className="text-sm font-normal cursor-pointer leading-relaxed"
                    >
                      这是我的原创内容
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      勾选此项表示您确认该内容为您的原创作品，不包含违规信息
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <DialogFooter className="p-6 pt-4 border-t bg-background">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="min-w-24"
              >
                {isSubmitting ? "发布中..." : "确认发布"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
