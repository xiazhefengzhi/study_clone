# 项目结构文档

## 🎯 技术栈概览

### 前端
- **框架**: Next.js 14 (App Router)
- **UI 库**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS
- **认证**: Supabase Auth ⭐
- **状态管理**: Zustand
- **图标**: Lucide React
- **动画**: Framer Motion

### 后端
- **框架**: FastAPI (Python)
- **数据库**: PostgreSQL (Supabase) ⭐
- **ORM**: SQLAlchemy (异步)
- **认证**: Supabase Auth + JWT
- **存储**: Supabase Storage (S3 兼容) ⭐
- **缓存**: Upstash Redis
- **任务队列**: Upstash QStash

### 部署（完全免费方案 $0/月）
- **前端**: Vercel
- **后端**: Vercel Serverless Functions
- **数据库**: Supabase PostgreSQL (500MB 免费)
- **存储**: Supabase Storage (1GB 免费)
- **认证**: Supabase Auth (50,000 MAU 免费)

---

## 完整目录结构

```
knowfun-clone/
├── README.md                          # 项目主文档
├── FEATURES_ANALYSIS.md              # 功能分析文档
├── PROJECT_STRUCTURE.md              # 本文档
│
├── frontend/                          # Next.js 前端项目
│   ├── .env.example                  # 环境变量模板
│   ├── .gitignore
│   ├── package.json                  # 前端依赖
│   ├── tsconfig.json                 # TypeScript 配置
│   ├── tailwind.config.ts            # Tailwind CSS 配置
│   ├── next.config.mjs               # Next.js 配置
│   ├── components.json               # shadcn/ui 配置
│   ├── postcss.config.mjs
│   │
│   ├── public/                       # 静态资源
│   │   ├── logo.svg
│   │   └── images/
│   │
│   └── src/
│       ├── app/                      # App Router 页面
│       │   ├── layout.tsx            # 根布局
│       │   ├── page.tsx              # 首页
│       │   ├── globals.css           # 全局样式
│       │   │
│       │   ├── (auth)/              # 认证相关页面组
│       │   │   ├── sign-in/
│       │   │   │   └── [[...sign-in]]/
│       │   │   │       └── page.tsx
│       │   │   └── sign-up/
│       │   │       └── [[...sign-up]]/
│       │   │           └── page.tsx
│       │   │
│       │   ├── learn/               # 学习中心页面组
│       │   │   ├── layout.tsx
│       │   │   ├── course-creation/ # 讲解制作
│       │   │   │   └── page.tsx
│       │   │   ├── my-document/     # 我的文档
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx
│       │   │   ├── my-courses/      # 我的讲解
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx
│       │   │   ├── export-task-list/ # 导出任务
│       │   │   │   └── page.tsx
│       │   │   └── user-center/     # 用户中心
│       │   │       └── page.tsx
│       │   │
│       │   ├── fun-square/          # 内容广场
│       │   │   ├── page.tsx
│       │   │   └── [postId]/
│       │   │       └── page.tsx
│       │   │
│       │   ├── upgrade/             # 升级套餐
│       │   │   └── page.tsx
│       │   │
│       │   ├── notifications/       # 消息中心
│       │   │   └── page.tsx
│       │   │
│       │   ├── referral/            # 推荐有礼
│       │   │   └── page.tsx
│       │   │
│       │   └── api/                 # API Routes
│       │       └── webhooks/
│       │           └── clerk/
│       │               └── route.ts
│       │
│       ├── components/              # React 组件
│       │   ├── ui/                  # shadcn/ui 组件
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── input.tsx
│       │   │   ├── progress.tsx
│       │   │   ├── select.tsx
│       │   │   ├── tabs.tsx
│       │   │   └── ... (其他 UI 组件)
│       │   │
│       │   ├── layout/             # 布局组件
│       │   │   ├── header.tsx
│       │   │   ├── sidebar.tsx
│       │   │   ├── footer.tsx
│       │   │   └── navigation.tsx
│       │   │
│       │   ├── course/             # 讲解相关组件
│       │   │   ├── course-card.tsx
│       │   │   ├── course-creator.tsx
│       │   │   └── course-viewer.tsx
│       │   │
│       │   ├── document/           # 文档相关组件
│       │   │   ├── document-card.tsx
│       │   │   ├── document-uploader.tsx
│       │   │   └── document-list.tsx
│       │   │
│       │   ├── post/               # 内容广场组件
│       │   │   ├── post-card.tsx
│       │   │   ├── post-grid.tsx
│       │   │   └── post-filters.tsx
│       │   │
│       │   └── shared/             # 共享组件
│       │       ├── theme-toggle.tsx
│       │       ├── language-switcher.tsx
│       │       ├── loading-spinner.tsx
│       │       └── empty-state.tsx
│       │
│       ├── lib/                    # 工具函数
│       │   ├── utils.ts            # 通用工具函数
│       │   ├── api-client.ts       # API 客户端
│       │   └── constants.ts        # 常量定义
│       │
│       ├── hooks/                  # 自定义 Hooks
│       │   ├── use-user.ts
│       │   ├── use-subscription.ts
│       │   ├── use-documents.ts
│       │   └── use-courses.ts
│       │
│       ├── stores/                 # Zustand 状态管理
│       │   ├── user-store.ts
│       │   ├── document-store.ts
│       │   └── course-store.ts
│       │
│       └── types/                  # TypeScript 类型
│           ├── index.ts
│           ├── user.ts
│           ├── document.ts
│           ├── course.ts
│           ├── post.ts
│           └── subscription.ts
│
├── backend/                         # FastAPI 后端项目
│   ├── .env                         # 环境变量配置（已配置✅）
│   ├── .env.example                # 环境变量模板
│   ├── .gitignore
│   ├── requirements.txt            # Python 依赖
│   ├── pyproject.toml              # Python 项目配置
│   ├── pytest.ini                  # Pytest 配置（已禁用）
│   │
│   ├── alembic/                    # 数据库迁移✅
│   │   ├── alembic.ini             # Alembic 配置
│   │   ├── env.py                  # 迁移环境配置
│   │   ├── script.py.mako          # 迁移脚本模板
│   │   └── versions/
│   │       └── 001_initial.py      # 初始迁移（创建所有表）
│   │
│   ├── check_db_connection.py      # 快速数据库连接测试✅
│   ├── verify_supabase.py          # 完整 Supabase 验证✅
│   │
│   ├── DATABASE_SETUP.md           # 数据库设置指南
│   ├── TESTING.md                  # 测试指南
│   ├── CONFIG_STATUS.md            # 配置状态总结
│   ├── GET_API_KEYS.md             # API Keys 获取指南
│   ├── SUPABASE_KEYS_GUIDE.md      # Supabase Keys 详解
│   ├── PYCHARM_PYTEST_FIX.md       # PyCharm pytest 修复指南
│   │
│   └── app/
│       ├── __init__.py
│       ├── main.py                 # FastAPI 应用入口
│       │
│       ├── core/                   # 核心配置
│       │   ├── __init__.py
│       │   ├── config.py           # 配置类✅
│       │   ├── supabase_db.py      # Supabase 数据库连接✅
│       │   ├── security.py         # 安全相关（JWT等）
│       │   └── dependencies.py     # 依赖注入
│       │
│       ├── api/                    # API 路由
│       │   ├── __init__.py
│       │   └── v1/
│       │       ├── __init__.py     # API 路由器
│       │       └── endpoints/
│       │           ├── __init__.py
│       │           ├── auth.py     # 认证端点
│       │           ├── users.py    # 用户端点
│       │           ├── documents.py # 文档端点
│       │           ├── courses.py  # 讲解端点
│       │           ├── posts.py    # 内容广场端点
│       │           ├── referrals.py # 推荐端点
│       │           ├── subscriptions.py # 订阅端点
│       │           └── export_tasks.py # 导出任务端点
│       │
│       ├── models/                 # SQLAlchemy 数据模型✅
│       │   ├── __init__.py
│       │   ├── user.py             # 用户模型✅
│       │   ├── document.py         # 文档模型✅
│       │   ├── course.py           # 讲解模型✅
│       │   ├── export_task.py      # 导出任务模型✅
│       │   ├── referral.py         # 推荐模型✅
│       │   ├── subscription.py     # 订阅模型✅
│       │   └── post.py             # 内容广场模型✅
│       │
│       ├── schemas/                # Pydantic 模式
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── document.py
│       │   ├── course.py
│       │   ├── export_task.py
│       │   ├── referral.py
│       │   ├── subscription.py
│       │   └── post.py
│       │
│       ├── services/               # 业务逻辑层
│       │   ├── __init__.py
│       │   ├── auth_service.py     # Supabase Auth 服务
│       │   ├── user_service.py     # 用户服务
│       │   ├── document_service.py # 文档服务
│       │   ├── course_service.py   # 讲解服务
│       │   ├── ai_service.py       # AI 生成服务（OpenAI/Anthropic）
│       │   ├── storage_service.py  # Supabase Storage 服务
│       │   ├── queue_service.py    # Upstash QStash 服务
│       │   ├── referral_service.py # 推荐服务
│       │   └── export_service.py   # 导出服务（PPT/Video）
│       │
│       ├── tasks/                  # 异步任务（Upstash QStash）
│       │   ├── __init__.py
│       │   ├── document_tasks.py   # 文档处理任务
│       │   ├── course_tasks.py     # 讲解生成任务
│       │   └── export_tasks.py     # 导出任务
│       │
│       └── utils/                  # 工具函数
│           ├── __init__.py
│           ├── file_utils.py       # 文件处理工具
│           ├── pdf_parser.py       # PDF 解析
│           ├── ppt_parser.py       # PPT 解析
│           ├── docx_parser.py      # Word 解析
│           └── validators.py       # 验证器
│
└── docs/                            # 项目文档
    ├── FEATURES_ANALYSIS.md        # 功能分析
    ├── API_DESIGN.md               # API 设计文档
    ├── DATABASE_SCHEMA.md          # 数据库设计
    └── DEPLOYMENT.md               # 部署指南
```

