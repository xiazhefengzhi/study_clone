# 完全免费部署方案 💰

适合独立开发者和小型项目的零成本部署架构。

---

## 🎯 方案概览

| 服务 | 提供商 | 免费额度 | 用途 |
|------|--------|----------|------|
| **前端托管** | Vercel | 100GB 带宽/月 | Next.js 应用 |
| **后端托管** | Vercel | Serverless Functions | FastAPI API |
| **数据库** | MongoDB Atlas | 512MB 存储 | 主数据库 |
| **缓存** | Upstash Redis | 10,000 命令/天 | 会话缓存 |
| **文件存储** | Cloudflare R2 | 10GB 存储 | 用户文件 |
| **任务队列** | Upstash QStash | 500 消息/天 | 异步任务 |
| **认证** | Clerk | 10,000 MAU | 用户认证 |
| **监控** | Vercel Analytics | 免费 | 性能监控 |

**总成本：$0/月** ✅

---

## 📦 1. Vercel 部署（前后端）

### 前端部署

#### 1.1 准备工作
```bash
cd frontend
npm install
```

#### 1.2 创建 `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hnd1", "sfo1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://your-app.vercel.app/api"
  }
}
```

#### 1.3 部署命令
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 后端部署（FastAPI on Vercel）

#### 1.4 修改后端结构
```
backend/
├── api/
│   └── index.py          # Vercel 入口文件
├── app/
│   └── ...               # 原有代码
├── requirements.txt
└── vercel.json
```

#### 1.5 创建 `api/index.py`
```python
from app.main import app

# Vercel Serverless Function 入口
def handler(request):
    return app(request.environ, request.start_response)
```

#### 1.6 创建 `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python",
      "config": {
        "maxLambdaSize": "15mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.py"
    }
  ],
  "env": {
    "MONGODB_URL": "@mongodb_url",
    "REDIS_URL": "@redis_url",
    "R2_ACCOUNT_ID": "@r2_account_id",
    "R2_ACCESS_KEY_ID": "@r2_access_key",
    "R2_SECRET_ACCESS_KEY": "@r2_secret_key"
  }
}
```

#### 1.7 部署后端
```bash
cd backend
vercel --prod
```

---

## 🗄️ 2. MongoDB Atlas（免费数据库）

### 2.1 注册和创建集群
1. 访问 https://www.mongodb.com/cloud/atlas/register
2. 创建免费 M0 集群
3. 选择区域：AWS - Tokyo (ap-northeast-1)
4. 集群名称：knowfun-cluster

### 2.2 配置网络访问
1. Network Access → Add IP Address
2. 选择 "Allow Access from Anywhere" (0.0.0.0/0)

### 2.3 创建数据库用户
1. Database Access → Add New Database User
2. 用户名：`knowfun_user`
3. 密码：生成强密码
4. 权限：Atlas Admin

### 2.4 获取连接字符串
```
mongodb+srv://knowfun_user:<password>@knowfun-cluster.xxxxx.mongodb.net/knowfun?retryWrites=true&w=majority
```

### 2.5 添加到 Vercel 环境变量
```bash
vercel env add MONGODB_URL production
# 粘贴连接字符串
```

---

## 🚀 3. Upstash Redis（免费缓存）

### 3.1 注册并创建数据库
1. 访问 https://console.upstash.com/
2. Create Database → Regional → 选择最近的区域
3. 数据库名：knowfun-redis

### 3.2 获取连接信息
```bash
# REST API URL
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

### 3.3 Python 客户端配置
```python
# backend/app/core/redis.py
from upstash_redis import Redis

redis_client = Redis(
    url=settings.UPSTASH_REDIS_REST_URL,
    token=settings.UPSTASH_REDIS_REST_TOKEN
)
```

---

## ☁️ 4. Cloudflare R2（免费存储）

### 4.1 注册 Cloudflare 账号
1. 访问 https://dash.cloudflare.com/sign-up
2. 验证邮箱

### 4.2 启用 R2
1. 左侧菜单 → R2
2. Purchase R2 → 选择免费计划
3. Create Bucket → 名称：knowfun-files

### 4.3 创建 API Token
1. R2 → Manage R2 API Tokens
2. Create API Token
3. 权限：Object Read & Write
4. 保存：
   - Access Key ID
   - Secret Access Key
   - Account ID

