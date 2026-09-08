import { readFile, writeFile } from 'node:fs/promises';

// 根目录保留可直接粘贴到 Supabase SQL 编辑器的两个入口，内容来自同一版本源。
const canonical = await readFile(new URL('../database/migrations/2026090801_comments.sql', import.meta.url), 'utf8');
for (const name of ['supabase-setup-complete.sql', 'supabase-migration-upgrade.sql']) {
  const file = new URL(`../${name}`, import.meta.url);
  if (process.argv.includes('--write')) await writeFile(file, canonical);
  else if ((await readFile(file, 'utf8')).replace(/\r\n/g, '\n') !== canonical.replace(/\r\n/g, '\n')) {
    throw new Error(`${name} 与权威迁移不同，请运行 npm run db:sync`);
  }
}
