# AI 生成服务使用指南

## 概述

KnowFun 的 AI 生成服务基于 fogsight 项目实现，使用 OpenAI/Gemini 模型生成精美的 HTML 动画讲解视频。

## 后端配置

### 环境变量 (.env)

```bash
# 使用 OpenAI (GPT-4)
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

# 或使用 Google Gemini
OPENAI_API_KEY=AIza...  # Gemini API key (不是 sk- 开头)
OPENAI_MODEL=gemini-2.0-flash-exp

# 或使用 OpenRouter (支持多种模型)
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=anthropic/claude-3.5-sonnet
```

## API 端点

### 1. 从文档生成讲解 (流式)

```http
POST /api/v1/ai/generate/document
Content-Type: application/json
Authorization: Bearer <token>

{
  "document_id": 123,
  "style": "standard",
  "difficulty": "intermediate",
  "title": "Python 基础教程"
}
```

**响应**: Server-Sent Events (SSE) 流

```
data: {"token": "<!DOCTYPE html>"}
data: {"token": "<html>"}
...
data: {"event": "[DONE]"}
```

### 2. 从文本生成讲解 (流式)

```http
POST /api/v1/ai/generate/text
Content-Type: application/json
Authorization: Bearer <token>

{
  "text": "讲解 Python 的列表推导式...",
  "style": "humorous",
  "difficulty": "beginner",
  "title": "列表推导式速成"
}
```

### 3. 重新生成讲解 (带反馈)

```http
POST /api/v1/ai/regenerate
Content-Type: application/json
Authorization: Bearer <token>

{
  "course_id": 456,
  "feedback": "请增加更多的代码示例，并使用更简单的语言"
}
```

## 参数说明

### style (讲解风格)

- `standard` - 标准专业风格，清晰易懂
- `humorous` - 幽默风趣，轻松有趣
- `academic` - 学术严谨，注重理论
- `storytelling` - 故事化叙事，引人入胜
- `practical` - 注重实践，结合案例

### difficulty (难度级别)

- `beginner` - 初学者，基础概念
- `intermediate` - 中级，平衡深度和广度
- `advanced` - 高级，深入复杂概念

## 前端使用示例

### React/Next.js 流式生成

```typescript
import { apiClient } from '@/lib/api-client'
import { useState } from 'react'

function AIGenerationDemo() {
  const [content, setContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateCourse = async () => {
    setIsGenerating(true)
    setContent('')

    try {
      // 使用异步生成器接收流式响应
      for await (const token of apiClient.generateFromText(
        "讲解 Python 列表推导式",
        "standard",
        "intermediate",
        "列表推导式教程"
      )) {
        setContent(prev => prev + token)
      }
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div>
      <button onClick={generateCourse} disabled={isGenerating}>
        {isGenerating ? '生成中...' : '生成讲解'}
      </button>

      {content && (
        <div>
          <h3>生成的内容:</h3>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )}
    </div>
  )
}
```

### 带进度显示的生成

```typescript
const [progress, setProgress] = useState(0)
const [accumulated, setAccumulated] = useState('')

const generateWithProgress = async () => {
  setProgress(0)
  setAccumulated('')
  let tokenCount = 0

  for await (const token of apiClient.generateFromDocument(
    documentId,
    style,
    difficulty,
    title,
    (token) => {
      // onToken 回调
      tokenCount++
      setProgress(Math.min((tokenCount / 1000) * 100, 99))
    }
  )) {
    setAccumulated(prev => prev + token)
  }

  setProgress(100)
}
```

## 生成结果示例

生成的 HTML 包含：

1. **完整的 HTML 结构**
2. **内联 CSS 样式** (精美的视觉设计)
3. **JavaScript 动画** (流畅的动画效果)
4. **SVG 图形** (矢量图标和插图)
5. **双语字幕** (中英文)
6. **自动播放** (无需交互)

示例输出:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Arial', sans-serif;
    }
    .container {
      width: 1920px;
      height: 1080px;
      position: relative;
      overflow: hidden;
    }
    /* ... 更多样式 ... */
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title animate-in">Python 列表推导式</h1>
    <div class="subtitle">List Comprehensions</div>
    <!-- 动画内容 -->
  </div>

  <script>
    // 自动播放动画
    const timeline = gsap.timeline();
    timeline.to('.title', { opacity: 1, duration: 1 });
    // ... 更多动画 ...
  </script>
</body>
</html>
```

## 工作原理

### 1. Prompt Engineering

AI 服务使用精心设计的 system prompt:

```python
system_prompt = f"""请你生成一个非常精美的动态动画讲解视频...

**讲解要求**：
- 标题：{title}
- 讲解风格：{style_desc}
- 难度级别：{difficulty_desc}

**技术要求**：
1. 生成完整的 HTML 动画页面
2. 流畅自然的动画效果
3. 完整的知识讲解过程
4. 极为精美的页面设计
5. 双语字幕（中英文）
..."""
```

### 2. 流式生成

- 使用 SSE (Server-Sent Events) 实现流式响应
- 逐 token 返回，提供实时反馈
- 前端使用 AsyncGenerator 接收

### 3. 模型支持

- **OpenAI**: GPT-4, GPT-4-turbo
- **Gemini**: gemini-2.0-flash-exp, gemini-2.5-pro
- **OpenRouter**: 支持 Claude, Llama 等多种模型

## 性能优化建议

1. **使用合适的模型**
   - 开发/测试: `gemini-2.0-flash-exp` (快速、便宜)
   - 生产环境: `gpt-4o` 或 `gemini-2.5-pro` (质量更高)

2. **缓存生成结果**
   - 相同输入的生成结果可以缓存
   - 减少 API 调用成本

3. **异步处理**
   - 前端使用 streaming 实时显示
   - 后端可以并行处理多个请求

## 成本估算

以 1000 tokens 输入，5000 tokens 输出为例：

- **Gemini Flash**: ~$0.001/次
- **GPT-4**: ~$0.15/次
- **GPT-4-turbo**: ~$0.05/次

建议：开发环境使用 Gemini Flash，生产环境根据质量需求选择。

## 故障排查

### 1. API Key 错误

```
Error: Invalid API key
```

**解决**: 检查 `.env` 文件中的 `OPENAI_API_KEY`

### 2. 生成中断

```
Error: Stream interrupted
```

**原因**: 网络问题或请求超时

**解决**:
- 增加超时时间
- 检查网络连接
- 重试生成

### 3. 生成质量差

**优化方法**:
- 提供更详细的输入内容
- 调整 style 和 difficulty 参数
- 尝试不同的模型
- 使用 regenerate 端点并提供反馈

## 下一步

1. **添加文档解析** - 提取 PDF/PPT/Word 的文本内容
2. **内容后处理** - 优化生成的 HTML 代码
3. **模板系统** - 预设多种动画模板
4. **评分系统** - 用户评价生成质量
5. **多语言支持** - 支持更多语言的讲解

---

**参考项目**: [fogsight-master](https://github.com/fogsightai/fogsight)
**更新时间**: 2025-11-14