### 4.4 配置后端存储
```python
# backend/app/services/storage_service.py
import boto3

class R2StorageService:
    def __init__(self):
        self.client = boto3.client(
            's3',
            endpoint_url=f'https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name='auto'
        )
        self.bucket = 'knowfun-files'

    async def upload_file(self, file_path: str, file_data: bytes):
        self.client.put_object(
            Bucket=self.bucket,
            Key=file_path,
            Body=file_data
        )
        return f"https://pub-xxxxx.r2.dev/{file_path}"
```

### 4.5 启用公共访问（可选）
1. R2 Bucket → Settings → Public Access
2. Allow Access → 复制公共 URL
3. 格式：`https://pub-xxxxx.r2.dev`

---

## 📬 5. Upstash QStash（免费任务队列）

### 5.1 创建 QStash
1. Upstash Console → QStash
2. 获取 Token 和 URL

### 5.2 替代 Celery
```python
# backend/app/tasks/queue.py
import httpx
from app.core.config import settings

async def enqueue_task(task_name: str, payload: dict):
    """发送任务到 QStash"""
    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://qstash.upstash.io/v2/publish/{settings.API_URL}/api/tasks/{task_name}",
            headers={
                "Authorization": f"Bearer {settings.QSTASH_TOKEN}",
                "Content-Type": "application/json"
            },
            json=payload
        )

# 使用示例
await enqueue_task("generate_course", {"document_id": "123"})
```

---

## 🔐 6. Clerk 认证（免费）

### 6.1 注册 Clerk
1. 访问 https://dashboard.clerk.com/sign-up
2. 创建应用：knowfun-clone

### 6.2 获取密钥
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

### 6.3 配置 Webhook（同步用户到后端）
1. Clerk Dashboard → Webhooks
2. Endpoint URL：`https://your-app.vercel.app/api/webhooks/clerk`
3. 订阅事件：
   - `user.created`
   - `user.updated`
   - `user.deleted`

---

## 🔄 7. 环境变量配置

### 7.1 Vercel 环境变量（前端）
```bash
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add NEXT_PUBLIC_API_URL production
```

### 7.2 Vercel 环境变量（后端）
```bash
# MongoDB
vercel env add MONGODB_URL production

# Upstash Redis
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production

# Cloudflare R2
vercel env add R2_ACCOUNT_ID production
vercel env add R2_ACCESS_KEY_ID production
vercel env add R2_SECRET_ACCESS_KEY production

# Clerk
vercel env add CLERK_SECRET_KEY production

# OpenAI
vercel env add OPENAI_API_KEY production
```

---

## 📊 8. 监控和日志

### 8.1 Vercel Analytics（免费）
```bash
# 前端添加
npm install @vercel/analytics

# app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 8.2 Vercel Logs
```bash
# 查看实时日志
vercel logs --follow
```

---

## 🚀 9. 完整部署流程

### 前端部署
```bash
cd frontend
vercel --prod
```

### 后端部署
```bash
cd backend
vercel --prod
```

### 自动部署（GitHub 集成）
1. 连接 GitHub 仓库
2. 推送代码到 `main` 分支
3. Vercel 自动构建和部署

---

## 📈 10. 免费额度限制

| 服务 | 限制 | 超额费用 |
|------|------|----------|
| Vercel | 100GB 带宽/月 | $40/TB |
| MongoDB Atlas | 512MB 存储 | 需升级套餐 |
| Upstash Redis | 10,000 命令/天 | $0.2/10K |
| Cloudflare R2 | 10GB 存储 | $0.015/GB |
| Upstash QStash | 500 消息/天 | $1/1000 消息 |
| Clerk | 10,000 MAU | $25/月 |

**预计支持用户量：**
- 月活用户：~1,000
- 文件存储：~500 个文档
- API 请求：~100,000 次/月

---

## 🎓 11. 开发环境设置

### 本地开发（使用 Docker）
```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
```

### 本地启动
```bash
# 启动服务
docker-compose up -d

# 前端
cd frontend && npm run dev

# 后端
cd backend && uvicorn app.main:app --reload
```

---

## ⚠️ 注意事项

### Vercel Serverless 限制
- 执行时间：最长 10 秒（Hobby 计划）
- 内存：1024MB
- 负载文件：最大 50MB

### 解决方案
1. **长时间任务**：使用 QStash 异步处理
2. **大文件上传**：直接上传到 R2，返回预签名 URL
3. **AI 生成**：流式输出，避免超时

---

## 🎉 总结

这套方案完全免费，适合：
- ✅ 个人项目
- ✅ MVP 验证
- ✅ 小型 SaaS（<1000 MAU）
- ✅ 学习和实验

**估算成本：$0/月** 🚀

需要扩展时，可以逐步升级到付费套餐！
