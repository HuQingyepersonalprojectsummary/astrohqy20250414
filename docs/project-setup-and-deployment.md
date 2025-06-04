# 🚀 Astro 博客项目建立和部署完整指南

## 📋 项目概述

本项目是一个基于 Astro 框架的现代化博客系统，集成了 Supabase 数据库和用户认证，部署在 Vercel 平台上。具备完整的评论系统、用户管理和响应式设计。

## 🛠️ 技术栈

- **前端框架**: Astro + React
- **数据库**: Supabase (PostgreSQL)
- **认证系统**: Supabase Auth
- **部署平台**: Vercel
- **样式**: CSS + 响应式设计
- **内容管理**: 基于文件的 Markdown 系统

## 📦 项目初始化

### 1. 创建 Astro 项目

```bash
# 使用 Astro 官方模板创建项目
npm create astro@latest astrohqy20250414

# 选择配置选项
✔ How would you like to start your new project? › Use blog template
✔ Install dependencies? … Yes
✔ Do you plan to write TypeScript? … No
✔ Initialize a new git repository? … Yes
```

### 2. 安装必要依赖

```bash
cd astrohqy20250414

# 安装 Supabase 客户端
npm install @supabase/supabase-js

# 安装状态管理
npm install nanostores @nanostores/react

# 安装 React 相关依赖
npm install @astrojs/react @types/react @types/react-dom react react-dom
```

### 3. 配置 Astro

更新 `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://astrohqy20250414.vercel.app',
  integrations: [mdx(), sitemap(), react()],
  output: 'static'
});
```

## 🗄️ Supabase 数据库配置

### 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: astrohqy20250414
   - **Database Password**: 设置强密码
   - **Region**: 选择最近的区域

### 2. 获取项目凭据

在 Supabase Dashboard 中：
1. 进入 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**
   - **anon public key**

### 3. 配置环境变量

创建 `.env` 文件：

```env
# Supabase 配置
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 生产环境标识
NODE_ENV=production
```

### 4. 创建数据库表

在 Supabase SQL 编辑器中执行：

```sql
-- 创建用户资料表
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 创建评论表
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  ip_address TEXT,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  is_edited BOOLEAN DEFAULT false NOT NULL,
  floor_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  CONSTRAINT fk_comments_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 创建点赞表
CREATE TABLE public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(comment_id, user_id)
);

-- 创建编辑历史表
CREATE TABLE public.comment_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  old_content TEXT NOT NULL,
  edited_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  edited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_edit_history ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
```

## 🔧 项目结构配置

### 1. 创建 Supabase 客户端

`src/lib/supabaseClient.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase 客户端初始化:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length,
  env: import.meta.env.NODE_ENV || 'development'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2. 创建认证状态管理

`src/stores/authStore.js`:

```javascript
import { atom } from 'nanostores';

export const authStore = atom({
  user: null,
  session: null,
  isLoading: true,
  error: null
});

export function setAuthLoading(isLoading) {
  const currentState = authStore.get();
  authStore.set({
    ...currentState,
    isLoading
  });
}

export function setAuthSession(user, session) {
  authStore.set({
    user,
    session,
    isLoading: false,
    error: null
  });
}

export function setAuthError(error) {
  const currentState = authStore.get();
  authStore.set({
    ...currentState,
    error,
    isLoading: false
  });
}
```

## 🚀 Vercel 部署配置

### 1. 创建 GitHub 仓库

```bash
# 初始化 Git 仓库
git init
git add .
git commit -m "初始化 Astro 博客项目"

# 连接到 GitHub
git remote add origin https://github.com/username/astrohqy20250414.git
git branch -M feat/interactive-blog-enhancements
git push -u origin feat/interactive-blog-enhancements
```

### 2. 连接 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择 GitHub 仓库
4. 配置项目设置：
   - **Framework Preset**: Astro
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. 配置环境变量

在 Vercel 项目设置中添加环境变量：

```
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=production
```

### 4. 部署

```bash
# 推送代码触发自动部署
git push origin feat/interactive-blog-enhancements
```

## 🔐 认证系统配置

### 1. 配置 Supabase Auth

在 Supabase Dashboard 中：
1. 进入 **Authentication** → **Settings**
2. 配置 **Site URL**: `https://astrohqy20250414.vercel.app`
3. 添加 **Redirect URLs**:
   - `https://astrohqy20250414.vercel.app/auth/callback`
   - `http://localhost:4321/auth/callback` (开发环境)

### 2. 启用认证提供商

在 **Authentication** → **Providers** 中启用：
- Email (默认启用)
- 可选：Google, GitHub 等第三方登录

## 📊 项目监控和维护

### 1. Vercel 监控

- **部署日志**: 查看构建和部署状态
- **函数日志**: 监控 API 调用
- **分析**: 查看网站访问统计

### 2. Supabase 监控

- **数据库**: 监控查询性能
- **认证**: 查看用户注册和登录统计
- **存储**: 监控文件上传和访问

### 3. 性能优化

- **图片优化**: 使用 WebP 格式
- **代码分割**: Astro 自动处理
- **CDN**: Vercel 全球 CDN 加速

## 🔧 故障排除

### 常见问题

1. **构建失败**
   - 检查环境变量配置
   - 验证 Supabase 连接
   - 查看 Vercel 构建日志

2. **认证问题**
   - 确认 Redirect URLs 配置
   - 检查 RLS 策略
   - 验证 API 密钥

3. **数据库连接**
   - 确认 Supabase URL 和密钥
   - 检查网络连接
   - 验证表结构

## 📈 后续扩展

### 可添加功能

- **SEO 优化**: 元标签、结构化数据
- **搜索功能**: 全文搜索
- **标签系统**: 文章分类
- **RSS 订阅**: 自动生成 RSS
- **评论通知**: 邮件通知
- **管理后台**: 内容管理界面

### 性能优化

- **图片懒加载**: 提升页面加载速度
- **代码压缩**: 减少包体积
- **缓存策略**: 优化加载时间
- **PWA 支持**: 离线访问

## 🎯 部署验证清单

### 部署成功验证

- [ ] 网站可以正常访问
- [ ] 用户注册/登录功能正常
- [ ] 评论系统工作正常
- [ ] 文章列表显示正确
- [ ] 响应式设计在移动端正常
- [ ] 所有页面加载速度正常

### 功能测试清单

- [ ] 用户注册新账户
- [ ] 用户登录/登出
- [ ] 发表评论
- [ ] 编辑自己的评论
- [ ] 删除自己的评论
- [ ] 点赞/取消点赞评论
- [ ] 查看评论楼层号
- [ ] 文章页面导航

## 📞 技术支持

### 官方文档

- **Astro**: https://docs.astro.build/
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
- **React**: https://react.dev/

### 社区资源

- **Astro Discord**: https://astro.build/chat
- **Supabase Discord**: https://discord.supabase.com/
- **GitHub Issues**: 项目仓库的 Issues 页面

---

*本文档记录了完整的项目建立和部署流程，可作为参考和维护指南。*
