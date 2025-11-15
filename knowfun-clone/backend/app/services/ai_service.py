"""
AI Service for generating course content using Gemini/OpenAI
Based on fogsight-master implementation
"""
import asyncio
import json
import os
from typing import AsyncGenerator, List, Optional
from openai import AsyncOpenAI, OpenAIError

try:
    import google.generativeai as genai
except ModuleNotFoundError:
    from google import genai

from app.core.config import settings


class AIService:
    """AI service for generating animated course content"""

    def __init__(self):
        """Initialize AI client based on API key type"""
        # Check if using Gemini or OpenAI
        api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")

        if api_key.startswith("sk-"):
            # OpenAI or OpenRouter
            self.client = AsyncOpenAI(
                api_key=api_key,
                base_url=settings.OPENAI_BASE_URL or "https://api.openai.com/v1"
            )
            self.use_gemini = False
            self.model = settings.OPENAI_MODEL or "gpt-4o"
        else:
            # Google Gemini
            os.environ["GEMINI_API_KEY"] = api_key
            self.gemini_client = genai.Client()
            self.use_gemini = True
            self.model = settings.OPENAI_MODEL or "gemini-2.0-flash-exp"

    def _build_prompt(
        self,
        content: str,
        style: str = "standard",
        difficulty: str = "intermediate",
        title: str = "",
    ) -> str:
        """Build the system prompt for content generation"""

        # Style descriptions
        style_prompts = {
            "standard": "使用标准的、专业的讲解风格，清晰易懂",
            "humorous": "使用幽默风趣的方式讲解，让学习变得轻松有趣",
            "academic": "使用学术性的、严谨的风格，注重理论深度",
            "storytelling": "使用故事化的叙事方式，通过故事引导学习",
            "practical": "注重实践应用，结合实际案例和应用场景"
        }

        # Difficulty descriptions
        difficulty_prompts = {
            "beginner": "适合初学者，使用简单的语言和基础概念",
            "intermediate": "适合有一定基础的学习者，平衡深度和广度",
            "advanced": "适合高级学习者，深入讲解复杂概念和高级应用"
        }

        style_desc = style_prompts.get(style, style_prompts["standard"])
        difficulty_desc = difficulty_prompts.get(difficulty, difficulty_prompts["intermediate"])

        system_prompt = f"""请你生成一个非常精美的动态动画讲解视频，讲解以下内容：

{content}

**讲解要求**：
- 标题：{title or "智能生成讲解"}
- 讲解风格：{style_desc}
- 难度级别：{difficulty_desc}

**技术要求**：
1. 生成一个完整的、动态的HTML动画页面
2. 动画要流畅自然，像一个正在播放的教学视频
3. 包含完整的知识讲解过程，从头到尾把知识点讲清楚
4. 页面要极为精美，有设计感，能够很好地传达知识
5. 附带旁白式的文字解说，双语字幕（中英文）
6. 不需要任何互动按钮，直接自动播放
7. 使用和谐好看的浅色配色方案
8. 使用丰富的视觉元素（图表、图标、动画等）

**视觉要求**：
- 确保所有元素都在2K分辨率容器中正确摆放
- 避免穿模、字幕遮挡、图形位置错误等问题
- 保证正确的视觉传达效果

**输出格式**：
请直接输出完整的HTML代码，包含：
- HTML结构
- 内联的CSS样式
- JavaScript动画逻辑
- SVG图形（如需要）

请确保代码可以直接在浏览器中运行，无需任何外部依赖。"""

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
        Generate course content with streaming response

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

        if self.use_gemini:
            # Use Gemini API
            try:
                full_prompt = system_prompt + "\n\n" + content
                if history:
                    history_text = "\n".join([
                        f"{msg['role']}: {msg['content']}"
                        for msg in history
                    ])
                    full_prompt = history_text + "\n\n" + full_prompt

                # Run Gemini in executor to avoid blocking
                response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.gemini_client.models.generate_content(
                        model=self.model,
                        contents=full_prompt
                    )
                )

                text = response.text
                chunk_size = 50

                # Stream in chunks
                for i in range(0, len(text), chunk_size):
                    chunk = text[i:i+chunk_size]
                    payload = json.dumps({"token": chunk}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"
                    await asyncio.sleep(0.05)

            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                return
        else:
            # Use OpenAI API
            messages = [
                {"role": "system", "content": system_prompt},
                *history,
                {"role": "user", "content": content},
            ]

            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    stream=True,
                    temperature=0.8,
                )
            except OpenAIError as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                return

            async for chunk in response:
                token = chunk.choices[0].delta.content or ""
                if token:
                    payload = json.dumps({"token": token}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"
                    await asyncio.sleep(0.001)

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
                    data = json.loads(chunk[6:])
                    if "token" in data:
                        accumulated += data["token"]
                    elif "error" in data:
                        raise Exception(data["error"])
                except json.JSONDecodeError:
                    continue

        return accumulated


# Singleton instance
ai_service = AIService()
