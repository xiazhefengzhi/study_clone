# Supabase 测试指南

本指南帮助你测试 Supabase 的数据库、存储和认证功能。

## 快速开始

### 1. 创建 .env 文件

首先复制环境变量模板：

```bash
cd backend
cp .env.example .env
```

### 2. 配置 Supabase 凭证

编辑 `.env` 文件，填入你的 Supabase 项目凭证：

#### 2.1 获取数据库连接信息

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Database**
4. 找到 **Connection string**，选择 **URI** 格式

更新 `.env` 中的这些字段：

```bash
# PostgreSQL 数据库
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=eyJhbGc...（你的 anon key）
SUPABASE_SERVICE_KEY=eyJhbGc...（你的 service_role key）
DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
```

#### 2.2 获取 API Keys

在 **Settings** → **API**:

- **Project URL**: 复制到 `SUPABASE_URL`
- **anon public**: 复制到 `SUPABASE_KEY`
- **service_role**: 复制到 `SUPABASE_SERVICE_KEY`（保密！）

#### 2.3 获取 JWT Secret

在 **Settings** → **API** → **JWT Settings**:

- 复制 **JWT Secret** 到 `SUPABASE_JWT_SECRET`

#### 2.4 配置 Storage（文件上传测试需要）

1. 在 Supabase Dashboard，点击 **Storage**
2. 创建 bucket: `knowfun-files`（勾选 Public bucket）
3. Storage 配置已经在 `.env.example` 中预设，通常不需要修改

```bash
SUPABASE_ENDPOINT=https://your-project-ref.supabase.co/storage/v1/s3
SUPABASE_BUCKET_NAME=knowfun-files
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 运行测试

```bash
python verify_supabase.py
```

## 测试内容

测试脚本会验证以下功能：

### ✅ 测试 1: 环境变量配置验证

- 检查所有必需的环境变量是否已配置
- 识别缺失或使用示例值的配置项

### ✅ 测试 2: PostgreSQL 数据库连接

- 连接到 Supabase PostgreSQL 数据库
- 查询数据库版本
- 列出现有数据表

### ✅ 测试 3: Storage 文件上传

- 检查 Storage Bucket 是否存在
- 上传测试文件
- 获取文件公开 URL
- 下载文件并验证内容
- 删除测试文件（清理）

### ✅ 测试 4: Auth JWT 验证

- 验证 JWT Secret 格式
- 测试 Auth API 访问
- 验证 Service Key 权限

## 预期输出

成功的测试输出示例：

```
============================================================
                    1. 环境变量配置验证
============================================================

✓ SUPABASE_URL: 已配置
  → https://abc...xyz.supabase.co
✓ SUPABASE_KEY: 已配置
  → eyJhb...xyz123
...

配置统计: 7/7 项已配置
✓ 所有环境变量配置正确！

============================================================
                  2. PostgreSQL 数据库连接测试
============================================================

ℹ 正在连接数据库...
✓ 数据库连接成功
  → PostgreSQL 版本: PostgreSQL 15.1
  → 当前数据库: postgres
ℹ 数据库中还没有表（可能需要运行 alembic upgrade head）
✓ 数据库连接测试通过！

============================================================
              3. Supabase Storage 文件上传测试
============================================================

ℹ 正在初始化 Supabase Storage 客户端...
ℹ 检查 Storage Bucket...
✓ Bucket 'knowfun-files' 存在

ℹ 正在测试文件上传...
✓ 文件上传成功: test/test-20251114-120530.txt
✓ 文件公开访问 URL:
  → https://abc...supabase.co/storage/v1/object/public/knowfun-files/test/...

ℹ 检查上传的文件...
✓ 发现 1 个测试文件:
  • test-20251114-120530.txt (78 bytes)

ℹ 测试文件下载...
✓ 文件下载成功，内容匹配

ℹ 清理测试文件...
✓ 测试文件已删除

✓ Storage 文件上传测试通过！

============================================================
                4. Supabase Auth JWT 验证测试
============================================================

ℹ 正在测试 Supabase Auth...
ℹ 检查 Auth 配置...
✓ JWT Secret 格式正确

ℹ 测试 Auth API 访问...
✓ Auth API 正常（未登录状态）

