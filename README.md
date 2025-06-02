# 游戏资讯博客

这是一个使用 Astro 框架和 React 构建的功能丰富的游戏资讯博客项目。该项目包含互动元素、内容组织功能以及可定制的界面。

## 主要功能

-   **Astro 驱动的博客**: 基于 [Astro](https://astro.build/) 的核心博客功能，使用 Markdown/MDX 进行内容创作。
-   **React 组件**: 交互式 UI 元素使用 [React](https://react.dev/) 构建，并无缝集成到 Astro 页面中。
-   **RSS Feed**: 自动生成 RSS feed (位于 `/rss.xml`)，用于内容聚合和订阅。
-   **用户互动 (模拟功能)**:
    -   用户注册和登录表单 (前端模拟)。
    -   博客文章评论系统，允许用户（模拟）发表评论。
    -   显示（模拟的）评论者 IP 地址。
-   **参与度指标 (模拟功能)**:
    -   每篇博客文章底部显示热力图 (使用模拟数据和可视化)。
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

## 🚀 本地运行

请按照以下说明在本地设置和运行项目，以便进行开发或测试。

### 环境要求

-   **Node.js**: 请确保已安装 Node.js。您可以从 [nodejs.org](https://nodejs.org/) 下载。Astro 通常在 LTS版本的 Node.js 上运行效果最佳。
-   **npm**: npm (Node Package Manager) 已随 Node.js 一同安装。

### 安装与设置

1.  **克隆代码仓库:**
    ```bash
    git clone <your-repository-url> # 请将 <your-repository-url> 替换为实际的仓库 URL
    cd <repository-name>            # 请将 <repository-name> 替换为项目文件夹名称
    ```

2.  **安装依赖:**
    此命令将下载并安装 `package.json` 文件中定义的所有必需软件包。
    ```bash
    npm install
    ```

### 运行开发服务器

启动本地开发服务器：
```bash
npm run dev
```
通常，这会在 `http://localhost:4321` 启动服务器。控制台输出将确认访问地址。当您更改源文件时，服务器将自动重新加载。

### 构建生产版本

构建用于生产环境的静态站点：
```bash
npm run build
```
默认情况下，输出文件将放置在 `./dist/` 目录中。

### 预览生产版本

构建项目后，您可以在部署前在本地预览：
```bash
npm run preview
```
此命令将提供 `./dist/` 文件夹的内容。

### 其他 Astro 命令

您还可以通过 npm 使用其他 Astro CLI 命令：
```bash
npm run astro -- <command>
```
例如，运行 Astro 内置的诊断检查：
```bash
npm run astro check
```
获取 Astro CLI 的帮助信息：
```bash
npm run astro -- --help
```

## 项目结构

您的 Astro 项目中包含以下文件夹和文件：

```text
├── public/              # 静态资源，如图片、字体等
├── src/
│   ├── components/      # Astro 和 React 组件
│   ├── content/         # Markdown/MDX 内容集合 (例如博客文章)
│   │   └── blog/
│   ├── layouts/         # Astro 页面布局组件
│   ├── pages/           # Astro 页面和动态路由
│   │   └── blog/
│   │       └── archive/ # 归档页面的动态路由
│   │           ├── [year].astro
│   │           └── [year]/
│   │               └── [month].astro
│   ├── styles/          # 全局 CSS 样式文件
│   └── utils/           # 工具函数 (例如 archiveHelpers.ts)
├── astro.config.mjs     # Astro 配置文件
├── README.md            # 本文档
├── package.json         # 项目依赖和脚本定义
└── tsconfig.json        # TypeScript 配置文件
```

Astro 会在 `src/pages/` 目录中查找 `.astro`、`.md` 或 `.mdx` 文件。每个文件都会根据其文件名作为路由暴露。

`src/content/` 目录包含相关的 Markdown 和 MDX 文档的“集合”。使用 `getCollection()` 从 `src/content/blog/` 检索文章，并可以使用可选的模式来类型检查您的 frontmatter。

任何静态资源（如图片）都可以放置在 `public/` 目录中。