## 技术栈说明

### 前端技术栈
- **框架：** Next.js 14 (App Router)
- **语言：** TypeScript
- **样式：** Tailwind CSS
- **UI 组件：** shadcn/ui (Radix UI)
- **状态管理：** Zustand
- **数据请求：** TanStack Query (React Query)
- **认证：** Clerk.js
- **图标：** Lucide React
- **动画：** Framer Motion
- **主题：** next-themes

### 后端技术栈
- **框架：** FastAPI
- **语言：** Python 3.11+
- **数据库：** MongoDB (主), SQLite (开发)
- **ORM：** Beanie (MongoDB), SQLAlchemy (SQLite)
- **任务队列：** Celery + Redis
- **缓存：** Redis
- **文件存储：** AWS S3 / MinIO
- **AI 集成：** OpenAI API, Anthropic Claude
- **文档解析：** PyPDF2, python-pptx, python-docx

## 核心模块说明

### 前端模块

#### 1. App Router 页面
- 使用 Next.js 14 App Router 结构
- 支持嵌套布局和路由组
- 服务端渲染（SSR）和客户端渲染（CSR）混合使用

#### 2. UI 组件库
- 使用 shadcn/ui 提供的高质量组件
- 可定制的主题系统
- 支持深色模式

#### 3. 状态管理
- Zustand 用于全局状态管理
- React Query 用于服务端状态管理和缓存

