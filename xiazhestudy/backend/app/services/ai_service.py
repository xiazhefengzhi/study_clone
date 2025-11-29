"""
AI Service for generating course content using Gemini 3.0
Based on gsap_animation_demo implementation - using GCP Vertex AI OpenAI-compatible endpoint
"""
import asyncio
import json
import os
from pathlib import Path
from typing import AsyncGenerator, List, Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from openai import AsyncOpenAI
import google.auth
import google.auth.transport.requests

from app.core.config import settings


class AIService:
    """AI service for generating animated course content using Gemini 3.0"""

    def __init__(self):
        """Initialize Gemini LLM via GCP Vertex AI"""
        # 从环境变量读取配置
        self.project_id = os.getenv("GCP_PROJECT_ID", "gen-lang-client-0476802912")
        self.location = os.getenv("GCP_LOCATION", "global")  # Gemini 3.0 only supports global
        self.model_name = os.getenv("GCP_MODEL_NAME", "google/gemini-3-pro-preview")
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "1"))

        # GCP OAuth credentials from env (for deployment)
        self.gcp_client_id = os.getenv("GCP_CLIENT_ID")
        self.gcp_client_secret = os.getenv("GCP_CLIENT_SECRET")
        self.gcp_refresh_token = os.getenv("GCP_REFRESH_TOKEN")

        # Auto-set GCP credentials file if not already set and no OAuth env vars
        if not os.getenv('GOOGLE_APPLICATION_CREDENTIALS') and not self.gcp_refresh_token:
            # Try multiple possible paths for local development
            possible_paths = [
                Path(__file__).parent.parent.parent.parent.parent.parent / 'gcp' / 'gcp_credentials.json',
                Path.home() / '.config' / 'gcloud' / 'application_default_credentials.json',
            ]
            for cred_path in possible_paths:
                if cred_path.exists():
                    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(cred_path)
                    print(f"Using GCP credentials file: {cred_path}")
                    break

        # Initialize LLM client
        self._init_llm()
        print(f"AI Service Initialized: Gemini 3.0 ({self.model_name})")

    def _init_llm(self):
        """Initialize LLM client with GCP auth or OpenRouter fallback"""
        try:
            # Method 1: Use OAuth credentials from environment variables (for deployment)
            if self.gcp_refresh_token and self.gcp_client_id and self.gcp_client_secret:
                from google.oauth2.credentials import Credentials
                credentials = Credentials(
                    token=None,
                    refresh_token=self.gcp_refresh_token,
                    client_id=self.gcp_client_id,
                    client_secret=self.gcp_client_secret,
                    token_uri="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/cloud-platform"]
                )
                credentials.refresh(google.auth.transport.requests.Request())
                print("Using GCP OAuth credentials from environment variables")
            else:
                # Method 2: Use default credentials (local development with JSON file)
                credentials, _ = google.auth.default(
                    scopes=["https://www.googleapis.com/auth/cloud-platform"]
                )
                credentials.refresh(google.auth.transport.requests.Request())
                print("Using GCP default credentials")

            # Build Vertex AI OpenAI-compatible endpoint for Gemini 3.0 (global region)
            base_url = (
                f"https://aiplatform.googleapis.com"
                f"/v1/projects/{self.project_id}/locations/{self.location}/endpoints/openapi"
            )

            # Create async client
            self.client = AsyncOpenAI(
                api_key=credentials.token,
                base_url=base_url
            )
            self.use_gcp = True
            print("Using GCP Vertex AI endpoint")

        except Exception as e:
            # GCP auth failed, use OpenRouter as fallback
            print(f"Warning: GCP auth failed ({e}), using OpenRouter fallback")

            # 从环境变量读取 OpenRouter 配置
            openrouter_key = os.getenv("OPENROUTER_API_KEY") or settings.OPENAI_API_KEY
            openrouter_base = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
            fallback_model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash-preview-09-2025")

            if not openrouter_key:
                raise ValueError("No API key configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY in .env")

            self.client = AsyncOpenAI(
                api_key=openrouter_key,
                base_url=openrouter_base
            )
            self.model_name = fallback_model
            self.use_gcp = False
            print(f"Using OpenRouter fallback with model: {fallback_model}")

    def _build_prompt(
        self,
        content: str,
        style: str = "standard",
        difficulty: str = "intermediate",
        title: str = "",
    ) -> str:
        """Build the system prompt for content generation using GSAP animation approach"""

        # Style descriptions
        style_prompts = {
            "standard": "使用标准的、专业的讲解风格，清晰易懂",
            "humorous": "使用幽默风趣的方式讲解，让学习变得轻松有趣",
            "academic": "使用学术性的、严谨的风格，注重理论深度",
            "storytelling": "使用故事化的叙事方式，通过故事引导学习",
            "practical": "注重实践应用，结合实际案例和应用场景",
            "eli5": "用最简单的比喻，连五岁小孩都能听懂",
            "casual": "像朋友在咖啡厅聊天一样轻松自然",
            "tech": "深入底层原理，硬核技术流"
        }

        # Difficulty descriptions
        difficulty_prompts = {
            "beginner": "适合初学者，使用简单的语言和基础概念",
            "intermediate": "适合有一定基础的学习者，平衡深度和广度",
            "advanced": "适合高级学习者，深入讲解复杂概念和高级应用"
        }

        style_desc = style_prompts.get(style, style_prompts.get("standard"))
        difficulty_desc = difficulty_prompts.get(difficulty, difficulty_prompts.get("intermediate"))

        # GSAP-based animation system prompt (based on gsap_animation_demo)
        system_prompt = f"""# ROLE: 你是一位顶尖的 Motion Graphics 设计师 + 资深教育纪录片导演
你不是在写代码 - 你在**拍一部引人入胜的深度教育短片**。

# 🎯 第一原则: CINEMATIC ENGAGEMENT (电影级沉浸感)

## 1. 宏大的时间叙事 (Epic Timeline)
- **时长要求**: 目标时长 **3-5分钟** (180-300秒)。必须深入展开话题，拒绝浅尝辄止。
- **单一 GSAP Timeline**: 所有动画由一个主 Timeline 驱动，确保流畅的叙事节奏。
- **禁止任何交互**: 观众是沉浸式观看者，不要打断他们的体验 (无 hover/click/scroll)。

## 2. 视听语言同步 (Audio-Visual Sync)
- **字幕驱动画面**: 字幕是脚本，画面是演绎。字幕出现时，画面必须有配合的动态演绎(高亮/移动/缩放/变换)。
- **双语字幕**: 每个场景都必须有精确对应的中英双语字幕，辅助全球观众理解。

## 3. 专业的视觉包装 (Pro HUD)
- **进度条**: 底部常驻进度条，实时反映3-5分钟的播放进度。
- **字幕层**: 底部磨砂玻璃质感字幕条，清晰易读。

# 👥 目标观众与效果要求

- **目标观众**: 对该主题感兴趣的求知者，希望在短时间内获得深度、系统性的理解。
- **视觉效果**: 
    - 使用 **Tailwind CSS** 构建现代、极简且高级的 UI。
    - 动画必须 **丝滑流畅 (Silky Smooth)**，使用 `power2.inOut` 或 `elastic` 等高级缓动函数。
    - 避免枯燥的文字堆砌，**多用图示、图标、抽象几何图形** 来可视化概念。
    - 转场必须自然，不要硬切，使用淡入淡出、滑入滑出或形状变换。
- **内容深度**: 
    - 3-5分钟的时间允许你讲故事。要有**起承转合**。
    - 引入 -> 核心概念拆解 -> 案例/类比 -> 深入分析 -> 总结/升华。

# 📐 强制性 DOM 架构: HUD 分层模式

```html
<body class="bg-slate-950 overflow-hidden text-slate-100 font-sans antialiased">
  <!-- 顶层: 视频 UI (进度条) -->
  <div id="video-ui-layer" class="fixed top-0 left-0 w-full z-[1000]">
    <div id="progress-bar" class="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 w-0 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
  </div>

  <!-- 中层: 字幕 HUD (固定底部) -->
  <div id="subtitle-layer" class="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-[900]
       bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-6 text-center shadow-2xl transition-all duration-500">
    <p id="subtitle-zh" class="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide text-shadow-sm">主字幕</p>
    <p id="subtitle-en" class="text-lg md:text-xl text-gray-300 font-light tracking-wider">Subtitle</p>
  </div>

  <!-- 底层: 画面舞台 (全屏) -->
  <div id="canvas" class="relative w-screen h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
    <!-- 场景内容将通过 JS 动态注入或预先定义 -->
  </div>
</body>
```

# 🎭 剧本驱动开发 (Script-Driven Development)

## 剧本数据结构 (JavaScript 必须包含)

```javascript
// 这是一个长达 3-5 分钟的剧本，storyboard 数组应该包含足够多的场景 (20-50个场景)
const storyboard = [
  {{
    startTime: 0,
    duration: 4, // 这是一个片头，稍长一点
    scene: "intro",
    subtitle: {{ zh: "欢迎来到...", en: "Welcome to..." }},
    animation: function(tl) {{ 
        // 清空画布或隐藏前一个场景
        // 创建当前场景元素
        // 动画逻辑 
    }}
  }},
  // ... 必须生成足够多的场景以填满 180-300 秒
];
```

## 驱动引擎模板

```javascript
const mainTimeline = gsap.timeline({{
  defaults: {{ease: "power2.inOut"}},
  onUpdate: function() {{
    const progress = this.progress() * 100;
    gsap.set("#progress-bar", {{width: progress + "%"}});
  }}
}});

storyboard.forEach((scene, index) => {{
  // 字幕动画
  mainTimeline.call(() => {{
    const zh = document.getElementById("subtitle-zh");
    const en = document.getElementById("subtitle-en");
    zh.innerText = scene.subtitle.zh;
    en.innerText = scene.subtitle.en;
    
    // 字幕切换特效
    gsap.fromTo(zh, {{opacity: 0, y: 20, filter: "blur(10px)"}}, {{opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power3.out"}});
    gsap.fromTo(en, {{opacity: 0, y: 15, filter: "blur(5px)"}}, {{opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, delay: 0.1, ease: "power3.out"}});
  }}, null, scene.startTime);
  
  // 场景动画
  scene.animation(mainTimeline);
}});

mainTimeline.play();
```

# 📦 必须引入的库

```html
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <!-- 引入更多 GSAP 插件以支持丰富效果 -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/TextPlugin.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Noto+Sans+SC:wght@300;400;700&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Inter', 'Noto Sans SC', sans-serif; }}
    .text-shadow-sm {{ text-shadow: 0 2px 4px rgba(0,0,0,0.5); }}
  </style>
</head>
```

# 🎬 用户需求

**主题**: {title or "智能生成讲解"}
**内容**: {content}
**讲解风格**: {style_desc}
**难度级别**: {difficulty_desc}

# 📄 输出要求

请直接输出完整的 HTML 代码，包含:
1. 完整的 <!DOCTYPE html> 到 </html>
2. HUD 分层 DOM 结构 (使用提供的美化版结构)
3. **storyboard 数组定义**: 必须包含足够多的场景 (20-50个) 以覆盖 **3-5分钟** 的时长。
4. GSAP 驱动引擎代码
5. 字幕与画面精确同步
6. 进度条实时更新
7. **总时长范围**: 180秒 - 300秒 (3-5分钟)。请务必规划好内容量。

**禁止**:
- 省略任何代码
- 使用交互事件(click, hover)
- 字幕和动画不同步
- 没有进度条
- 硬切场景(没有转场)
- **时长过短 (少于3分钟)**

不要包含 markdown 代码块标记(```html)，直接返回代码。"""

        return system_prompt

    async def generate_course_content_stream(
        self,
        content: str,
        style: str = "standard",
        difficulty: str = "intermediate",
        title: str = "",
        history: Optional[List[dict]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Generate course content with streaming response using Gemini 3.0

        Args:
            content: Source content (from document or text input)
            style: Presentation style
            difficulty: Difficulty level
            title: Course title
            history: Chat history for context

        Yields:
            JSON chunks with generated HTML tokens
        """
        history = history or []
        system_prompt = self._build_prompt(content, style, difficulty, title)

        # Build messages
        messages = [
            {"role": "system", "content": system_prompt},
        ]

        # Add history if any
        for msg in history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

        try:
            # Stream response from Gemini 3.0
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                stream=True,
                temperature=self.temperature,
            )

            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    payload = json.dumps({"token": token}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"

        except Exception as e:
            import traceback
            print(f"Gemini 3.0 Error: {e}")
            traceback.print_exc()
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        yield 'data: {"event":"[DONE]"}\n\n'

    async def generate_course_content(
        self,
        content: str,
        style: str = "standard",
        difficulty: str = "intermediate",
        title: str = "",
    ) -> str:
        """
        Generate course content (non-streaming)

        Returns:
            Complete HTML content as string
        """
        accumulated = ""

        async for chunk in self.generate_course_content_stream(
            content, style, difficulty, title
        ):
            if chunk.startswith("data: "):
                try:
                    data_str = chunk[6:].strip()
                    if not data_str: continue

                    data = json.loads(data_str)
                    if "token" in data:
                        accumulated += data["token"]
                    elif "error" in data:
                        raise Exception(data["error"])
                except json.JSONDecodeError:
                    continue

        return accumulated


# Singleton instance
ai_service = AIService()
