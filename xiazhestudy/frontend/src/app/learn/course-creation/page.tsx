"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import {
  UploadCloud, FileText, X, Sparkles, ArrowRight, ArrowLeft,
  CheckCircle2, Loader2, Play, Pause, Save, Share2, Download,
  Mic, Video, Wand2, BookOpen, GraduationCap, Coffee,
  Ghost, Rocket, BrainCircuit, Monitor, Tablet, Smartphone, Code,
  ChevronRight, Coins, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import html2canvas from "html2canvas";

// --- Types ---
type Step = 1 | 2 | 3 | 4;
type StyleOption = {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  gradient: string;
  border: string;
};

// 输入步骤组件的 Props 类型
interface InputStepProps {
  text: string;
  setText: (value: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
}

// API 基础地址
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Mock Data: AI Styles ---
const AI_STYLES: StyleOption[] = [
  { id: "humor", name: "幽默风趣", desc: "像脱口秀演员一样演绎，充满段子和笑点", icon: Ghost, gradient: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/30 hover:border-pink-500" },
  { id: "academic", name: "严谨学术", desc: "教授视角，引用数据，逻辑严密", icon: GraduationCap, gradient: "from-blue-500/20 to-indigo-500/20", border: "border-blue-500/30 hover:border-blue-500" },
  { id: "story", name: "故事讲述", desc: "通过引人入胜的故事案例来演示概念", icon: BookOpen, gradient: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30 hover:border-amber-500" },
  { id: "eli5", name: "五岁小孩", desc: "用最简单的比喻，连五岁小孩都能听懂", icon: Rocket, gradient: "from-green-500/20 to-emerald-500/20", border: "border-green-500/30 hover:border-green-500" },
  { id: "casual", name: "朋友闲聊", desc: "像朋友在咖啡厅聊天一样轻松自然", icon: Coffee, gradient: "from-orange-400/20 to-red-400/20", border: "border-orange-400/30 hover:border-orange-400" },
  { id: "tech", name: "极客硬核", desc: "深入底层原理，硬核技术流", icon: BrainCircuit, gradient: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/30 hover:border-cyan-500" },
];

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

export default function CreateCoursePage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in?redirect=/learn/course-creation");
    }
  }, [user, loading, router]);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [direction, setDirection] = useState(0);

  // Form State
  const [inputText, setInputText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("");

  // Result State
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [streamingBuffer, setStreamingBuffer] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);

  // Insufficient Credits Dialog
  const [showInsufficientCreditsDialog, setShowInsufficientCreditsDialog] = useState(false);

  const startGeneration = async () => {
    setIsGenerating(true);
    setStreamingBuffer("📤 正在提交生成任务...\n");
    setGeneratedHtml("");

    try {
      console.log("[DEBUG] 开始获取 session...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("[DEBUG] Session 结果:", { session: !!session, error: sessionError });

      if (sessionError) {
        setStreamingBuffer(`❌ 错误: 获取登录状态失败 - ${sessionError.message}`);
        setIsGenerating(false);
        return;
      }

      const token = session?.access_token;
      if (!token) {
        setStreamingBuffer("❌ 错误: 未登录，请先登录");
        setIsGenerating(false);
        return;
      }

      console.log("[DEBUG] Token 获取成功，长度:", token.length);

      let contentToSend = inputText;
      let documentId: number | null = null;

      // 如果有上传文件，先上传文档
      if (uploadedFile) {
        setStreamingBuffer("📄 正在上传文档...\n");

        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("title", uploadedFile.name);
        formData.append("description", "AI 动画生成素材");

        const uploadResponse = await fetch(`${API_BASE_URL}/api/v1/documents/upload?title=${encodeURIComponent(uploadedFile.name)}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          const errorMsg = errorData.detail || `文档上传失败 (${uploadResponse.status})`;
          setStreamingBuffer(`❌ 错误: ${errorMsg}`);
          setIsGenerating(false);
          return;
        }

        const uploadResult = await uploadResponse.json();
        documentId = uploadResult.document?.id;
        setStreamingBuffer(prev => prev + `✅ 文档上传成功！ID: ${documentId}\n📤 正在提交生成任务...\n`);

        // 对于纯文本文件，读取内容
        if (uploadedFile.name.match(/\.(txt|md)$/i)) {
          contentToSend = await uploadedFile.text();
        }
      }

      // 调用生成 API
      console.log("[DEBUG] 调用生成 API:", `${API_BASE_URL}/api/v1/courses/generate`);
      console.log("[DEBUG] 请求内容:", { document_id: documentId, content: contentToSend?.substring(0, 100), title: inputText.substring(0, 50) });

      const response = await fetch(`${API_BASE_URL}/api/v1/courses/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_id: documentId,
          content: contentToSend,
          title: inputText.substring(0, 50) || uploadedFile?.name || "AI 生成动画",
          description: inputText || uploadedFile?.name,
          difficulty: "intermediate",
        }),
      });

      console.log("[DEBUG] API 响应状态:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("[DEBUG] 错误响应:", errorData);

        // 处理 402 积分不足错误
        if (response.status === 402) {
          setStreamingBuffer("❌ 积分不足，无法生成动画");
          setIsGenerating(false);
          setShowInsufficientCreditsDialog(true);
          return;
        }

        const errorMsg = errorData.detail || `请求失败 (${response.status})`;
        setStreamingBuffer(`❌ 错误: ${errorMsg}`);
        setIsGenerating(false);
        return;
      }

      const course = await response.json();
      setCreatedCourseId(course.id);
      setStreamingBuffer(
        `✅ 任务已提交！课程ID: ${course.id}\n` +
        `📊 状态: ${course.status}\n\n` +
        `💡 提示: 您可以离开此页面，生成完成后会收到站内信通知\n\n` +
        `⏳ 正在生成中，请稍候...\n`
      );

      pollCourseStatus(course.id);

    } catch (error) {
      console.error("Generation error:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setStreamingBuffer(`❌ 错误: ${errorMsg}`);
      setIsGenerating(false);
    }
  };

