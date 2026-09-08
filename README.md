# 游戏资讯博客

这是一个使用 Astro 框架和 React 构建的功能丰富的游戏资讯博客项目。该项目包含互动元素、内容组织功能以及可定制的界面。

## 主要功能

-   **Astro 驱动的博客**: 基于 [Astro](https://astro.build/) 的核心博客功能，使用 Markdown/MDX 进行内容创作。
-   **React 组件**: 交互式 UI 元素使用 [React](https://react.dev/) 构建，并无缝集成到 Astro 页面中。
-   **RSS Feed**: 自动生成 RSS feed (位于 `/rss.xml`)，用于内容聚合和订阅。
-   **用户互动与认证 (基于 Supabase)**:
    -   用户注册、登录、邮箱确认与找回密码流程。
    -   博客文章实时评论系统，支持楼层号、点赞与编辑历史。
    -   统一行级安全控制 (RLS) 与用户资料管理。
-   **参与度指标**:
    -   每篇博客文章底部可显示热力图可视化。
-   **导航与发现**:
    -   页脚包含社交媒体和游戏平台的占位符链接。
    -   年度和月度博客归档系统，包括侧边栏小部件和专门的归档页面，方便用户浏览过往内容。
-   **可定制样式**: 使用 CSS 变量进行全局样式和主题调整，基于 Bear Blog 主题。

## 技术栈

-   **框架**: [Astro](https://astro.build/)
-   **UI 库**: [React](https://react.dev/) (通过 `@astrojs/react` 集成)
-   **内容格式**: Markdown & MDX (`@astrojs/mdx`)
-   **RSS 生成**: `@astrojs/rss`
-   **站点地图**: `@astrojs/sitemap` (根据初始配置隐式包含)
-   **样式**: CSS (使用自定义属性 Custom Properties)

## 详细开发与部署指南

关于如何在本地运行此项目、了解详细的项目结构、如何添加新内容、以及如何部署项目（包括部署到 Vercel 的说明），请参阅我们的：

➡️ **[开发与部署指南 (DEVELOPMENT.md)](./DEVELOPMENT.md)**

本文档 (`DEVELOPMENT.md`) 包含了所有必要的详细技术信息，帮助您开始使用和进一步开发此项目。

---

希望您喜欢这个项目！
