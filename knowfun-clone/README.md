# KnowFun Clone - AI 驱动的学习平台

基于 KnowFun 的功能分析，使用现代技术栈构建的 AI 学习平台。

## 项目概述

将学习资料转化为个性化多模态内容，实现因材施教的学习体验。

## 技术栈

### 前端
- **框架：** Next.js 14 (App Router)
- **UI 组件：** shadcn/ui（基于 Radix UI）
- **样式：** Tailwind CSS
- **图标：** Lucide React
- **认证：** Clerk.js
- **加载条：** NProgress
- **动画：** Framer Motion
- **状态管理：** Zustand
- **数据请求：** TanStack Query (React Query)

### 后端
- **框架：** Python FastAPI
- **数据库：**
  - MongoDB（主数据库）
  - SQLite（本地开发/缓存）
- **ORM：**
  - Beanie (MongoDB)
  - SQLAlchemy (SQLite)
- **任务队列：** Celery + Redis
- **文件存储：** AWS S3 / MinIO
- **AI 集成：** OpenAI API / Anthropic Claude

## 项目结构

```
knowfun-clone/
├── frontend/                 # Next.js 前端
│   ├── src/
│   │   ├── app/             # App Router 页面
│   │   ├── components/      # React 组件
│   │   ├── lib/             # 工具函数
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── stores/          # Zustand 状态管理
│   │   └── types/           # TypeScript 类型
│   ├── public/              # 静态资源
│   └── package.json
│
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   ├── core/           # 核心配置
│   │   └── utils/          # 工具函数
│   ├── alembic/            # 数据库迁移
│   ├── tests/              # 测试文件
│   └── requirements.txt
│
├── docs/                    # 文档
│   ├── FEATURES_ANALYSIS.md
│   ├── API_DESIGN.md
│   └── DATABASE_SCHEMA.md
│
└── README.md
```

## 快速开始

### 前置要求
- Node.js 18+
- Python 3.11+
- MongoDB 6.0+
- Redis 7.0+

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000

### 后端开发

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

访问 http://localhost:8000

API 文档：http://localhost:8000/docs

## 🚀 免费部署（$0/月）

本项目支持完全免费的部署方案，适合独立开发者和小型项目！

### 快速部署到 Vercel
```bash
# 前端部署
cd frontend
vercel --prod

# 后端部署
cd backend
vercel --prod
```

### 免费服务配置

| 服务 | 提供商 | 免费额度 |
|------|--------|----------|
| 前端托管 | Vercel | 100GB 带宽/月 |
| 后端托管 | Vercel Serverless | 免费 |
| 数据库 | MongoDB Atlas | 512MB |
| 缓存 | Upstash Redis | 10,000 命令/天 |
| 存储 | Cloudflare R2 | 10GB |
| 任务队列 | Upstash QStash | 500 消息/天 |

**查看详细部署指南：** [FREE_DEPLOYMENT.md](./FREE_DEPLOYMENT.md)

---

## 环境变量配置

### 前端 (.env.local)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 后端 (.env)
```env
# MongoDB (FREE - 512MB)
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/knowfun

# Upstash Redis (FREE)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx

# Cloudflare R2 (FREE - 10GB)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=knowfun-files

# Upstash QStash (FREE)
QSTASH_TOKEN=xxxxx

# OpenAI
OPENAI_API_KEY=your-openai-key

# Clerk
CLERK_SECRET_KEY=sk_test_xxx
```

## 核心功能

- [x] 用户认证（Clerk）
- [ ] 推荐有礼系统
- [ ] 内容广场
- [ ] 讲解制作（AI 生成）
- [ ] 文档管理
- [ ] 我的讲解
- [ ] 导出任务看板
- [ ] 订阅套餐系统
- [ ] 消息中心
- [ ] 多语言支持

## 开发路线图

查看 [FEATURES_ANALYSIS.md](./docs/FEATURES_ANALYSIS.md) 了解详细功能分析和开发计划。

## 部署

### 免费部署（推荐）💰
完全免费的部署方案，零成本运行：

```bash
# 1. 部署前端到 Vercel
cd frontend
vercel --prod

# 2. 部署后端到 Vercel
cd backend
vercel --prod
```

**所需服务注册：**
1. [Vercel](https://vercel.com) - 前后端托管
2. [MongoDB Atlas](https://mongodb.com) - 数据库
3. [Upstash](https://upstash.com) - Redis + QStash
4. [Cloudflare R2](https://cloudflare.com) - 文件存储
5. [Clerk](https://clerk.com) - 用户认证

**详细指南：** [FREE_DEPLOYMENT.md](./FREE_DEPLOYMENT.md)

### Docker 本地开发
```bash
docker-compose up -d
```

### 付费部署（可选）
- 前端：Vercel Pro ($20/月)
- 后端：AWS EC2 / DigitalOcean
- 数据库：MongoDB Atlas M10+
- 存储：AWS S3

## License

MIT
