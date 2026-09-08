import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dist = new URL('../dist/', import.meta.url);
const rss = new JSDOM(await readFile(new URL('rss.xml', dist), 'utf8'), { contentType: 'text/xml' });
const links = [...rss.window.document.querySelectorAll('item > link')].map(node => new URL(node.textContent));
const baseline = [
  'activate-platform-development-of-ai-prompt-summaries', 'article-management-guide',
  'license-commercial-activation-system-complete-development-and-deployment-documentation',
  'project-setup-and-deployment', 'quick-reference',
  'registration-information-management-system-recommended-technology-stack2026081'
];
for (const slug of baseline) assert.ok(links.some(url => url.pathname === `/blog/${slug}/`), `旧文章链接变更: ${slug}`);
for (const url of links) {
  const slug = decodeURIComponent(url.pathname).replace(/^\/blog\//, '').replace(/\/$/, '');
  const html = await readFile(new URL(`blog/${slug}/index.html`, dist), 'utf8');
  const document = new JSDOM(html).window.document;
  const island = [...document.querySelectorAll('astro-island')].find(node => node.getAttribute('props')?.includes('postSlug'));
  assert.equal(JSON.parse(island.getAttribute('props')).postSlug[1], slug, `评论文章 ID 变更: ${slug}`);
  assert.ok(document.querySelector('.prose').textContent.length > 150, `文章正文未渲染: ${slug}`);
  for (const anchor of document.querySelectorAll('a[href^="/blog/"]')) {
    const path = new URL(anchor.getAttribute('href'), url).pathname;
    await access(new URL(`.${decodeURIComponent(path).replace(/\/$/, '')}/index.html`, dist));
  }
}
for (const name of ['callback', 'reset-password']) await access(new URL(`auth/${name}/index.html`, dist));
for (const page of ['auth/debug', 'debug-env', 'test-supabase']) {
  const html = await readFile(new URL(`${page}/index.html`, dist), 'utf8');
  const document = new JSDOM(html).window.document;
  assert.ok(document.body.textContent.includes('404'));
  assert.equal(document.querySelector('#test-results, #env-results, #register-results'), null);
  assert.ok(![...document.scripts].some(node => /\/(debug|debug-env|test-supabase)\.astro/.test(node.src)));
}
await access(new URL('sitemap-index.xml', dist));
console.log(`构建产物通过：${links.length} 篇文章、原有 URL/评论 ID、导航、RSS、认证目标及调试页隔离。`);
