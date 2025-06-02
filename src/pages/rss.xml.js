// 导入 @astrojs/rss 包，用于生成 RSS feed
import rss from '@astrojs/rss';
// 从 astro:content 导入 getCollection 函数，用于获取内容集合 (例如博客文章)
import { getCollection } from 'astro:content';
// 从 ../consts 文件导入站点标题和描述常量
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

// 导出一个异步函数 GET，这是 Astro 处理 API 端点和文件路由的标准方法
// 当访问 /rss.xml 时，此函数将被调用
export async function GET(context) {
	// 异步获取 'blog' 集合中的所有文章
	// 注意：确保在 src/content/config.ts (或 .js) 中正确定义了 'blog' 集合
	const posts = await getCollection('blog');

	// 调用 rss 函数生成 RSS feed
	return rss({
		// title: RSS feed 的标题，通常使用站点标题
		title: SITE_TITLE,
		// description: RSS feed 的描述，通常使用站点描述
		description: SITE_DESCRIPTION,
		// site: 站点的完整 URL。`context.site` 会从 astro.config.mjs 中的 `site` 配置获取。
		// 如果 astro.config.mjs 中的 `site` 未配置，RSS feed 中的链接可能是相对路径，这可能导致问题。
		site: context.site,
		// items: RSS feed 中的项目列表，通常对应于博客文章
		// 使用 posts.map 遍历获取到的文章，并将每篇文章转换为 RSS item 对象
		items: posts.map((post) => ({
			// ...post.data: 展开文章 frontmatter 中的所有数据 (例如 title, pubDate, description 等)
			// 确保这些字段在你的博客文章 frontmatter 中存在且格式正确
			...post.data,
			// link: 文章的永久链接。这里假设博客文章的 URL 结构是 /blog/[post.id]/
			// post.id 通常是基于文件名的，例如 'my-first-post.md' -> 'my-first-post'
			// 如果你的 URL 结构不同 (例如使用 post.slug)，请相应调整此处的链接格式
			link: `/blog/${post.id}/`,
            // pubDate: 文章的发布日期，rss 包会自动从 post.data.pubDate 获取
            // 如果 pubDate 格式不正确或缺失，可能会导致 RSS feed 生成错误或验证失败

            // content: 可选，文章的完整内容。如果提供，通常是 HTML 格式。
            // 例如: content: sanitizeHtml(parser.render(post.body)), // 需要安装和配置 Markdown 解析器和 HTML 清理库
		})),
		// customData: 可选，用于在 <channel> 标签内添加自定义 XML 数据
		// 例如: `<language>zh-cn</language>`
		customData: `<language>zh-CN</language>`, // 为 RSS feed 添加语言声明
	});
}
