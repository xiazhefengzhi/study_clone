# KnowFun 功能分析文档

## 项目概述
KnowFun 是一款 AI 驱动的学习平台，将学习资料转化为个性化多模态内容，实现因材施教的学习体验。

## 核心功能模块

### 1. 用户认证系统 (Clerk)
**功能描述：**
- 用户注册、登录、登出
- 用户信息管理
- 头像、用户名、邮箱展示

**技术栈：**
- Clerk.js 认证
- 会话管理

---

### 2. 推荐有礼系统
**功能描述：**
- 生成个人专属推荐码
- 推荐链接分享
- 推荐统计（推荐人数、获得积分）
- 积分奖励规则：
  - 推荐者：500 积分
  - 被推荐者：100 积分

**API 端点：**
- `GET /api/referral/code` - 获取推荐码
- `GET /api/referral/stats` - 获取推荐统计
- `GET /api/referral/rules` - 获取推荐规则

---

### 3. 内容广场
**功能描述：**
- 用户创作内容展示（卡片式布局）
- 分类筛选：
  - 全部
  - 教学类
  - 历史类
  - 科学类
  - 文学类
  - 商业类
  - 技术类
  - 生活类
  - 其他
- 搜索功能
- 排序选项（热门）
- 内容卡片信息：
  - 封面图
  - 标题
  - 分类标签
  - 作者信息
  - 点赞数
  - 浏览数

**特色功能：**
- 轮播推荐卡片（发现精彩内容、创作作品、学习新技能、展示才华）
- 创建演示按钮

---

### 4. 讲解制作
**功能描述：**
- 多种输入方式：
  - 文本输入（URL、问题、知识点）
  - 文件上传（PDF、PPT、Word）
  - 拖拽上传
- AI 智能讲解生成
- 个性化配置：
  - 讲解风格（20+ 风格）
  - 难度等级
  - 内容形式

**工作流程：**
1. 资料输入
2. 文档解析
3. 讲解生成
4. 讲解展示

---

### 5. 我的文档
**功能描述：**
- 文档列表展示
- 视图切换（网格视图/列表视图）
- 文档搜索
- 文档状态：
  - 成功
  - 处理中
  - 失败
- 文档信息：
  - 封面/预览
  - 标题
  - 创建时间
  - 状态标识
- 添加文档入口

**存储限制：**
- Free: 5GB
- Basic: 10GB
- Plus: 30GB
- Pro: 100GB

---

### 6. 我的讲解
**功能描述：**
- 讲解列表展示
- 视图切换（网格视图/列表视图）
- 讲解搜索
- 从文档创建讲解
- 空状态提示

---

### 7. 导出任务看板
**功能描述：**
- 任务统计卡片：
  - 总任务数
  - 成功率（完成数/总数）
  - 处理中数量
  - 失败数量
- 任务列表
- 任务状态跟踪
- 刷新功能
- 查看讲解快捷入口

---

### 8. 订阅套餐系统
**套餐类型：**

#### Free 版
- 价格：$0
- 积分：500（永久有效）
- 存储：5GB
- 功能：基础功能体验、支持导出视频

#### Basic 版
- 价格：$9.79/月（原价 $12.99，Save 25%）
- 积分：1500 credits/月（按月清零）
- 存储：10GB
- 功能：
  - 支持导出基础版 PPT
  - 基础讲解风格（幽默课堂/严谨学术）

#### Plus 版（最受欢迎）
- 价格：$19.49/月（原价 $29.99，Save 35%）
- 积分：5000 credits/月（按月清零）
- 存储：30GB
- 功能：
  - 包含 Basic 版所有功能
  - 20+ 讲解风格解锁

#### Pro 版
- 价格：$49.99/月（原价 $84.99，Save 40%）
- 积分：100,000 credits/月（按月清零）
- 存储：100GB
- 功能：
  - 包含 Plus 版所有功能
  - 优先支持

**存储使用情况：**
- 已使用空间显示
- 使用百分比
- 剩余空间
- 文档数量统计

---

### 9. 用户中心
**功能描述：**
- 个人信息展示
- 订阅信息查看
- 积分使用情况
- 存储使用情况

---

### 10. 消息中心
**功能描述：**
- 通知消息列表
- 未读消息数量
- 消息状态管理

---

### 11. 其他功能

#### 语言切换
- 中文（ZH）
- 英文（EN）

#### 主题切换
- 浅色主题
- 深色主题

#### 工作室
- 下拉菜单（功能待探索）

---

## 技术栈要求

### 前端
- **框架：** Next.js 14
- **UI 组件：** shadcn/ui（基于 Radix UI）
- **样式：** Tailwind CSS
- **图标：** Lucide React
- **认证：** Clerk.js
- **加载条：** NProgress
- **动画：** Framer Motion

### 后端
- **框架：** Python FastAPI
- **数据库：**
  - MongoDB（主数据库）
  - SQLite（备用/缓存）
- **ORM：** SQLAlchemy / Beanie (MongoDB)

---

## 数据库设计要点

### 用户表 (Users)
- user_id
- clerk_id
- email
- username
- avatar_url
- subscription_tier
- points_balance
- storage_used
- created_at
- updated_at

### 文档表 (Documents)
- document_id
- user_id
- title
- file_url
- file_type
- file_size
- status (pending/processing/success/failed)
- created_at
- updated_at

