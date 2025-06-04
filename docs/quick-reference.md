# 🚀 Astro 博客快速参考手册

## 📝 文章管理速查

### 添加新文章
```bash
# 1. 创建文件
touch src/content/blog/my-new-article.md

# 2. 编写内容（使用模板）
---
title: '文章标题'
description: '文章描述'
pubDate: 'Jan 15 2025'
heroImage: '/blog-placeholder-1.jpg'
---

# 文章内容...

# 3. 发布
git add .
git commit -m "添加新文章：文章标题"
git push origin feat/interactive-blog-enhancements
```

### 删除文章
```bash
# 1. 删除文件
rm src/content/blog/article-to-delete.md

# 2. 发布
git add .
git commit -m "删除文章：文章标题"
git push origin feat/interactive-blog-enhancements
```

### 编辑文章
```bash
# 1. 编辑文件
code src/content/blog/article-name.md

# 2. 发布
git add .
git commit -m "更新文章：文章标题"
git push origin feat/interactive-blog-enhancements
```

## 🎨 可用头图

- `/blog-placeholder-1.jpg` - 蓝色抽象
- `/blog-placeholder-2.jpg` - 绿色自然
- `/blog-placeholder-3.jpg` - 橙色温暖
- `/blog-placeholder-4.jpg` - 紫色科技
- `/blog-placeholder-5.jpg` - 红色活力
- `/blog-placeholder-about.jpg` - 关于页面

## 📋 Front Matter 模板

```yaml
---
title: '具体而吸引人的标题'
description: '150字以内的准确描述，包含关键词'
pubDate: 'Jan 15 2025'
heroImage: '/blog-placeholder-1.jpg'
---
```

## 🔧 常用 Markdown 语法

```markdown
# 标题
## 二级标题
### 三级标题

**粗体** *斜体* ~~删除线~~

[链接](https://example.com)
![图片](/image.jpg)

> 引用文本

- 列表项
- 列表项

1. 有序列表
2. 有序列表

`行内代码`

```代码块```

| 表格 | 标题 |
|------|------|
| 内容 | 内容 |
```

## 🚀 部署命令

```bash
# 本地开发
npm run dev

# 本地构建测试
npm run build
npm run preview

# 发布到生产环境
git add .
git commit -m "描述性信息"
git push origin feat/interactive-blog-enhancements
```

## 🔍 故障排除

### 文章不显示
- 检查文件路径：`src/content/blog/`
- 检查文件扩展名：`.md`
- 检查 Front Matter 格式

### 构建失败
```bash
# 查看详细错误
npm run build -- --verbose

# 检查语法
npm run dev
```

### 图片不显示
- 确认路径：`/image.jpg`（相对于 public 目录）
- 检查文件存在：`public/image.jpg`

## 📊 项目结构

```
astrohqy20250414/
├── src/
│   ├── content/
│   │   └── blog/          # 📝 文章目录
│   ├── components/        # ⚛️ React 组件
│   ├── layouts/          # 🎨 页面布局
│   ├── pages/            # 📄 页面路由
│   ├── stores/           # 🗄️ 状态管理
│   └── lib/              # 🔧 工具函数
├── public/               # 🖼️ 静态资源
├── docs/                 # 📚 文档目录
└── dist/                 # 🏗️ 构建输出
```

## 🌐 重要链接

- **网站**: https://astrohqy20250414.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub 仓库**: https://github.com/username/astrohqy20250414

## 📞 技术支持

### 官方文档
- **Astro**: https://docs.astro.build/
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs

### 社区
- **Astro Discord**: https://astro.build/chat
- **Supabase Discord**: https://discord.supabase.com/

## ⚡ 快速检查清单

### 发布前
- [ ] Front Matter 格式正确
- [ ] 标题和描述有吸引力
- [ ] 头图路径正确
- [ ] 内容结构清晰
- [ ] 本地预览正常

### 发布后
- [ ] 网站显示正常
- [ ] 图片加载正常
- [ ] 链接可点击
- [ ] 移动端正常
- [ ] 评论功能正常

---

*快速参考手册，随时查阅！*
