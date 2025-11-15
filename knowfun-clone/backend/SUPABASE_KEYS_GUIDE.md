# Supabase API Keys 详解

## 🔑 两种 API Keys 的区别

### 1. SUPABASE_KEY (anon public key)

**标识**: `anon` | `public`

**用途**:
- ✅ 前端应用（浏览器、移动端）
- ✅ 客户端 JavaScript 代码
- ✅ 公开的 API 调用

**权限**:
- ⚠️ 受 Row Level Security (RLS) 策略限制
- ⚠️ 只能访问被 RLS 允许的数据
- ⚠️ 不能绕过安全策略

**安全性**:
- ✅ 可以安全地暴露在客户端代码中
- ✅ 可以提交到 GitHub（虽然不推荐）
- ✅ 即使泄露，攻击者也受 RLS 限制

**使用场景**:
```javascript
// 前端代码 - Next.js / React
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-public-key'  // ← 使用 anon key
)

// 用户只能访问自己的数据（受 RLS 保护）
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('user_id', userId)
```

---

### 2. SUPABASE_SERVICE_KEY (service_role key)

**标识**: `service_role` | `secret` ⚠️

**用途**:
- ✅ 后端应用（服务器端）
- ✅ API 服务器
- ✅ 管理员操作

**权限**:
- 🔥 **完全绕过** Row Level Security (RLS)
- 🔥 **完全访问** 所有数据库表
- 🔥 **超级管理员** 权限

**安全性**:
- 🚨 **绝对不能** 暴露在客户端
- 🚨 **绝对不能** 提交到 GitHub
- 🚨 **绝对不能** 在浏览器中使用
- 🚨 泄露会导致数据库完全暴露

**使用场景**:
```python
# 后端代码 - FastAPI / Python
from supabase import create_client

supabase = create_client(
    'https://your-project.supabase.co',
    'your-service-role-key'  # ← 使用 service_role key
)

# 可以访问所有数据（绕过 RLS）
data = supabase.table('documents').select('*').execute()

# 可以执行管理员操作
supabase.table('users').delete().eq('id', user_id).execute()
```

---

## 📊 对比表格

| 特性 | anon (public) | service_role (secret) |
|------|---------------|----------------------|
| **使用位置** | 前端 / 客户端 | 后端 / 服务器 |
| **权限级别** | 受限用户 | 超级管理员 |
| **RLS 策略** | ✅ 必须遵守 | ❌ 完全绕过 |
| **可见性** | 可以公开 | 必须保密 |
| **泄露风险** | 低（受 RLS 保护） | 极高（完全访问） |
| **使用场景** | 用户登录、查询自己的数据 | 管理操作、批量处理 |

---

## 🌐 如何在网页获取这两个 Keys

### 步骤 1: 登录 Supabase Dashboard

1. 访问: https://supabase.com/dashboard
2. 登录你的账号

### 步骤 2: 选择你的项目

项目引用: `mtiemnxytobghwsahvot`

### 步骤 3: 进入 API 设置页面

1. 点击左侧菜单 **Settings** ⚙️（齿轮图标）
2. 在下拉菜单中选择 **API**

### 步骤 4: 找到 Project API keys 部分

页面会显示类似这样的界面：

```
┌─────────────────────────────────────────────────────────────┐
│ Project API keys                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Project URL                                                  │
│ https://mtiemnxytobghwsahvot.supabase.co                   │
│ [Copy]                                                       │
│                                                              │
│ ─────────────────────────────────────────────────────────   │
│                                                              │
│ anon                                              public     │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh... │
│ [Copy]                                                       │
│                                                              │
│ ─────────────────────────────────────────────────────────   │
│                                                              │
│ service_role                                        secret   │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh... │
│ [Copy]                                          ⚠️ Secret    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 步骤 5: 复制 Keys

#### 复制 anon (public) key

1. 找到标有 **`anon`** 和 **`public`** 的那一行
2. 点击右侧的 **[Copy]** 按钮
3. 这就是你的 `SUPABASE_KEY`

**格式示例**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aWVtbnh5dG9iZ2h3c2Fodm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1NzE3MjUsImV4cCI6MjA0NzE0NzcyNX0.xxx
```

#### 复制 service_role (secret) key

1. 找到标有 **`service_role`** 和 **`secret`** ⚠️ 的那一行
2. 点击右侧的 **[Copy]** 按钮
3. 这就是你的 `SUPABASE_SERVICE_KEY`