### 讲解表 (Courses)
- course_id
- user_id
- document_id
- title
- description
- cover_image
- style
- difficulty
- views_count
- likes_count
- category
- is_public
- created_at
- updated_at

### 导出任务表 (Export_Tasks)
- task_id
- user_id
- course_id
- export_type (ppt/video)
- status (pending/processing/completed/failed)
- file_url
- created_at
- completed_at

### 推荐记录表 (Referrals)
- referral_id
- referrer_user_id
- referee_user_id
- referral_code
- points_awarded
- created_at

### 订阅表 (Subscriptions)
- subscription_id
- user_id
- tier (free/basic/plus/pro)
- points_monthly
- storage_limit
- start_date
- end_date
- auto_renew

### 内容广场表 (Posts)
- post_id
- course_id
- user_id
- category
- views_count
- likes_count
- is_featured
- created_at

---

## API 端点设计

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/profile` - 获取用户信息

### 推荐系统
- `GET /api/referral/code` - 获取推荐码
- `GET /api/referral/stats` - 获取推荐统计
- `POST /api/referral/claim` - 领取推荐奖励

### 文档管理
- `GET /api/documents` - 获取文档列表
- `POST /api/documents` - 上传文档
- `GET /api/documents/:id` - 获取文档详情
- `DELETE /api/documents/:id` - 删除文档

### 讲解管理
- `GET /api/courses` - 获取讲解列表
- `POST /api/courses` - 创建讲解
- `GET /api/courses/:id` - 获取讲解详情
- `PUT /api/courses/:id` - 更新讲解
- `DELETE /api/courses/:id` - 删除讲解

### 内容广场
- `GET /api/posts` - 获取内容列表（支持分类、搜索、排序）
- `GET /api/posts/:id` - 获取内容详情
- `POST /api/posts/:id/like` - 点赞内容
- `POST /api/posts/:id/view` - 增加浏览数

### 导出任务
- `GET /api/export-tasks` - 获取任务列表
- `POST /api/export-tasks` - 创建导出任务
- `GET /api/export-tasks/:id` - 获取任务详情
- `GET /api/export-tasks/stats` - 获取任务统计

### 订阅管理
- `GET /api/subscriptions/current` - 获取当前订阅
- `POST /api/subscriptions/upgrade` - 升级订阅
- `GET /api/subscriptions/usage` - 获取使用情况

---

## 页面路由设计

### 公开页面
- `/` - 首页
- `/zh` - 中文首页
- `/fun-square` - 内容广场
- `/posts/:id` - 内容详情
- `/pricing` - 价格页面
- `/privacy` - 隐私政策
- `/terms` - 服务条款

### 认证页面
- `/sign-in` - 登录
- `/sign-up` - 注册

### 用户页面（需登录）
- `/learn/course-creation` - 讲解制作
- `/learn/my-document` - 我的文档
- `/learn/my-courses` - 我的讲解
- `/learn/export-task-list` - 导出任务
- `/learn/user-center` - 用户中心
- `/notifications` - 消息中心
- `/upgrade` - 升级套餐
- `/referral` - 推荐有礼

---

## 关键功能实现要点

### 1. 文件上传
- 支持拖拽上传
- 文件类型验证（PDF、PPT、Word）
- 文件大小限制
- 上传进度显示
- 云存储集成（AWS S3 / 阿里云 OSS）

### 2. AI 讲解生成
- 文档解析（PDF、PPT、Word）
- 内容提取
- AI 生成（调用 LLM API）
- 流式输出
- 错误处理和重试

### 3. 积分系统
- 积分消耗记录
- 积分充值（推荐、订阅）
- 积分过期管理（按月清零）
- 积分不足提醒

### 4. 存储管理
- 存储空间计算
- 存储限制检查
- 文件清理机制
- 存储统计展示

### 5. 实时状态更新
- WebSocket 连接
- 任务状态推送
- 进度条更新
- 完成通知

---

## 优先级排序

### P0（必须实现）
1. 用户认证（Clerk）
2. 讲解制作（文本输入 + AI 生成）
3. 我的讲解
4. 基础订阅系统

### P1（重要功能）
1. 我的文档
2. 文件上传
3. 内容广场（基础展示）
4. 导出任务
5. 推荐系统

### P2（增强功能）
1. 多种讲解风格
2. 高级搜索和筛选
3. 社交功能（点赞、评论）
4. 消息中心
5. 主题切换

---

## 开发阶段规划

### 第一阶段：基础架构（1-2 周）
- 项目初始化
- 数据库设计
- 基础 API 搭建
- Clerk 认证集成
- 基础 UI 组件库

### 第二阶段：核心功能（2-3 周）
- 讲解制作
- AI 集成
- 我的讲解
- 订阅系统

### 第三阶段：高级功能（2-3 周）
- 文档管理
- 内容广场
- 导出任务
- 推荐系统

### 第四阶段：优化和发布（1-2 周）
- 性能优化
- 错误处理
- 测试
- 部署

---

## 预期挑战

1. **AI 生成质量控制**
   - 解决方案：提示词优化、模型选择、生成参数调整

2. **大文件处理**
   - 解决方案：分片上传、后台处理、队列系统

3. **实时状态同步**
   - 解决方案：WebSocket、轮询、Server-Sent Events

4. **存储成本控制**
   - 解决方案：文件压缩、定期清理、CDN 加速

5. **并发处理**
   - 解决方案：任务队列、限流、缓存
