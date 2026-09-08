# 审计问题修复与验证

日期：2026-09-08。对应第三次复核 T01–T08。代码与迁移脚本已在本地修复，未执行线上数据库迁移或部署。

| 问题 | 本次修改 |
| --- | --- |
| T01 旧资料未复制 | 读取旧 `astrohqy20250414` 资料，缺失 profile 优先采用旧表内容；已有 profile 保留非空值并补全空字段。保留旧表，使用版本记录避免重复覆盖用户后续编辑 |
| T02 楼层修复被触发器抵消 | 整体事务内锁定写入，在清理前移除已知旧触发器，包括改名但仍调用旧函数的触发器。只调整空值、非正值与重复楼层，保留合法楼层及永久计数器 |
| T03 用户名碰撞 | 新用户和迁移回填共用私有函数，捕获用户名唯一键冲突，追加完整用户 ID 和递增序号重试 |
| T04/T05 迟到响应覆盖 | 按文章、账号和刷新键重建列表；取消旧请求，并以请求代次、组件存活状态及当前身份校验响应。点赞查询完成后再显示新页，失败时支持重试 |
| T06 点赞关系公开 | 撤销匿名点赞表权限；登录用户只能查询自己的点赞。公开点赞总数仍可从评论字段读取 |
| T07 依赖告警 | 升级 Astro 7.3.1、MDX 8、React 集成 6、sitemap 3.7.4、RSS 4.0.19、sharp 0.35.4；内容集合迁移到 glob loader / render API，保留原文章 URL 和评论 ID |
| T08 历史 SQL 入口 | 原内容归档到 `database/legacy/*.sql.disabled`；原根目录入口主动报错。两个有效入口均从同一版本迁移生成，并自动检查一致性 |

## 实际验证

`npm run verify` 已完整通过：

- `db:check`：两个根目录 SQL 入口与权威迁移一致。
- 9 项回归测试通过：4 项数据库场景、5 项真实 React 组件的 JSDOM 时序场景。
- `astro check`：42 个文件，0 errors / 0 warnings / 0 hints。
- 静态构建：20 个页面。
- 构建产物：6 篇文章的原 URL、评论 ID、正文、文章导航、RSS、认证目标和调试页隔离检查通过。
- `npm audit`：0 vulnerabilities。

数据库测试使用内存 PGlite，移除引擎不需要的扩展安装语句，实际执行版本迁移。普通 `anon`/`authenticated` 角色验证字段权限、私有点赞、双用户写入、编辑冲突及失败回滚。另覆盖旧资料、改名的保护触发器、重复/空楼层、用户名连续碰撞、迁移重跑和旧入口拒绝执行。它不能代替真实多连接 PostgreSQL 并发测试、PostgREST 关系缓存和真实邮件端到端验收。

前端测试让模拟请求故意忽略取消并延迟返回，确认旧结果仍无法覆盖当前组件；还验证登录发生在匿名评论请求完成之前、刷新、每页最多 20 个点赞 ID 和失败重试。

## 上线步骤

1. Node.js 至少 22.12.0；本次使用 Node.js 24，CI 固定为 24。
2. 对照 [数据库部署说明](database/README.md) 备份并在测试 Supabase 演练；以数据库所有者执行 `supabase-migration-upgrade.sql`。新库可执行同内容的 `supabase-setup-complete.sql`。
3. 如果之前已生成非空默认 profile，先核对它与旧资料的冲突；脚本优先保留现有非空新资料，避免覆盖用户在新表的真实编辑。
4. 数据库验证通过后，部署前端并检查双账号操作、PostgREST 嵌套作者资料与密码恢复邮件。

新增 `.github/workflows/verify.yml` 在提交/PR 上执行相同质量检查。迁移源码位于 `database/migrations/2026090801_comments.sql`；修改后运行 `npm run db:sync` 更新 Supabase SQL 编辑器用的两个副本。

Astro 内容接口与集成迁移依据 [Astro 6 升级文档](https://docs.astro.build/en/guides/upgrade-to/v6/) 和 [Astro 7 升级文档](https://docs.astro.build/en/guides/upgrade-to/v7/)，最终兼容性以本项目检查与产物验证为准。