**格式示例**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aWVtbnh5dG9iZ2h3c2Fodm90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTU3MTcyNSwiZXhwIjoyMDQ3MTQ3NzI1fQ.xxx
```

---

## 📝 如何更新 .env 文件

### 打开文件

```bash
/Users/ganguohua/Desktop/xiazhe_2025/project_front/knowfun-clone/backend/.env
```

### 替换以下行

**第 14 行 - SUPABASE_KEY**:
```bash
# 替换前
SUPABASE_KEY=your-anon-key

# 替换后（粘贴你复制的 anon key）
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aWVtbnh5dG9iZ2h3c2Fodm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1NzE3MjUsImV4cCI6MjA0NzE0NzcyNX0.xxx
```

**第 15 行 - SUPABASE_SERVICE_KEY**:
```bash
# 替换前
SUPABASE_SERVICE_KEY=your-service-role-key

# 替换后（粘贴你复制的 service_role key）
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aWVtbnh5dG9iZ2h3c2Fodm90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTU3MTcyNSwiZXhwIjoyMDQ3MTQ3NzI1fQ.xxx
```

**第 33-34 行 - Storage 配置（使用相同的 service_role key）**:
```bash
# 替换前
SUPABASE_ACCESS_KEY_ID=c2fc93cd64ef6b3c7da4eea19f60ebd887a0bdfdb6598b725f93c3baab528fcd
SUPABASE_SECRET_ACCESS_KEY=9ff1a54c867b6f97b3d8fb85b5ddd5a3

# 替换后（都使用 service_role key）
SUPABASE_ACCESS_KEY_ID=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aWVtbnh5dG9iZ2h3c2Fodm90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTU3MTcyNSwiZXhwIjoyMDQ3MTQ3NzI1fQ.xxx
SUPABASE_SECRET_ACCESS_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aWVtbnh5dG9iZ2h3c2Fodm90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTU3MTcyNSwiZXhwIjoyMDQ3MTQ3NzI1fQ.xxx
```

---

## 🔐 安全注意事项

### ✅ 可以做的

- ✅ 在前端代码中使用 `anon` key
- ✅ 将 `anon` key 提交到代码仓库
- ✅ 在客户端 JavaScript 中暴露 `anon` key

### 🚨 绝对不能做的

- 🚨 **永远不要** 在前端使用 `service_role` key
- 🚨 **永远不要** 将 `service_role` key 提交到 GitHub
- 🚨 **永远不要** 在浏览器中暴露 `service_role` key
- 🚨 **永远不要** 分享 `service_role` key 给任何人

### 💡 最佳实践

1. **service_role key 只用于**:
   - 后端服务器代码
   - 管理员脚本
   - 数据库迁移工具

2. **使用环境变量**:
   - 将 keys 存储在 `.env` 文件中
   - 确保 `.env` 在 `.gitignore` 中

3. **定期轮换**:
   - 如果怀疑泄露，立即在 Supabase Dashboard 重新生成

---

## ✅ 验证配置

配置完成后，运行测试：

```bash
python verify_supabase.py
```

应该看到：

```
✓ SUPABASE_KEY: 已配置
✓ SUPABASE_SERVICE_KEY: 已配置
✓ 数据库连接成功
✓ Storage 文件上传成功
✓ Auth JWT 验证通过
```

---

## 📸 截图参考位置

在 Supabase Dashboard 中：

```
Dashboard > 你的项目 > Settings > API
                                    ↑
                            在这里找到 API keys
```

页面 URL 应该类似：
```
https://supabase.com/dashboard/project/mtiemnxytobghwsahvot/settings/api
```

---

## 🆘 常见问题

### Q: 我的 key 太长了，正常吗？

**A**: 正常！JWT token 通常有 200-300 个字符，以 `eyJ` 开头。

### Q: 两个 key 看起来很像？

**A**: 是的，它们格式相同，区别在于 payload 中的 `role` 字段：
- anon key: `"role":"anon"`
- service_role key: `"role":"service_role"`

### Q: 我不小心暴露了 service_role key，怎么办？

**A**: 立即在 Supabase Dashboard 重新生成：
1. Settings → API
2. 点击 service_role key 旁边的 **Regenerate** 按钮
3. 更新所有使用该 key 的服务器代码

---

**需要帮助？** 如果你找到了这两个 keys，告诉我，我可以帮你直接更新 .env 文件！
