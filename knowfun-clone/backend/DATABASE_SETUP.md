# Database Setup Guide - PostgreSQL & Supabase

本指南详细说明如何设置 PostgreSQL 数据库、配置 Supabase 并运行数据库迁移。

## 目录

1. [Supabase 配置](#supabase-配置)
2. [本地开发环境](#本地开发环境)
3. [数据库迁移](#数据库迁移)
4. [模型说明](#模型说明)

---

## Supabase 配置

### 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: knowfun-clone
   - **Database Password**: 设置强密码（保存好！）
   - **Region**: 选择离你最近的区域
   - **Pricing Plan**: Free（免费 500MB）

### 2. 获取数据库连接信息

在 Supabase Dashboard 中：

1. 进入你的项目
2. 点击左侧 **Settings** → **Database**
3. 找到 **Connection string** 部分
4. 复制 **URI** 格式的连接字符串

示例：
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
```

### 3. 获取 API Keys

在 Supabase Dashboard 中：

1. 点击左侧 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public**: 匿名密钥（用于客户端）
   - **service_role**: 服务密钥（用于服务端，保密！）

### 4. 配置 Storage

#### 4.1 创建 Storage Bucket

1. 在 Supabase Dashboard，点击左侧 **Storage**
2. 点击 "Create a new bucket"
3. 配置：
   - **Name**: `knowfun-files`
   - **Public bucket**: ✅ 勾选（允许公开访问）
   - 点击 "Create bucket"

#### 4.2 配置 Storage 策略（Policies）

为了允许文件上传和访问，需要配置 RLS (Row Level Security) 策略：

```sql
-- 允许所有人读取文件
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'knowfun-files' );

-- 允许认证用户上传文件
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'knowfun-files' AND auth.role() = 'authenticated' );

-- 允许用户删除自己的文件
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING ( bucket_id = 'knowfun-files' AND auth.uid() = owner );
```

#### 4.3 获取 S3 兼容凭证

Supabase Storage 提供 S3 兼容 API。使用你的 Supabase 凭证：

- **Access Key ID**: 你的 Supabase `service_role` key
- **Secret Access Key**: 你的 Supabase `service_role` key（相同）
- **Endpoint**: `https://your-project.supabase.co/storage/v1/s3`
- **Region**: `us-west-2`（或你的项目区域）

### 5. 配置环境变量

复制 `.env.example` 到 `.env` 并填写：

```bash
# Supabase PostgreSQL
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
SUPABASE_SERVICE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres

# Supabase Storage
SUPABASE_ACCESS_KEY_ID=your-service-role-key
SUPABASE_SECRET_ACCESS_KEY=your-service-role-key
SUPABASE_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
SUPABASE_REGION=us-west-2
SUPABASE_BUCKET_NAME=knowfun-files

# Supabase Auth
SUPABASE_JWT_SECRET=your-jwt-secret
```

---

## 本地开发环境

### 方案 A: 使用 Supabase（推荐）

直接使用 Supabase 云数据库，无需本地安装 PostgreSQL。

**优点**：
- ✅ 无需本地安装 PostgreSQL
- ✅ 自动备份
- ✅ 免费 500MB 存储
- ✅ 内置认证和存储

### 方案 B: 本地 PostgreSQL

如果需要完全离线开发：

#### 1. 安装 PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
下载安装器：https://www.postgresql.org/download/windows/

#### 2. 创建数据库

```bash
# 连接到 PostgreSQL
psql postgres

# 创建数据库和用户
CREATE DATABASE knowfun;
CREATE USER knowfun_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE knowfun TO knowfun_user;

# 退出
\q
```

#### 3. 配置本地连接

更新 `.env` 文件：

```bash
DATABASE_URL=postgresql://knowfun_user:your_password@localhost:5432/knowfun
```

---

## 数据库迁移

### 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 运行迁移

#### 1. 查看当前迁移状态

```bash
alembic current
```

#### 2. 运行所有迁移

```bash
alembic upgrade head
```

这将创建所有表：
- ✅ `users` - 用户表
- ✅ `documents` - 文档/文件表
- ✅ `courses` - 课程/讲解表
- ✅ `export_tasks` - 导出任务表
- ✅ `posts` - 内容广场帖子表
- ✅ `referrals` - 推荐有礼表
- ✅ `subscriptions` - 订阅记录表

#### 3. 回滚迁移

```bash
# 回滚一个版本
alembic downgrade -1

# 回滚到初始状态
alembic downgrade base
```

#### 4. 查看迁移历史

```bash
alembic history
```

### 创建新迁移

当你修改模型时，创建新迁移：

```bash
# 自动生成迁移（推荐）
alembic revision --autogenerate -m "描述你的修改"

# 手动创建空迁移
alembic revision -m "描述你的修改"
```

---

## 模型说明

### 数据库架构总览

```
users (用户)
├── documents (文档) - 一对多
│   └── courses (课程) - 一对多
│       ├── export_tasks (导出任务) - 一对多
│       └── posts (帖子) - 一对一
├── export_tasks (导出任务) - 一对多
├── posts (帖子) - 一对多
├── referrals (推荐) - 一对多
└── subscriptions (订阅) - 一对多
```

### 各表详细说明

#### 1. `users` - 用户表

存储用户基本信息和账户状态。

**主要字段**：
- `supabase_user_id` - Supabase Auth 用户 ID
- `email` - 邮箱（唯一）
- `username` - 用户名
- `subscription_tier` - 订阅等级（free/basic/plus/pro）
- `points_balance` - 积分余额
- `storage_used` - 已用存储（字节）

**关系**：
- 一对多：documents, courses, export_tasks, posts

---

#### 2. `documents` - 文档表

存储用户上传的文件信息。

**主要字段**：
- `user_id` - 所属用户
- `title` - 文档标题
- `file_url` - 文件存储 URL
- `file_type` - 文件类型（pdf/ppt/docx/txt）
- `file_size` - 文件大小（字节）
- `status` - 处理状态（pending/processing/success/failed）

**关系**：
- 多对一：user
- 一对多：courses

---

#### 3. `courses` - 课程表

存储 AI 生成的讲解内容。

**主要字段**：
- `user_id` - 创建者
- `document_id` - 源文档（可选）
- `title` - 课程标题
- `style` - 讲解风格（standard/humorous/serious/academic）
- `difficulty` - 难度（easy/medium/hard）
- `content` - 结构化课程内容（JSON）
- `status` - 生成状态（draft/generating/published/failed）
- `is_public` - 是否公开

**关系**：
- 多对一：user, document
- 一对多：export_tasks
- 一对一：post

---

#### 4. `export_tasks` - 导出任务表

存储 PPT/视频导出任务。

**主要字段**：
- `user_id` - 请求用户
- `course_id` - 源课程
- `export_type` - 导出类型（ppt/video/pdf）
- `status` - 任务状态（pending/processing/completed/failed）
- `file_url` - 导出文件 URL
- `progress` - 进度百分比（0-100）
- `config` - 导出配置（JSON）

**关系**：
- 多对一：user, course

---

#### 5. `posts` - 帖子表

内容广场的帖子/分享。

**主要字段**：
- `user_id` - 发布者
- `course_id` - 关联课程（可选）
- `title` - 标题
- `content` - 内容
- `post_type` - 类型（article/course_share/question/discussion）
- `tags` - 标签数组（JSON）
- `views_count` - 浏览数
- `likes_count` - 点赞数
- `is_featured` - 是否推荐

**关系**：
- 多对一：user
- 一对一：course

---

#### 6. `referrals` - 推荐表

推荐有礼系统。

**主要字段**：
- `referrer_id` - 推荐人
- `referee_id` - 被推荐人（注册后填写）
- `referral_code` - 推荐码（唯一）
- `reward_points` - 奖励积分
- `reward_status` - 奖励状态（pending/completed/expired）
- `is_completed` - 是否完成

**关系**：
- 多对一：referrer (user), referee (user)

---

#### 7. `subscriptions` - 订阅表

订阅和付费记录。

**主要字段**：
- `user_id` - 用户
- `tier` - 订阅等级（free/basic/plus/pro）
- `status` - 状态（active/cancelled/expired/past_due）
- `payment_provider` - 支付提供商
- `payment_id` - 外部交易 ID
- `billing_cycle` - 计费周期（monthly/yearly/lifetime）
- `current_period_end` - 当前周期结束时间
- `auto_renew` - 自动续费
- `credits_granted` - 赠送积分
- `storage_quota` - 存储配额

**关系**：
- 多对一：user

---

## 索引策略

所有表都包含优化查询的索引：

### 主要索引

1. **用户查询**：
   - `idx_user_email` - 邮箱登录
   - `idx_user_supabase_id` - Supabase Auth 集成

2. **文档查询**：
   - `idx_document_user` - 用户文档列表
   - `idx_document_user_status` - 按状态过滤

3. **课程查询**：
   - `idx_course_user` - 用户课程列表
   - `idx_course_public` - 公开课程浏览
   - `idx_course_category` - 分类浏览

4. **内容广场**：
   - `idx_post_featured` - 推荐内容
   - `idx_post_category` - 分类浏览
   - `idx_post_published` - 按发布时间排序

---

## 常见问题

### Q: 迁移失败：连接被拒绝

**A**: 检查 `DATABASE_URL` 是否正确，以及 PostgreSQL 是否正在运行：

```bash
# 检查 PostgreSQL 状态（本地）
brew services list | grep postgresql

# 测试连接
psql $DATABASE_URL
```

### Q: 如何重置数据库？

**A**: 回滚所有迁移，然后重新运行：

```bash
alembic downgrade base
alembic upgrade head
```

### Q: Supabase 存储文件上传失败

**A**: 检查：
1. Storage Bucket 是否创建
2. RLS 策略是否正确配置
3. `.env` 中的 `SUPABASE_SERVICE_KEY` 是否正确

### Q: 如何在 Supabase 查看数据？

**A**:
1. 进入 Supabase Dashboard
2. 点击左侧 **Table Editor**
3. 选择对应的表查看数据

或使用 SQL Editor：
```sql
-- 查看所有用户
SELECT * FROM users LIMIT 10;

-- 查看课程统计
SELECT status, COUNT(*) FROM courses GROUP BY status;
```

---

## 下一步

1. ✅ 配置 Supabase Auth（见 Supabase Auth 集成文档）
2. ✅ 实现 API 接口（见 API 开发指南）
3. ✅ 集成前端（见前端开发指南）

---

## 参考资料

- [Supabase 文档](https://supabase.com/docs)
- [Alembic 文档](https://alembic.sqlalchemy.org/)
- [SQLAlchemy 2.0 文档](https://docs.sqlalchemy.org/en/20/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
