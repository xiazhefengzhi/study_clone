# 获取 Supabase API Keys 指南

数据库连接已成功！✓

现在需要获取 Supabase API Keys 以完成完整配置。

## 📋 当前配置状态

- ✅ DATABASE_URL - 已配置并测试成功
- ✅ SUPABASE_URL - 已配置
- ✅ SUPABASE_ENDPOINT - 已配置（Storage）
- ✅ SUPABASE_JWT_SECRET - 已配置
- ⏳ SUPABASE_KEY - 需要获取
- ⏳ SUPABASE_SERVICE_KEY - 需要获取

## 🔑 获取 API Keys 步骤

### 1. 登录 Supabase Dashboard

访问: https://supabase.com/dashboard

### 2. 选择你的项目

项目引用 (Project Ref): `mtiemnxytobghwsahvot`

### 3. 进入 Settings → API

1. 点击左侧菜单 **Settings**
2. 选择 **API**

### 4. 复制 API Keys

在 **Project API keys** 部分，你会看到两个密钥：

#### A. anon public (公开密钥)

```
用途: 客户端应用（前端）
权限: 受 RLS (Row Level Security) 限制
安全性: 可以公开
```

复制 `anon` `public` 密钥，更新 `.env`:

```bash
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（你的 anon key）
```

#### B. service_role (服务密钥)

```
用途: 服务端应用（后端）
权限: 绕过所有 RLS 限制，拥有完全权限
安全性: ⚠️ 绝对不能泄露或暴露在客户端
```

复制 `service_role` 密钥，更新 `.env`:

```bash
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（你的 service_role key）
```

### 5. 同时用于 Storage

Storage 配置也需要这些密钥：

```bash
# 使用 service_role key 作为 Access Keys（S3 兼容）
SUPABASE_ACCESS_KEY_ID=（你的 service_role key）
SUPABASE_SECRET_ACCESS_KEY=（你的 service_role key）
```

**注意**: Supabase Storage 的 S3 兼容 API 使用相同的 service_role key 作为访问密钥。

## ✏️ 更新 .env 文件

打开 `/Users/ganguohua/Desktop/xiazhe_2025/project_front/knowfun-clone/backend/.env`

更新以下行（保持其他配置不变）:

```bash
# 第 14 行
SUPABASE_KEY=eyJhbGc...（粘贴你的 anon key）

# 第 15 行
SUPABASE_SERVICE_KEY=eyJhbGc...（粘贴你的 service_role key）

# 第 33-34 行（Storage 配置）
SUPABASE_ACCESS_KEY_ID=（粘贴相同的 service_role key）
SUPABASE_SECRET_ACCESS_KEY=（粘贴相同的 service_role key）
```

## 🧪 运行完整测试

配置完成后，运行完整测试脚本：

```bash
cd /Users/ganguohua/Desktop/xiazhe_2025/project_front/knowfun-clone/backend
python verify_supabase.py
```

这将测试：
1. ✅ 环境变量配置验证
2. ✅ PostgreSQL 数据库连接（已通过）
3. ⏳ Storage 文件上传
4. ⏳ Auth JWT 验证

## 📸 Dashboard 截图参考

在 **Settings** → **API** 页面，你会看到类似这样的界面：

```
┌─────────────────────────────────────────┐
│ Project API keys                         │
├─────────────────────────────────────────┤
│                                          │
│ anon                               public│
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...   │
│ [Copy]                                   │
│                                          │
│ service_role                       secret│
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...   │
│ [Copy]                         ⚠️ Secret │
│                                          │
└─────────────────────────────────────────┘
```

点击 **[Copy]** 按钮直接复制密钥。

## ⚠️ 安全提醒

1. **service_role key 必须保密**
   - 不要提交到 Git
   - 不要在客户端代码中使用
   - 不要分享给他人
   - `.env` 文件已在 `.gitignore` 中

2. **anon key 可以公开**
   - 用于前端应用
   - 受 RLS 策略保护
   - 即使暴露也相对安全

## 🎯 下一步

配置完成后：

1. 运行完整测试: `python verify_supabase.py`
2. 运行数据库迁移: `alembic upgrade head`
3. 启动开发服务器: `uvicorn app.main:app --reload`

---

**需要帮助？**

如果找不到 API Keys 或有任何问题：
1. 确认你已登录正确的 Supabase 账号
2. 确认项目 ref 是 `mtiemnxytobghwsahvot`
3. 查看 Supabase 官方文档: https://supabase.com/docs/guides/api