  const pollCourseStatus = async (courseId: number) => {
    const maxAttempts = 120;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setStreamingBuffer(prev => prev + "\n❌ 登录已过期，请重新登录");
          setIsGenerating(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch course status");

        const course = await response.json();

        if (course.status === "completed") {
          setStreamingBuffer(prev => prev + `\n✅ 生成完成！\n`);
          const html = course.content?.generated || "";
          setGeneratedHtml(html);
          setIsGenerating(false);
          // 刷新用户数据以更新积分显示
          refreshUser();
          setTimeout(nextStep, 500);
          return;
        } else if (course.status === "failed") {
          setStreamingBuffer(prev => prev + `\n❌ 生成失败: ${course.fail_reason || "未知错误"}\n积分已自动退还`);
          setIsGenerating(false);
          // 刷新用户数据以更新积分显示（失败时积分退还）
          refreshUser();
          return;
        } else if (course.status === "processing") {
          setStreamingBuffer(prev => {
            const dots = ".".repeat((attempts % 3) + 1);
            return prev.replace(/⏳ 正在生成中.*\n?$/, `⏳ 正在生成中${dots} (${attempts * 5}秒)\n`);
          });
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setStreamingBuffer(prev => prev + `\n⚠️ 轮询超时，请在"我的动画"中查看结果`);
          setIsGenerating(false);
        }
      } catch (error) {
        console.error("Poll error:", error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setDirection(1);
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  return (
    <>
      {/* 积分不足弹窗 */}
      <Dialog open={showInsufficientCreditsDialog} onOpenChange={setShowInsufficientCreditsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-2">
              <Coins className="w-8 h-8 text-orange-500" />
            </div>
            <DialogTitle className="text-center text-xl">积分不足</DialogTitle>
            <DialogDescription className="text-center">
              生成动画需要消耗 <span className="font-semibold text-orange-500">100 积分</span>，您的积分余额不足。
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-lg p-4 my-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              充值方式
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 前往个人中心进行充值</li>
              <li>• 购买会员获取更多积分</li>
              <li>• 邀请好友可获得积分奖励</li>
            </ul>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowInsufficientCreditsDialog(false)}
              className="w-full sm:w-auto"
            >
              稍后再说
            </Button>
            <Button
              onClick={() => router.push('/user-center')}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 text-white"
            >
              <Coins className="mr-2 h-4 w-4" />
              前往充值
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">创作工作室</h1>
          <p className="text-muted-foreground mt-1">让 AI 将您的想法转化为互动动画</p>
        </div>

        {/* Progress Stepper */}
        <StepIndicator currentStep={currentStep} />

        {/* Main Content Card */}
        <motion.div
          layout
          className={cn(
            "mt-8 bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden flex flex-col",
            currentStep === 4 ? "h-[calc(100vh-280px)] min-h-[700px]" : "min-h-[600px]"
          )}
        >
          <div className="p-6 md:p-8 flex-1 relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full"
              >
                {currentStep === 1 && (
                  <InputStep
                    text={inputText}
                    setText={setInputText}
                    file={uploadedFile}
                    setFile={setUploadedFile}
                  />
                )}
                {currentStep === 2 && (
                  <StyleSelectionStep
                    selected={selectedStyle}
                    onSelect={setSelectedStyle}
                  />
                )}
                {currentStep === 3 && (
                  <GenerationProcessStep
                    streamingBuffer={streamingBuffer}
                    isGenerating={isGenerating}
                    onStart={startGeneration}
                  />
                )}
                {currentStep === 4 && (
                  <ResultPreviewStep html={generatedHtml} setHtml={setGeneratedHtml} courseId={createdCourseId} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          {currentStep !== 3 && (
            <div className="bg-muted/20 border-t border-border/50 p-6 flex justify-between items-center backdrop-blur-sm">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={cn("transition-opacity", currentStep === 1 ? "opacity-0" : "opacity-100")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> 上一步
              </Button>

              {currentStep < 3 && (
                <Button
                  onClick={nextStep}
                  size="lg"
                  disabled={
                    (currentStep === 1 && !inputText && !uploadedFile) ||
                    (currentStep === 2 && !selectedStyle)
                  }
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all hover:scale-105"
                >
                  {currentStep === 2 ? "开始魔法生成" : "下一步"} <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </>
  );
}

// --- Sub-Components ---

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = [
    { id: 1, name: "输入内容", icon: FileText },
    { id: 2, name: "选择风格", icon: Wand2 },
    { id: 3, name: "AI 生成", icon: Sparkles },
    { id: 4, name: "预览导出", icon: Monitor },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-muted z-0"></div>
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => {
          const isActive = currentStep >= step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isActive ? "var(--background)" : "var(--muted)",
                  borderColor: isActive ? "#9333ea" : "transparent"
                }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                  isActive ? "bg-background border-purple-600 text-purple-600 shadow-[0_0_0_4px_rgba(147,51,234,0.1)]" : "bg-muted text-muted-foreground border-transparent"
                )}
              >
                {isActive ? (
                  step.id < currentStep ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </motion.div>
              <span className={cn(
                "text-xs font-medium absolute top-12 whitespace-nowrap transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InputStep({ text, setText, file, setFile }: InputStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid md:grid-cols-2 gap-8 h-full">
      {/* Left: Text Input */}
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-200 px-3 py-1">
            方式一
          </Badge>
          <h3 className="font-semibold">直接输入文本</h3>
        </div>
        <div className="flex-1 relative group">
          <Textarea
            placeholder="在此处粘贴文章、笔记或学习资料..."
            className="w-full h-full min-h-[300px] p-6 resize-none bg-secondary/20 border-border/50 focus:ring-purple-500/50 focus:border-purple-500 transition-all rounded-xl text-base leading-relaxed"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full border shadow-sm">
            {text.length} 字
          </div>
        </div>
      </div>

      {/* Right: File Upload */}
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50/50 text-purple-600 border-purple-200 px-3 py-1">
            方式二
          </Badge>
          <h3 className="font-semibold">上传文档</h3>
        </div>

        <div
          className={cn(
            "flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-all duration-200 cursor-pointer relative overflow-hidden group",
            dragActive ? "border-purple-500 bg-purple-50/50 scale-[0.99]" : "border-border/50 bg-secondary/10 hover:border-purple-500/50 hover:bg-secondary/20",
            file ? "border-green-500/30 bg-green-50/30" : ""
          )}
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".txt,.pdf,.doc,.docx,.md"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />

          {/* Animated Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {file ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center relative z-10">
              <div className="w-20 h-20 mx-auto bg-white dark:bg-green-900/20 rounded-full shadow-lg flex items-center justify-center mb-4 text-green-500 relative">
                <FileText size={32} />
                <div className="absolute -right-1 -top-1 bg-green-500 text-white rounded-full p-1">
                  <CheckCircle2 size={12} />
                </div>
              </div>
              <p className="font-semibold text-lg truncate max-w-[200px] mx-auto">{file.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-6 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" 
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                <X size={14} className="mr-1" /> 移除文件
              </Button>
            </motion.div>
          ) : (
            <div className="text-center space-y-4 relative z-10 group-hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center text-purple-500 mb-2">
                <UploadCloud size={36} />
              </div>
              <div>
                <p className="font-semibold text-lg text-foreground">点击或拖拽文件到此处</p>
                <p className="text-sm text-muted-foreground mt-2">支持 PDF, Word, Markdown, TXT</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StyleSelectionStep({ selected, onSelect }: { selected: string, onSelect: (id: string) => void }) {
  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent inline-block">选择 AI 讲解风格</h2>
        <p className="text-muted-foreground">选择最适合您内容的叙事方式</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto pr-2 flex-1">
        {AI_STYLES.map((style) => (
          <motion.div
            key={style.id}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(style.id)}
            className={cn(
              "relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 flex flex-col gap-4 group",
              selected === style.id
                ? `bg-gradient-to-br ${style.gradient} border-purple-500 shadow-lg ring-1 ring-purple-500/50`
                : `bg-card ${style.border} hover:shadow-md`
            )}
          >
            <div className="flex items-start justify-between">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                selected === style.id ? "bg-white/80 text-purple-600 shadow-sm" : "bg-secondary text-muted-foreground group-hover:bg-secondary/80"
              )}>
                <style.icon size={24} />
              </div>
              {selected === style.id && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-purple-600">
                  <CheckCircle2 size={24} className="fill-purple-100" />
                </motion.div>
              )}
            </div>
            
            <div>
              <h4 className={cn("font-bold text-lg mb-1", selected === style.id ? "text-purple-900 dark:text-purple-100" : "text-foreground")}>
                {style.name}
              </h4>
              <p className={cn("text-sm leading-relaxed", selected === style.id ? "text-purple-800/80 dark:text-purple-200/80" : "text-muted-foreground")}>
                {style.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function GenerationProcessStep({ streamingBuffer, isGenerating, onStart }: {
  streamingBuffer: string;
  isGenerating: boolean;
  onStart: () => void;
}) {
  const hasStartedRef = useRef(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isGenerating && streamingBuffer === "" && !hasStartedRef.current) {
      timer = setTimeout(() => {
        hasStartedRef.current = true;
        onStart();
      }, 500);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [isGenerating, streamingBuffer, onStart]);

  return (
    <div className="flex flex-col items-center justify-center h-full py-8 max-w-3xl mx-auto w-full">
      <div className="relative mb-8">
        {isGenerating && (
          <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse"></div>
        )}
        <div className="relative bg-background p-8 rounded-full border border-border shadow-xl">
          <Wand2 size={56} className={cn("text-purple-500", isGenerating && "animate-pulse")} />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-2">
        {isGenerating ? "AI 正在施展魔法..." : "生成任务已完成"}
      </h2>
      <p className="text-muted-foreground mb-8">
        {isGenerating ? "正在解析内容并生成互动动画脚本，请稍候" : "您的动画已准备就绪"}
      </p>

      {/* Glassmorphism Terminal */}
      <div className="w-full flex-1 max-h-[300px] bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col font-mono text-sm">
        <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="ml-4 text-xs text-white/40">console — ai-generator</div>
        </div>
        
        <div className="p-4 overflow-y-auto custom-scrollbar text-green-400/90 space-y-1 flex-1">
          <div className="whitespace-pre-wrap leading-relaxed">
            {streamingBuffer || "> 等待指令..."}
          </div>
          {isGenerating && (
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-2.5 h-5 bg-green-500 align-middle ml-1"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ResultPreviewStep({ html, setHtml, courseId }: { html: string, setHtml: (s: string) => void, courseId: number | null }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const thumbnailCaptured = useRef(false);
  const captureContainerRef = useRef<HTMLDivElement>(null);

  // 生成并上传缩略图
  useEffect(() => {
    const captureThumbnail = async () => {
      if (!html || !courseId || thumbnailCaptured.current) return;
      thumbnailCaptured.current = true;

      try {
        // 等待页面渲染
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 提取 body 内容和样式
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 创建隐藏容器
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;height:600px;overflow:hidden;background:white;';

        // 复制样式
        const styles = doc.querySelectorAll('style');
        styles.forEach(style => {
          const newStyle = document.createElement('style');
          newStyle.textContent = style.textContent;
          container.appendChild(newStyle);
        });

        // 复制 body 内容
        const bodyContent = doc.body.innerHTML;
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = bodyContent;
        contentDiv.style.cssText = 'width:100%;height:100%;overflow:hidden;';
        container.appendChild(contentDiv);

        document.body.appendChild(container);

        // 等待内容渲染
        await new Promise(resolve => setTimeout(resolve, 500));

        // 使用 html2canvas 截图
        const canvas = await html2canvas(container, {
          width: 800,
          height: 600,
          scale: 0.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });

        document.body.removeChild(container);

        // 转换为 Blob
        const blob = await new Promise<Blob | null>(resolve => {
          canvas.toBlob(resolve, 'image/jpeg', 0.85);
        });

        if (!blob) return;

        // 获取 token
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        // 上传图片
        const formData = new FormData();
        formData.append('file', blob, `course_${courseId}_cover.jpg`);

        const uploadRes = await fetch(`${API_BASE_URL}/api/v1/upload/course/cover`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) return;

        const uploadData = await uploadRes.json();
        const coverUrl = uploadData.url;

        // 更新课程封面
        await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cover_image: coverUrl }),
        });

        console.log('Thumbnail captured and uploaded:', coverUrl);
      } catch (error) {
        console.error('Failed to capture thumbnail:', error);
      }
    };

    captureThumbnail();
  }, [html, courseId]);

  const handleExportHtml = async () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AI动画_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!courseId) return;
    setIsPublishing(true);
    try {
      // 先获取 token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        console.error('未登录');
        return;
      }

      // 调用发布 API，将作品设为公开
      const publishRes = await fetch(`${API_BASE_URL}/api/v1/courses/${courseId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!publishRes.ok) {
        const error = await publishRes.json().catch(() => ({}));
        // 如果已经发布过，继续复制链接
        if (publishRes.status !== 400 || !error.detail?.includes('already')) {
          console.error('发布失败:', error);
        }
      }

      // 复制分享链接
      const shareUrl = `${window.location.origin}/share/${courseId}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('分享失败:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-muted/30 rounded-lg border border-border/50">
        <div className="flex bg-background rounded-md border shadow-sm p-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewMode('desktop')}
            className={cn("h-8 px-3 rounded-sm", viewMode === 'desktop' && "bg-muted")}
          >
            <Monitor size={14} className="mr-2" /> 桌面
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewMode('tablet')}
            className={cn("h-8 px-3 rounded-sm", viewMode === 'tablet' && "bg-muted")}
          >
            <Tablet size={14} className="mr-2" /> 平板
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewMode('mobile')}
            className={cn("h-8 px-3 rounded-sm", viewMode === 'mobile' && "bg-muted")}
          >
            <Smartphone size={14} className="mr-2" /> 手机
          </Button>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCode(!showCode)} className="h-9">
            <Code size={14} className="mr-2" /> {showCode ? '预览' : '源码'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => {
            const iframe = document.querySelector('iframe');
            if (iframe) iframe.srcdoc = iframe.srcdoc;
          }} className="h-9">
            <Play size={14} className="mr-2" /> 重播
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center bg-secondary/20 rounded-xl border border-border/50 relative overflow-auto">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none dark:opacity-10" />

        {showCode ? (
          <div className="w-full h-full absolute inset-0 bg-gray-900 p-6 overflow-auto">
            <pre className="font-mono text-xs text-blue-300 leading-relaxed">{html}</pre>
          </div>
        ) : (
          <motion.div
            layout
            className={cn(
              "transition-all duration-500 shadow-2xl overflow-hidden border border-border bg-white relative z-10",
              viewMode === 'mobile'
                ? "w-[375px] h-[667px] max-h-[80vh] rounded-[2.5rem] border-[8px] border-gray-800"
                : viewMode === 'tablet'
                ? "w-[600px] h-[800px] max-h-[80vh] rounded-2xl"
                : "w-full h-full rounded-xl"
            )}
          >
            <iframe
              srcDoc={html}
              className={cn(
                "w-full h-full border-none bg-white",
                viewMode === 'mobile' ? "rounded-[2rem]" :
                viewMode === 'tablet' ? "rounded-xl" :
                "rounded-xl"
              )}
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Button variant="secondary" onClick={handleExportHtml} className="w-full">
          <Download className="mr-2 h-4 w-4" /> 导出 HTML
        </Button>
        <Button variant="secondary" onClick={handleShare} disabled={isPublishing} className="w-full">
          {isPublishing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 发布中...</>
          ) : (
            <><Share2 className="mr-2 h-4 w-4" /> {copySuccess ? '已复制!' : '分享链接'}</>
          )}
        </Button>
        <Button onClick={() => router.push('/learn/my-courses')} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
          <Save className="mr-2 h-4 w-4" /> 保存并查看
        </Button>
      </div>
    </div>
  );
}