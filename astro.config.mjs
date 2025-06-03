// @ts-check 文件顶部添加此注释，可以在 VSCode 等编辑器中启用 TypeScript 类型检查，增强代码质量

// 从 'astro/config' 导入 defineConfig 函数，用于定义 Astro 项目的配置
import { defineConfig } from 'astro/config';

// 导入 Astro MDX 集成，使项目能够使用 .mdx 文件 (Markdown + JSX)
import mdx from '@astrojs/mdx';
// 导入 Astro 站点地图集成，用于自动生成 sitemap.xml 文件，有助于 SEO
import sitemap from '@astrojs/sitemap';
// 导入 Astro React 集成，使项目能够使用 React 组件
import react from '@astrojs/react';

// Astro 配置对象的官方文档链接
// https://astro.build/config

// 使用 defineConfig 函数导出项目配置对象
export default defineConfig({
	// site: 属性用于设置站点的最终部署 URL。这对于生成站点地图和 RSS源中的绝对链接非常重要。
	// 例如: 'https://www.yourdomain.com'
	// 当前为占位符，请在实际部署时替换为您的真实域名。
	site: 'https://example.com', // 示例域名，部署前请务必修改

	// integrations: 数组用于配置 Astro 项目所使用的各种集成插件。
	// 集成可以扩展 Astro 的功能，例如添加对不同 UI 框架的支持、生成站点地图等。
	integrations: [
		mdx(),       // 初始化 MDX 集成，允许使用 MDX 文件
		sitemap(),   // 初始化站点地图集成，将自动生成 sitemap.xml
		react()      // 初始化 React 集成，允许在 Astro 项目中使用 React 组件 (.jsx, .tsx)
	],
	server: {
  port: 8110,
  host: true
}

	// 此处可以添加更多 Astro 配置选项，例如：
	// server: { port: 3000 }, // 配置开发服务器端口
	// build: { assets: 'assets' }, // 配置构建输出的静态资源目录名称
});

