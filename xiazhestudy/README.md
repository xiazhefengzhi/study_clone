# 🎓 KnowFun Clone - AI 动画讲解平台

> 基于 AI 的智能学习平台，将任何内容转化为精美的动画讲解

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-orange)](https://supabase.com/)

## ✨ 核心特性

- 🤖 **AI 动画生成** - 使用 Gemini/OpenAI 生成精美的 HTML 动画讲解
- 📚 **多格式支持** - 支持文本、PDF、PPT、Word 等多种输入格式
- 🎨 **多种风格** - 幽默、学术、故事等 20+ 种讲解风格
- 📱 **响应式预览** - 支持桌面、平板、手机多端预览
- 🔄 **实时流式生成** - 查看 AI 创作过程，体验更流畅
- 🌐 **课程广场** - 分享和浏览优质动画讲解
- 💾 **一键保存** - 自动保存生成的动画内容

## 🏗️ 技术栈

### 前端
- **框架:** Next.js 14 (App Router)
- **UI 组件:** shadcn/ui (Radix UI)
- **样式:** Tailwind CSS
- **动画:** Framer Motion
- **图标:** Lucide React
- **状态管理:** Zustand
- **认证:** Supabase Auth

### 后端
- **框架:** FastAPI (Python 3.11+)
- **数据库:** PostgreSQL (Supabase)
- **ORM:** SQLAlchemy (异步)
- **存储:** Supabase Storage
- **AI 服务:** Gemini 2.0 / OpenAI GPT-4
- **认证:** Supabase Auth + JWT

### 部署 (完全免费 $0/月)
- **前端托管:** Vercel
- **后端托管:** Vercel Serverless Functions
- **数据库:** Supabase PostgreSQL (500MB 免费)
- **存储:** Supabase Storage (1GB 免费)
- **认证:** Supabase Auth (50,000 MAU 免费)

## 🚀 快速开始

### 前置要求
- Node.js 18+
- Python 3.11+
- Supabase 账号 (免费)

### 1. 克隆项目
```bash
git clone <repository-url>
cd knowfun-clone
```

### 2. 配置环境变量

#### 前端 (frontend/.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 后端 (backend/.env)
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Database
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# AI Service (选择一个)
OPENAI_API_KEY=sk-...
# 或者
OPENAI_BASE_URL=https://api.aicodemirror.com/api/gemini
OPENAI_MODEL=gemini-2.0-flash-exp
```

### 3. 启动后端
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 运行数据库迁移（首次）
alembic upgrade head

# 启动服务
uvicorn app.main:app --reload
```

访问：
- API: http://localhost:8000
- API 文档: http://localhost:8000/docs

### 4. 启动前端
```bash
cd frontend
npm install
npm run dev
```

访问: http://localhost:3000

## 📖 文档

- [📁 项目结构](./docs/PROJECT_STRUCTURE.md)
- [🚀 快速开始指南](./docs/GETTING_STARTED.md)
- [🔌 API 文档](./docs/API_DOCUMENTATION.md)
- [⚙️ 配置指南](./docs/CONFIGURATION.md)
- [🎨 功能说明](./docs/FEATURES.md)
- [🚢 部署指南](./docs/DEPLOYMENT.md)
- [🤝 贡献指南](./docs/CONTRIBUTING.md)

## 🎯 核心功能

### ✅ 已完成
- [x] 用户认证（Supabase Auth）
- [x] AI 动画讲解生成（Gemini/OpenAI）
- [x] 文件上传（PDF、PPT、Word）
- [x] 实时流式生成
- [x] 多风格支持（幽默、学术、故事等）
- [x] 响应式预览（桌面、平板、手机）
- [x] 课程广场
- [x] 我的讲解管理
- [x] 课程详情页（iframe 渲染）
- [x] 点赞、浏览统计

### 🚧 开发中
- [ ] 文档解析增强（PDF/PPT 深度解析）
- [ ] 更多 AI 风格模板
- [ ] 视频导出功能
- [ ] 音频讲解生成
- [ ] 社区互动功能

### 📋 计划中
- [ ] 推荐系统
- [ ] 订阅套餐
- [ ] 多语言支持
- [ ] 移动端 App

## 🏗️ 项目结构

```
knowfun-clone/
├── frontend/                    # Next.js 前端
│   ├── src/
│   │   ├── app/                # App Router 页面
│   │   │   ├── learn/         # 学习中心
│   │   │   │   ├── course-creation/  # 讲解制作 ⭐
│   │   │   │   ├── my-courses/       # 我的讲解
│   │   │   │   └── courses/[id]/     # 课程详情
│   │   │   ├── fun-square/    # 课程广场
│   │   │   └── (auth)/        # 认证页面
│   │   ├── components/        # React 组件
│   │   │   ├── ui/           # shadcn/ui 组件
│   │   │   └── ...
│   │   ├── lib/              # 工具函数
│   │   ├── hooks/            # 自定义 Hooks
│   │   └── types/            # TypeScript 类型
│   └── package.json
│
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   └── courses.py     # 课程 API（含流式生成）⭐
│   │   ├── services/
│   │   │   └── ai_service.py  # AI 生成服务 ⭐
│   │   ├── models/           # SQLAlchemy 模型
│   │   ├── schemas/          # Pydantic Schemas
│   │   └── core/             # 配置和依赖
│   ├── alembic/              # 数据库迁移
│   └── requirements.txt
│
└── docs/                      # 项目文档
    ├── API_DOCUMENTATION.md
    ├── GETTING_STARTED.md
    └── ...
```

## 🎨 核心工作流程

```
1. 用户输入/上传 → 2. AI 实时生成 → 3. 动画预览 → 4. 保存分享
    📝 文本            🤖 Gemini/GPT      🎬 iframe      💾 数据库
    📄 PDF/PPT         ⚡ 流式输出        📱 多端适配    🌐 广场展示
```

## 🚢 部署

### Vercel 一键部署（推荐）

#### 前端部署
```bash
cd frontend
vercel --prod
```

#### 后端部署
```bash
cd backend
vercel --prod
```

**环境变量配置:**
在 Vercel 后台设置所有必需的环境变量（见上方配置部分）

**详细部署指南:** [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

### Docker 部署
```bash
docker-compose up -d
```

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./docs/CONTRIBUTING.md)

### 开发流程
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 License

MIT License - 详见 [LICENSE](LICENSE)

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Google Gemini](https://ai.google.dev/)

## 📧 联系

- 项目链接: [https://github.com/yourusername/knowfun-clone](https://github.com/yourusername/knowfun-clone)
- 问题反馈: [Issues](https://github.com/yourusername/knowfun-clone/issues)

---

⭐ 如果这个项目对你有帮助，请给一个 Star！
