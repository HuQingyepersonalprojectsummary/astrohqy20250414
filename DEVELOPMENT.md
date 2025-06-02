# 开发与部署指南

本文档提供了在本地运行、理解项目结构、进行内容更新以及部署此游戏资讯博客项目的详细说明。

## 目录

- [本地运行](#本地运行)
- [项目结构](#项目结构)
- [如何添加新的博客文章](#如何添加新的博客文章)
- [后端集成说明](#后端集成说明)
- [部署项目](#部署项目)
  - [部署到 Vercel](#部署到-vercel)

## 本地运行

请按照以下说明在本地设置和运行项目，以便进行开发或测试。

### 环境要求

-   **Node.js**: 请确保已安装 Node.js。您可以从 [nodejs.org](https://nodejs.org/) 下载。Astro 通常在 Node.js 的 LTS (长期支持) 版本上运行效果最佳。建议版本：v18.x 或 v20.x 及以上。
-   **npm**: npm (Node Package Manager) 已随 Node.js 一同安装。您也可以使用 pnpm 或 yarn。

### 安装与设置

1.  **克隆代码仓库:**
    如果您尚未拥有项目代码，请先克隆代码仓库。
    ```bash
    git clone <your-repository-url> # 请将 <your-repository-url> 替换为实际的仓库 URL
    cd <repository-name>            # 请将 <repository-name> 替换为项目文件夹名称
    ```

2.  **安装依赖:**
    此命令将下载并安装 `package.json` 文件中定义的所有必需软件包。
    ```bash
    npm install
    # 或者使用 pnpm:
    # pnpm install
    # 或者使用 yarn:
    # yarn install
    ```

### 运行开发服务器

启动本地开发服务器以进行实时预览和热重载：
```bash
npm run dev
```
通常，这会在 `http://localhost:4321` 启动服务器。控制台输出将确认访问地址。当您更改源文件时，浏览器中的页面将自动重新加载。

### 构建生产版本

构建用于生产环境的静态站点：
```bash
npm run build
```
构建过程完成后，优化后的静态文件将默认输出到项目根目录下的 `./dist/` 文件夹中。

### 预览生产版本

在部署之前，您可以在本地预览生产构建的成果：
```bash
npm run preview
```
此命令将在本地启动一个服务器，用于提供 `./dist/` 文件夹中的内容。

### 其他 Astro 命令

您还可以通过 npm (或 pnpm/yarn) 使用其他 Astro CLI 命令：
```bash
npm run astro -- <command>
```
例如，运行 Astro 内置的类型检查和代码诊断：
```bash
npm run astro check
```
获取 Astro CLI 的帮助信息：
```bash
npm run astro -- --help
```

## 项目结构

以下是本项目主要文件夹和文件的结构及其说明：

```text
.
├── public/              # 存放静态资源，如图片、favicon.ico、robots.txt 等。此目录中的文件会直接复制到构建输出的根目录。
├── src/
│   ├── components/      # 存放可重用的 Astro 组件 (.astro) 和 UI 框架组件 (如 React .jsx/.tsx)。
│   │   ├── ArchiveWidget.astro     # 博客归档侧边栏小部件
│   │   ├── BaseHead.astro          # 基础 <head> 内容，用于 SEO 和元标签
│   │   ├── CommentForm.jsx         # (React) 评论提交表单 (模拟)
│   │   ├── CommentList.jsx         # (React) 评论列表显示 (模拟)
│   │   ├── Footer.astro            # 站点页脚
│   │   ├── FormattedDate.astro     # 日期格式化组件
│   │   ├── Header.astro            # 站点页头和导航
│   │   ├── HeaderLink.astro        # 页头导航链接子组件
│   │   ├── HeatmapDisplay.jsx      # (React) 热力图显示组件 (模拟)
│   │   ├── UserLogin.jsx           # (React) 用户登录表单 (模拟)
│   │   └── UserRegistration.jsx    # (React) 用户注册表单 (模拟)
│   ├── content/         # 存放内容集合，例如博客文章和作者数据。
│   │   └── blog/        # 'blog' 集合，存放所有 Markdown (.md) 或 MDX (.mdx) 格式的博客文章。
│   ├── layouts/         # 存放 Astro 布局组件，用于定义页面的通用结构。
│   │   └── BlogPost.astro # 单篇博客文章的布局。
│   ├── pages/           # 存放 Astro 页面。此目录中的文件会根据其路径自动成为站点的路由。
│   │   ├── about.astro             # “关于”页面
│   │   ├── index.astro             # 站点首页
│   │   ├── rss.xml.js              # 生成 RSS feed 的端点
│   │   └── blog/                   # 博客相关页面
│   │       ├── index.astro         # 博客文章列表主页
│   │       └── archive/            # 归档页面的动态路由
│   │           ├── [year].astro        # 按年份归档的页面
│   │           └── [year]/
│   │               └── [month].astro   # 按年份和月份归档的页面
│   ├── styles/          # 存放全局 CSS 样式文件。
│   │   └── global.css   # 全局样式表
│   └── utils/           # 存放工具函数和辅助模块。
│       └── archiveHelpers.ts # 用于生成博客归档数据的辅助函数
├── astro.config.mjs     # Astro 项目的核心配置文件。
├── DEVELOPMENT.md       # 本开发与部署指南。
├── package.json         # Node.js 项目清单文件，包含项目依赖、脚本等。
├── README.md            # 项目的概览介绍文件。
└── tsconfig.json        # TypeScript 配置文件，用于配置 Astro 项目的 TypeScript 支持。
```

### 关键文件说明

-   **`astro.config.mjs`**: Astro 项目的配置文件。您可以在此配置集成、构建选项、服务器设置等。
-   **`src/content/config.ts` (或 `.js`)**: (如果存在，建议创建) 用于定义内容集合的 schema，确保 frontmatter 的类型安全。
-   **`src/consts.ts`**: 存放站点级别的常量，如 `SITE_TITLE` 和 `SITE_DESCRIPTION`。
-   **`public/`**: 静态资源会直接复制到构建输出目录。适合存放不需要构建处理的文件。
-   **`src/pages/`**: 此目录中的 `.astro`, `.md`, `.mdx` 文件会自动成为页面路由。
-   **`src/layouts/`**: 布局组件包裹页面内容，提供共享的 UI 结构。
-   **`src/components/`**: 存放可复用的 UI 片段。

## 如何添加新的博客文章

1.  **创建 Markdown 文件**:
    在 `src/content/blog/` 目录下创建一个新的 `.md` 或 `.mdx` 文件。文件名通常用作 URL 的一部分 (slug)，建议使用小写字母、数字和短横线（例如 `my-new-post.md`）。

2.  **编写 Frontmatter**:
    在文件的顶部，使用 YAML 格式编写 frontmatter。以下是必需和推荐的字段：
    ```yaml
    ---
    title: "我的新文章标题" # 文章主标题，显示在页面和浏览器标签上
    description: "这篇文章是关于..." # 文章的简短描述，用于 SEO 和预览
    pubDate: YYYY-MM-DD # 文章的发布日期，格式为 年-月-日。例如：2023-10-26
    updatedDate: YYYY-MM-DD # (可选) 文章的最后更新日期
    heroImage: "/blog-placeholder-1.jpg" # (可选) 文章主图的路径 (相对于 public 目录，或是一个完整的 URL)
    # tags: ["标签1", "标签2"] # (可选) 文章标签
    # author: "作者名" # (可选) 作者名称
    ---
    ```
    请确保 `pubDate` 格式正确，这对文章排序和归档功能至关重要。

3.  **编写内容**:
    在 frontmatter下方，使用 Markdown 或 MDX 语法编写您的文章内容。

    如果您使用的是 `.mdx` 文件，您还可以在内容中导入和使用 Astro 或 React 组件。

4.  **预览**:
    运行 `npm run dev` 后，新的文章应该会自动出现在博客列表和归档中。访问对应的 URL (例如 `/blog/my-new-post/`) 查看文章页面。

## 后端集成说明

当前项目中涉及用户交互的功能（如用户注册、登录、评论提交）均为 **前端模拟实现**。这意味着：

-   **用户数据不会被存储**: 注册和登录表单仅在前端进行基本演示，没有实际的用户账户创建或验证流程。
-   **评论不会被持久化**: 用户提交的评论仅存在于当前浏览器会话的内存中，刷新页面后会消失。
-   **IP 地址是模拟的**: 评论区显示的 IP 地址是硬编码的模拟数据。
-   **热力图是模拟的**: 热力图显示的是预设的模拟数据点。

要使这些功能真正可用，您需要集成一个后端服务。这可能包括：

1.  **选择后端技术栈**:
    -   **BaaS (Backend as a Service)**: 如 Firebase, Supabase。这些平台通常提供用户认证、数据库、无服务器函数等功能，可以快速集成。
    -   **自定义后端**: 使用 Node.js (如 Express.js, NestJS), Python (Django, Flask), Ruby on Rails, Go 等语言和框架自行搭建。

2.  **设计 API**:
    根据[之前规划的 API 端点](#) (此部分应在实际文档中链接到相关API设计，或在此处详细列出)，实现用户注册、登录、获取用户信息、提交评论、获取评论列表等接口。

3.  **数据库**:
    选择并配置数据库 (如 PostgreSQL, MongoDB, Firebase Firestore, Supabase DB) 来存储用户信息和评论数据。

4.  **更新前端组件**:
    修改项目中的 React 组件 (`UserRegistration.jsx`, `UserLogin.jsx`, `CommentForm.jsx`, `CommentList.jsx`)，使其通过 `fetch` 或其他 HTTP客户端库与您实现的后端 API 进行交互，替换当前的模拟逻辑。

5.  **IP 地址获取**:
    真实的 IP 地址应在后端 API 接收到请求时获取，并随评论数据一同存储。

## 部署项目

Astro 项目构建为静态站点（默认情况下），可以部署到任何支持静态文件托管的平台。

### 通用部署步骤

1.  **构建项目**:
    ```bash
    npm run build
    ```
    此命令会在项目根目录生成一个 `dist/` 文件夹，其中包含所有优化后的静态文件。

2.  **选择托管平台**:
    常见的静态站点托管平台包括：
    -   Vercel
    -   Netlify
    -   GitHub Pages
    -   Cloudflare Pages
    -   AWS S3 + CloudFront
    -   Firebase Hosting
    -   等等

3.  **部署 `dist/` 目录**:
    将 `dist/` 目录的内容上传或配置到您选择的托管平台。具体步骤因平台而异。

### 部署到 Vercel

Vercel 对 Astro 项目提供优秀的内置支持，部署过程非常简单：

1.  **将项目推送到 Git 仓库**:
    确保您的 Astro 项目代码已推送到 GitHub, GitLab, 或 Bitbucket 等 Git 服务提供商的仓库中。

2.  **注册或登录 Vercel**:
    访问 [vercel.com](https://vercel.com/) 并创建账户或登录。

3.  **导入项目**:
    -   在您的 Vercel Dashboard 中，点击 "Add New..." -> "Project"。
    -   选择 "Continue with Git"，然后选择您的 Git 服务提供商。
    -   如果 Vercel 尚未获得授权，请授权其访问您的代码仓库。
    -   从列表中选择您的 Astro 项目仓库，然后点击 "Import"。

4.  **配置项目 (Vercel 通常会自动检测 Astro 配置)**:
    -   **Framework Preset (框架预设)**: Vercel 应能自动检测到这是 Astro 项目。如果未能检测，您可以从列表中手动选择 "Astro"。
    -   **Build and Output Settings (构建与输出设置)**:
        -   **Build Command (构建命令)**: Vercel 通常会默认为 `astro build` 或 `npm run build` (如果 `package.json` 中有此脚本)。这应该是正确的。
        -   **Output Directory (输出目录)**: Astro 的默认输出目录是 `dist`。Vercel 也应能自动检测到。
        -   **Install Command (安装命令)**: 通常是 `npm install`。
    -   **Environment Variables (环境变量)**: 如果您的项目需要环境变量（本项目当前构建过程不需要特定的环境变量），您可以在此步骤添加。

5.  **部署**:
    点击 "Deploy" 按钮。

Vercel 将克隆您的仓库，安装依赖，构建您的 Astro 站点，并将其部署。片刻之后，您将获得一个可访问的线上站点 URL。

**自动部署**:
默认情况下，Vercel 会设置 CI/CD。这意味着每次您推送到主分支（或其他配置的分支）时，Vercel 都会自动重新构建和部署您的站点。

**Node.js 版本**:
如果您的项目对 Node.js 版本有特定要求，您可以在 Vercel 的项目设置中指定 Node.js 版本 (Project Settings -> General -> Node.js Version)。

---
希望本文档能帮助您更好地理解和开发此项目！
