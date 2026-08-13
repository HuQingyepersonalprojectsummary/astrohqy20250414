# Vercel 部署配置指南

## 🚀 您的博客已成功部署！

**博客地址**: https://astrohqy20250414.vercel.app/

## 📋 需要完成的配置步骤

### 1. Vercel 环境变量配置

在 Vercel 项目仪表盘中添加以下环境变量：

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目 `astrohqy20250414`
3. 进入 **Settings** → **Environment Variables**
4. 添加以下变量：

```
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase 重定向URL配置

在 Supabase 项目仪表盘中配置重定向URL：

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 **Authentication** → **URL Configuration**
4. 更新以下设置：

**Site URL**:
```
https://astrohqy20250414.vercel.app
```

**Redirect URLs** (添加以下URL):
```
https://astrohqy20250414.vercel.app/auth/callback
https://astrohqy20250414.vercel.app
http://localhost:8110/auth/callback
http://localhost:8110
```

### 3. 数据库设置

如果还没有设置数据库表，请在 Supabase SQL 编辑器中执行 `supabase-setup.sql` 文件中的脚本。

### 4. 重新部署

完成环境变量配置后，在 Vercel 中触发重新部署：

1. 在 Vercel 项目页面点击 **Deployments**
2. 点击最新部署旁边的 **...** 菜单
3. 选择 **Redeploy**

## 🔧 功能测试

部署完成后，请测试以下功能：

### ✅ 基本功能
- [ ] 网站首页正常加载
- [ ] 博客文章列表显示
- [ ] 博客文章详情页面
- [ ] 归档页面功能

### ✅ 用户认证
- [ ] 用户注册功能
- [ ] 邮箱确认流程
- [ ] 用户登录功能
- [ ] 登出功能

### ✅ 评论系统
- [ ] 评论列表显示
- [ ] 登录用户可以发表评论
- [ ] 评论显示用户信息

## 🐛 常见问题

### 问题1: 注册后重定向到错误的URL
**解决方案**: 确保在 Supabase 中正确配置了重定向URL

### 问题2: 环境变量未生效
**解决方案**: 
1. 检查 Vercel 环境变量配置
2. 确保变量名以 `PUBLIC_` 开头
3. 重新部署项目

### 问题3: 评论功能报错
**解决方案**: 
1. 确保已执行数据库设置脚本
2. 检查 Supabase RLS 策略
3. 验证用户认证状态

## 📞 技术支持

如果遇到问题，请检查：

1. **Vercel 部署日志**: 查看构建和运行时错误
2. **浏览器控制台**: 查看客户端错误
3. **Supabase 日志**: 查看数据库和认证错误

## 🎉 恭喜！

您的 Astro 博客已成功部署到 Vercel，并集成了 Supabase 认证和评论系统！
