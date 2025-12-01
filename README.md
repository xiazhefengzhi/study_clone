# XiaZheStudy - AI 动画学习平台

让复杂的知识像动画一样生动。上传文档或输入主题，AI 瞬间为你生成互动式动画讲解。

🌐 **在线体验：** [https://www.xiazhestudy.com](https://www.xiazhestudy.com)

---

## 项目简介

XiaZheStudy 是一个 AI 驱动的学习平台，核心功能是将枯燥的文档转化为引人入胜的动画讲解。

**解决什么问题：**
- 看文档太枯燥，看不进去
- 知识点复杂，难以理解
- 想要更直观的学习方式

**怎么解决：**
- 上传文档（PDF/Word/PPT）或直接输入文字
- AI 分析内容，实时生成动画脚本
- 输出可交互的动画讲解

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + Tailwind CSS + shadcn/ui |
| 后端 | FastAPI + SQLAlchemy |
| 数据库 | PostgreSQL (Supabase) |
| 存储 | Supabase Storage |
| 认证 | Supabase Auth (支持 Google OAuth) |
| AI | 大语言模型 API（流式输出） |
| 部署 | Vercel (前端) + Railway (后端) |
| 域名 | Cloudflare |

---

## 项目结构

```
study_clone/
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── api/v1/          # API 接口
│   │   ├── core/            # 核心配置
│   │   ├── models/          # 数据模型
│   │   ├── schemas/         # Pydantic 模型
│   │   ├── services/        # 业务逻辑
│   │   └── main.py          # 入口文件
│   ├── alembic/             # 数据库迁移
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # 前端代码
│   ├── src/
│   │   ├── app/             # 页面 (App Router)
│   │   ├── components/      # 组件
│   │   ├── contexts/        # React Context
│   │   ├── lib/             # 工具库
│   │   └── types/           # TypeScript 类型
│   ├── package.json
│   └── tailwind.config.ts
└── DEPLOYMENT_CONFIG.md     # 部署配置文档
```

---

## 核心功能

### 1. 用户系统
- 邮箱注册 + Google OAuth 登录
- 订阅套餐：free / basic / plus / pro
- 积分系统：新用户送 500 积分
- 邀请系统：邀请好友双方得积分

### 2. 文档管理
- 支持 PDF、Word、PPT 等格式上传
- 自动解析文档内容
- 文件存储在 Supabase Storage

### 3. AI 动画生成（核心）
- 从文档生成动画讲解
- 从文字直接生成动画
- 支持多种风格：标准、幽默、学术、科幻
- SSE 流式输出，实时预览

### 4. 课程广场
- 公开分享优质动画
- 浏览发现其他用户作品
- 点赞、收藏、播放统计

### 5. 导出功能
- 导出为 MP4 视频
- 导出为图片序列
- 异步任务队列处理

---

## 本地开发

### 后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入必要的配置

# 运行
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入必要的配置

# 运行
npm run dev
```

访问 http://localhost:3000

---

## 环境变量

### 后端 (.env)

```bash
# 数据库（使用 Supabase Pooler 连接）
DATABASE_URL=postgresql+asyncpg://postgres.xxx:password@aws-0-us-west-2.pooler.supabase.com:5432/postgres

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# CORS
CORS_ORIGINS=http://localhost:3000,https://www.xiazhestudy.com

# JWT
SECRET_KEY=your-secret-key

# AI 服务
AI_API_KEY=your-ai-api-key
```

### 前端 (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 部署

### 前端部署到 Vercel

1. 连接 GitHub 仓库
2. 设置环境变量
3. 自动部署

### 后端部署到 Railway

1. 连接 GitHub 仓库
2. 添加 PostgreSQL 数据库（或使用 Supabase）
3. 设置环境变量
4. 自动部署

### 域名配置 (Cloudflare)

| 服务 | 域名 |
|-----|------|
| 前端 | www.xiazhestudy.com |
| 后端 API | api.xiazhestudy.com |

详细部署配置请查看 [DEPLOYMENT_CONFIG.md](./DEPLOYMENT_CONFIG.md)

---

## API 文档

后端启动后访问：http://localhost:8000/docs

主要接口：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/auth/register` | POST | 用户注册 |
| `/api/v1/auth/login` | POST | 用户登录 |
| `/api/v1/documents/upload` | POST | 上传文档 |
| `/api/v1/courses/` | GET/POST | 课程列表/创建 |
| `/api/v1/ai/generate/document` | POST | 从文档生成动画 (SSE) |
| `/api/v1/ai/generate/text` | POST | 从文字生成动画 (SSE) |

---

## 常见问题

### Supabase 连接失败 (IPv6)

Supabase 2024 年后默认使用 IPv6，Railway 等平台可能不支持。

**解决方案：** 使用 Pooler 连接串而非直连。

```
# ❌ 直连（可能连不上）
postgres://postgres:xxx@db.xxx.supabase.co:5432/postgres

# ✅ Pooler 连接（推荐）
postgres://postgres.xxx:xxx@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

### CORS 跨域错误

确保后端 `CORS_ORIGINS` 包含前端域名：

```bash
CORS_ORIGINS=http://localhost:3000,https://www.xiazhestudy.com
```

---

## 相关教程

本项目配套 Vibe Coding 教程，从零教你搭建类似项目：

- 环境配置
- 需求设计
- 后端开发
- 前端开发
- 部署上线

---

## License

MIT
