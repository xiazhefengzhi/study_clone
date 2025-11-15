# Frontend Setup Summary

**更新时间**: 2025-11-14

## ✅ 已完成

### 1. Supabase Client 配置
- ✅ `src/lib/supabase.ts` - Supabase 客户端配置
- ✅ `src/lib/api-client.ts` - 后端 API 客户端
- ✅ `.env.local` - 环境变量配置

### 2. 认证系统
- ✅ `src/contexts/auth-context.tsx` - Auth Context Provider
- ✅ `src/app/(auth)/sign-in/page.tsx` - 登录页面
- ✅ `src/app/(auth)/sign-up/page.tsx` - 注册页面
- ✅ `src/app/layout.tsx` - 集成 AuthProvider

### 3. API Integration
- ✅ 认证 API (register, login, refresh)
- ✅ 文档 API (upload, list, delete)
- ✅ 讲解 API (create, list, update, delete, like)

## 📦 需要安装的依赖

运行以下命令安装 Supabase 依赖：

```bash
cd frontend
npm install @supabase/supabase-js
```

## 🎨 需要创建的 UI 组件

使用 shadcn/ui CLI 安装所需组件：

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add select
```

或一次性安装全部：

```bash
npx shadcn-ui@latest add button input label card alert dialog dropdown-menu avatar progress tabs select
```

## 🚀 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问: http://localhost:3000

## 📝 环境变量配置

更新 `.env.local` 文件：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://mtiemnxytobghwsahvot.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>  # 从 Supabase Dashboard 获取

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 可用功能

### 认证流程
1. 访问 `/sign-up` 注册新账户
2. 访问 `/sign-in` 登录现有账户
3. 登录后自动跳转到 `/learn/course-creation`

### Auth Context 使用
```tsx
import { useAuth } from '@/contexts/auth-context'

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth()

  if (loading) return <div>Loading...</div>

  if (!user) return <div>Not logged in</div>

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### API Client 使用
```tsx
import { apiClient } from '@/lib/api-client'

// Upload document
const result = await apiClient.uploadDocument(file, 'My Document', 'Description')

// Get documents
const { documents, total } = await apiClient.getDocuments(1, 20)

// Create course
const course = await apiClient.createCourse({
  title: 'Python 入门',
  document_id: 1,
  style: '幽默课堂',
  difficulty: 'beginner'
})
```

## ⏳ 下一步开发

### 核心页面
- [ ] `/learn/course-creation` - 讲解制作页面
- [ ] `/learn/my-document` - 我的文档页面
- [ ] `/learn/my-courses` - 我的讲解页面
- [ ] `/learn/user-center` - 用户中心
- [ ] `/fun-square` - 内容广场

### 核心组件
- [ ] Header/Navbar - 导航栏
- [ ] Sidebar - 侧边栏
- [ ] DocumentUploader - 文档上传组件
- [ ] CourseCard - 讲解卡片
- [ ] DocumentCard - 文档卡片

## 🔗 重要文件

### 配置
- `frontend/.env.local` - 环境变量
- `frontend/next.config.mjs` - Next.js 配置
- `frontend/tsconfig.json` - TypeScript 配置

### 核心代码
- `src/lib/supabase.ts` - Supabase 客户端
- `src/lib/api-client.ts` - API 客户端
- `src/contexts/auth-context.tsx` - 认证状态管理
- `src/app/layout.tsx` - 根布局

### 页面
- `src/app/(auth)/sign-in/page.tsx` - 登录
- `src/app/(auth)/sign-up/page.tsx` - 注册

## 📚 相关文档

### 后端 API
查看 `backend/DEVELOPMENT_SUMMARY.md` 了解：
- 可用 API 端点
- 请求/响应格式
- 认证方式

### Swagger 文档
后端启动后访问:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)