ℹ 测试 Service Key 权限...
✓ Service Key 验证通过
  → Auth 提供商: Email only

✓ Auth JWT 验证测试通过！

============================================================
                        测试结果汇总
============================================================

总测试数: 4
通过: 4
失败: 0

  CONFIG               ✓ PASS
  DATABASE             ✓ PASS
  STORAGE              ✓ PASS
  AUTH                 ✓ PASS

🎉 所有测试通过！Supabase 配置完全正常。

ℹ 下一步:
  1. 运行数据库迁移: alembic upgrade head
  2. 启动后端服务器: uvicorn app.main:app --reload
  3. 开始实现业务逻辑
```

## 常见错误及解决方案

### 错误 1: .env 文件不存在

```
✗ .env 文件不存在！
```

**解决方案**: 运行 `cp .env.example .env`

---

### 错误 2: 环境变量未配置

```
✗ SUPABASE_URL: 未配置或使用示例值
```

**解决方案**: 编辑 `.env` 文件，填入真实的 Supabase 凭证

---

### 错误 3: 数据库连接失败

```
✗ 数据库连接失败: connection refused
```

**可能原因**:
1. `DATABASE_URL` 格式错误
2. 数据库密码错误
3. 网络连接问题
4. Supabase 项目被暂停（免费版长时间不用会暂停）

**解决方案**:
1. 检查 `DATABASE_URL` 格式: `postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres`
2. 重新复制数据库密码（不要有多余空格）
3. 检查网络连接
4. 在 Supabase Dashboard 恢复项目

---

### 错误 4: Storage Bucket 不存在

```
✗ Bucket 'knowfun-files' 不存在
```

**解决方案**:
1. 登录 Supabase Dashboard
2. 进入 **Storage**
3. 点击 **New Bucket**
4. 名称: `knowfun-files`
5. 勾选 **Public bucket**
6. 点击 **Create bucket**

---

### 错误 5: Storage 上传权限错误

```
✗ Storage 测试失败: Row Level Security policy violation
```

**解决方案**: 配置 Storage RLS 策略

1. 在 Supabase Dashboard，进入 **Storage** → 选择 `knowfun-files`
2. 点击 **Policies**
3. 添加以下策略:

```sql
-- 允许所有人读取
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'knowfun-files' );

-- 允许认证用户上传
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'knowfun-files' );
```

---

### 错误 6: JWT Secret 格式错误

```
✗ JWT Secret 长度过短
```

**解决方案**:
1. 在 Supabase Dashboard，进入 **Settings** → **API**
2. 找到 **JWT Settings** → **JWT Secret**
3. 复制完整的 base64 编码字符串（通常很长）
4. 粘贴到 `.env` 的 `SUPABASE_JWT_SECRET`

---

## 测试后的下一步

### 1. 运行数据库迁移

如果数据库测试通过但没有表，运行迁移：

```bash
alembic upgrade head
```

### 2. 再次测试

迁移后重新运行测试，应该能看到创建的表：

```bash
python verify_supabase.py
```

预期输出:

```
✓ 发现 7 个数据表:
    • users
    • documents
    • courses
    • export_tasks
    • posts
    • referrals
    • subscriptions
```

### 3. 启动开发服务器

```bash
uvicorn app.main:app --reload
```

访问 `http://localhost:8000/docs` 查看 API 文档。

---

## 高级选项

### 只测试特定功能

修改 `verify_supabase.py` 的 `main()` 函数，注释掉不需要的测试：

```python
# results['storage'] = await test_storage_upload()  # 跳过 Storage 测试
```

### 调试模式

设置环境变量启用详细日志：

```bash
DEBUG=True python verify_supabase.py
```

---

## 获取帮助

如果测试失败：

1. 查看上述常见错误解决方案
2. 阅读 `DATABASE_SETUP.md` 获取详细配置说明
3. 检查 Supabase Dashboard 的日志
4. 确认 Supabase 项目状态（是否暂停）

---

## 总结

完成测试后，你应该确认：

- ✅ 数据库连接正常
- ✅ Storage 文件上传/下载正常
- ✅ Auth JWT 验证正常
- ✅ 所有环境变量配置正确

现在可以开始开发业务逻辑了！🚀