#### 4. 认证系统
- Clerk 提供完整的用户认证解决方案
- 支持多种登录方式
- Webhook 集成用于同步用户数据

### 后端模块

#### 1. API 层
- RESTful API 设计
- 自动生成 API 文档（Swagger UI）
- 版本控制（/api/v1）

#### 2. 业务逻辑层（Services）
- 解耦的服务架构
- 可复用的业务逻辑
- 易于测试和维护

#### 3. 数据层（Models）
- Beanie ODM 用于 MongoDB
- 类型安全的文档模型
- 自动索引管理

#### 4. 任务队列
- Celery 处理异步任务
- 文档解析
- AI 内容生成
- 文件导出

## 开发工作流

### 前端开发流程
1. 创建页面路由（app/）
2. 设计 UI 组件（components/）
3. 定义数据类型（types/）
4. 实现状态管理（stores/ 或 hooks/）
5. 集成 API 调用（lib/api-client.ts）
6. 添加错误处理和加载状态

### 后端开发流程
1. 定义数据模型（models/）
2. 创建 Pydantic 模式（schemas/）
3. 实现业务逻辑（services/）
4. 添加 API 端点（api/v1/endpoints/）
5. 编写单元测试（tests/）
6. 更新 API 文档

## 环境配置

### 前端环境变量
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=
```

### 后端环境变量
```env
MONGODB_URL=
SECRET_KEY=
OPENAI_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
REDIS_URL=
```

## 部署架构（免费方案）💰

### 前端部署
- **平台：** Vercel（免费）
- **CDN：** 自动配置（全球加速）
- **环境：** Production, Preview
- **免费额度：** 100GB 带宽/月

### 后端部署
- **服务器：** Vercel Serverless Functions（免费）
- **框架：** FastAPI on Vercel（Python Runtime）
- **数据库：** MongoDB Atlas（512MB 免费）
- **缓存：** Upstash Redis（10,000 命令/天免费）
- **存储：** Cloudflare R2（10GB 免费存储）
- **任务队列：** Upstash QStash（免费额度）

### 成本预估（完全免费方案 $0/月）
- ✅ **前端：** $0/月（Vercel 免费套餐）
- ✅ **后端：** $0/月（Vercel Serverless Functions）
- ✅ **数据库：** $0/月（Supabase PostgreSQL 500MB）⭐
- ✅ **存储：** $0/月（Supabase Storage 1GB）⭐
- ✅ **认证：** $0/月（Supabase Auth 50,000 MAU）⭐
- ✅ **缓存：** $0/月（Upstash Redis 免费）
- ✅ **任务队列：** $0/月（Upstash QStash 免费）
- ✅ **总计：** $0/月（完全免费！）

---

## 📊 当前项目状态（2025-11-14）

### ✅ 已完成

#### 后端基础设施
- ✅ PostgreSQL/SQLAlchemy 数据模型（7个表）
  - `users`, `documents`, `courses`, `export_tasks`
  - `posts`, `referrals`, `subscriptions`
- ✅ Alembic 数据库迁移系统
- ✅ Supabase 完整配置
  - 数据库连接测试通过
  - Storage 文件上传测试通过
  - Auth JWT 验证测试通过
- ✅ 环境变量配置（.env）
- ✅ 测试脚本和文档
  - `check_db_connection.py`
  - `verify_supabase.py`
  - 完整的配置指南文档

#### 配置文件
- ✅ `backend/.env` - Supabase 凭证已配置
- ✅ `backend/requirements.txt` - Python 依赖
- ✅ `backend/alembic.ini` - Alembic 配置
- ✅ `backend/pytest.ini` - pytest 已禁用
- ✅ `frontend/.env.example` - Supabase 配置模板

#### 后端 API 开发
- ✅ FastAPI 主应用配置
  - PostgreSQL/Supabase 数据库连接
  - CORS 中间件
  - API 路由集成
- ✅ 认证系统 (Supabase Auth)
  - Auth 服务 (`app/services/auth_service.py`)
  - JWT Token 验证
  - Auth 端点 (`/api/v1/auth/*`)
  - 用户注册/登录/登出/刷新Token
- ✅ 文件存储服务 (Supabase Storage)
  - Storage 服务 (`app/services/storage_service.py`)
  - 文件上传/下载/删除
  - 公开 URL 生成
- ✅ 文档管理 API
  - 文档 CRUD 端点 (`/api/v1/documents/*`)
  - 文件上传（PDF/PPT/Word）
  - 存储空间管理
  - 分页查询
- ✅ 讲解管理 API
  - 讲解 CRUD 端点 (`/api/v1/courses/*`)
  - 公开/私有访问控制
  - 点赞和浏览量统计
  - 分页查询
- ✅ Pydantic Schemas
  - 用户、文档、讲解的请求/响应模型

### ⏳ 待完成

#### 后端开发
- ⏳ 运行数据库迁移（`alembic upgrade head`）（可选）
- ⬜ 剩余 API 端点实现
  - Users API (个人资料、积分、存储统计)
  - Posts API (内容广场)
  - Referrals API (推荐系统)
  - Subscriptions API (订阅管理)
  - Export Tasks API (导出任务)
- ⬜ 业务逻辑服务
  - AI 服务（OpenAI/Anthropic）- 文档解析工具
  - Queue 服务（Upstash QStash）

#### 前端开发
- ⬜ Supabase Client 配置
- ⬜ 认证流程（登录/注册）
- ⬜ 核心页面开发
- ⬜ UI 组件实现
- ⬜ API 集成

#### 部署
- ⬜ Vercel 部署配置
- ⬜ 环境变量设置
- ⬜ 域名配置

---

## 下一步计划

### 立即执行（今天）
1. ✅ Supabase 配置完成
2. ⏳ **运行数据库迁移创建表**
   ```bash
   cd backend
   alembic upgrade head
   ```
3. ⬜ 配置前端 Supabase Client
4. ⬜ 实现基础 Auth 端点

### 本周计划
1. ⬜ 完成核心 API 端点
2. ⬜ 实现文件上传功能
3. ⬜ 集成 AI 服务（讲解生成）
4. ⬜ 前端登录/注册页面

### 长期计划
1. ⬜ 完整功能开发
2. ⬜ 测试和优化
3. ⬜ 部署到 Vercel
4. ⬜ 用户测试和反馈

---

## 🔗 相关文档

### 后端文档
- `backend/DATABASE_SETUP.md` - 数据库设置详细指南
- `backend/TESTING.md` - 测试运行指南
- `backend/CONFIG_STATUS.md` - 配置状态总结
- `backend/GET_API_KEYS.md` - API Keys 获取步骤
- `backend/SUPABASE_KEYS_GUIDE.md` - Supabase Keys 详解
- `backend/PYCHARM_PYTEST_FIX.md` - PyCharm 配置指南

### 前端文档
- `frontend/.env.example` - 环境变量模板

### 项目文档
- `README.md` - 项目主文档
- `FEATURES_ANALYSIS.md` - 功能分析
- `FREE_DEPLOYMENT.md` - 免费部署指南
