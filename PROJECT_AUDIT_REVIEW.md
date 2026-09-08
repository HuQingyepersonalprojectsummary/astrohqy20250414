# 审计修复复核

日期：2026-09-08。对照 `PROJECT_AUDIT_REPORT.md`，审阅当前暂存、未暂存改动及新增完整 SQL 脚本。

结论：部分修复正确，但尚不能认定审计问题全部解决。尤其不能把新增完整 SQL 当作现有数据库的安全升级脚本。

## 验证结果

- `npm run build`：通过，生成 20 个页面。
- `npm run check`：通过，38 个文件，0 errors / 0 warnings / 0 hints。
- RSS：解析构建后的 XML，6 个文章链接全部存在对应的 `index.html`。
- 回调重写：`dist/auth/callback/index.html` 存在；尚未验证 Vercel 预览部署中的实际重写行为。
- 锁文件与安装版本一致：Astro 5.18.2、Vite 6.4.3、fast-xml-parser 5.11.1、Supabase JS 2.116.0。
- `npm audit --json`：4 个受影响包条目，2 high、2 low；原报告是 52 个。不能把告警减少等同于全部安全验收通过。
- 当前构建提示 Supabase 未配置，仍成功输出包含 `https://placeholder.supabase.co` 的客户端。
- 从当前组件提取原函数，隔离模拟正文更新失败：历史已写入 1 条，正文更新失败，没有成功回调。
- 从当前列表提取批量点赞查询，模拟切到 B 账号后请求返回错误：仍保留 A 账号的点赞集合。

本次没有修改业务代码，没有连接生产数据库、发送邮件、执行迁移或部署。数据库结论来自仓库 SQL 与 PostgreSQL 语义核对，未声称真实数据库复现；认证仍需真实测试项目端到端验收。

## 待修问题

### R01 — P1：完整脚本不能安全升级现有数据库（A02）

位置：`supabase-setup-complete.sql:63`、`:84`、`:112`；`supabase-setup-profiles.sql:21`。

`CREATE TABLE IF NOT EXISTS comments` 不会给已有表补列。仅执行过旧基础脚本的数据库仍缺少 `floor_number`、`likes_count` 等字段，后续创建楼层索引会失败。`supabase-setup-profiles.sql` 同样试图在 `IF NOT EXISTS` 表声明中添加外键，已有表不会补建。脚本也没有回填已有 `auth.users` 的 profiles；旧库评论作者缺少 profile 时，直接添加外键会失败，即使没有旧评论，历史账号随后发表评论也会违反外键。

应提供明确、有序的升级步骤：补列、回填资料、处理历史楼层，再添加约束和触发器。空库初始化与存量库升级需要分别验收。[PostgreSQL CREATE TABLE 文档](https://www.postgresql.org/docs/current/sql-createtable.html) 明确说明 IF NOT EXISTS 不保证已有表结构与声明一致。

### R02 — P2：新旧点赞触发器叠加，会重复计数（A06 的新增回归）

位置：`supabase-setup-complete.sql:170`；旧脚本 `supabase-upgrade-comments.sql:124`。

旧升级脚本创建 `comment_likes_count_trigger`，新完整脚本只删除并重建 `trigger_update_comment_likes_count`。在已安装旧升级脚本的库上执行完整脚本，会留下两个 AFTER INSERT/DELETE 触发器，二者都调用计数函数。一次点赞使计数增加 2，取消也会重复减少。

迁移应清理旧名，确保只保留一个计数触发器，并按实际点赞记录校准已有计数。[PostgreSQL CREATE TRIGGER 文档](https://www.postgresql.org/docs/current/sql-createtrigger.html) 说明，同类事件上的多个触发器都会执行。

### R03 — P2：受保护字段依旧允许作者直接写入（A07）

位置：`supabase-setup-complete.sql:202`、`:209`、`:127`。

策略仍只检查 `auth.uid() = user_id`，没有撤销宽泛写权限或按列授权。按原有浏览器写入授权，作者仍能直接更新自己的 `likes_count`、`floor_number`、`post_slug`、时间及 IP 等字段。新楼层触发器甚至允许 INSERT 提供任意正楼层号而跳过分配。RLS 限制行的归属，不能代替字段权限。

应限制 INSERT/UPDATE 的可写列，或只允许经过身份及参数检查的 RPC；计数、楼层、时间与历史正文由数据库维护。实际线上是否另有列权限，需导出核对。

### R04 — P2：移除 IP 展示没有消除公开读取（A13）

位置：`src/components/CommentList.jsx:48`；`supabase-setup-complete.sql:198`、`:240`。

列表仍 `select('*')`，并把完整返回数据打印到控制台；comments 的公开读取策略没有变化，因此已有 IP/原始正文仍会进入浏览器。编辑历史也继续 `USING (true)`，任何拥有常规匿名查询权限的访问者仍能直接读取 `old_content`。删除页面显示只改变呈现。

应在数据库授权、表拆分或受限视图中隔离这些字段及历史，并让公开查询只请求允许公开的字段。仅更换前端 select 列表不能阻止绕过页面的直接 API 查询。

### R05 — P2：编辑与历史仍不具备事务一致性（A09）

位置：`src/components/CommentItem.jsx:134`、`:149`。

新增 historyError 检查修好了“历史失败仍更新正文”的分支，但反向失败仍存在：历史插入成功，随后正文更新失败，会留下没有对应成功修改的历史。隔离执行当前函数并模拟正文约束失败，确认留下 1 条历史。旧内容仍来自浏览器，也没有版本条件防止并发覆盖。

应使用数据库事务 RPC 或更新触发器记录 `OLD.content`，并用版本/更新时间条件检测冲突。两次独立 HTTP 请求无法保证原子提交。

### R06 — P2：楼层仍会重用，旧数据回填也未修复（A08）

位置：`supabase-setup-complete.sql:131`；`supabase-upgrade-comments.sql:166`。

加锁只串行化编号过程，`MAX(floor_number)+1` 仍会在删除最高楼层后复用该编号。例如已有 1、2、3，删除 3，再插入得到 3。完整脚本没有 `(post_slug, floor_number)` 唯一约束；旧升级脚本回填 NULL 行仍从 1 开始，遇到已有编号会重复。

若要求永久不重用，应使用独立持久计数器，迁移时从现有最大值继续回填并清理重复，再加唯一约束。不能在注释中宣称已经解决重用问题。

### R07 — P2：配置缺失仍可构建出不可用功能（A12）

位置：`src/lib/supabaseClient.ts:28`。

新增 `isSupabaseConfigured` 只用于警告与选择占位客户端，登录、评论和重置页面并未据此统一禁用功能。当前实际构建仍成功生成占位客户端，说明 A12 没有关闭。

需要在生产构建阶段校验必要配置并失败退出，或明确实现访客模式，在所有相关入口提示并阻止请求占位地址。

### R08 — P2：切号和请求失败时仍残留点赞状态（A10）

位置：`src/components/CommentList.jsx:97`、`:116`；`src/components/CommentItem.jsx:25`。

切换到新的非空 user 时，没有先清除旧集合；只有查询成功才覆盖。若新账号请求失败，旧账号状态会长期保留；请求尚未完成时也存在错误操作窗口。取消旧请求只能防止旧响应覆盖，不能清除已经保存的旧数据。隔离模拟 B 的查询失败后，确认仍包含 A 的点赞。

另外，子组件点赞成功只更新自己的状态，父集合不变；user 对象因会话刷新变化时，同步 effect 会再从旧集合覆盖子状态。

应把点赞数据与查询对应的 user.id 绑定，切换身份立即失效并处理加载/失败状态，点赞操作后同步父级权威状态或重新获取。

### R09 — P2：评论无分页问题仍在（A14）

位置：`src/components/CommentList.jsx:48`、`:113`。

N+1 查询已改成批量，但评论查询没有 range/limit 或游标，界面没有加载下一页。达到服务端返回上限后仍无法读取其余评论，且把整批 UUID 放入 `.in()` 会随规模增长形成很长的请求 URL。

应先分页获取评论，再仅查询当前页的点赞；使用稳定排序，并提供下一页入口。

### R10 — P2：调试页按钮指向已经删除的函数（新增回归）

位置：`src/pages/auth/debug.astro:101`、`:174`。

“测试发送重置邮件”按钮依旧调用 `testPasswordReset()`，但该函数已被删除；现在导出的是 `testUpdatePassword()`。点击将发生 ReferenceError。新函数实际把当前账号密码设为固定 `testpassword123`，与按钮文案及原邮件测试语义完全不同。

应恢复发送重置邮件函数及匹配的事件绑定；不能仅把按钮改绑到硬编码改密函数。生产是否输出调试页也应明确。

### R11 — P2：认证凭据日志与调试页面暴露（A11）

位置：`src/pages/test-supabase.astro:156`；`src/pages/debug-env.astro:92`；`src/pages/auth/debug.astro:157`。

正常注册、登录、store 和回调里的完整会话日志已清理，但测试与调试页面仍存在凭据外泄路径：
1. `src/pages/test-supabase.astro:156` 仍打印注册返回的 `{ data, error }`，在直接返回 session 的配置下仍输出 token；
2. `src/pages/debug-env.astro:92` 点击测试连接时，将 `supabase.auth.getSession()` 得到的完整 session 对象（含访问令牌与刷新令牌明文）通过 `<pre>` 标签直接渲染在页面 DOM 中；
3. `/debug-env`、`/auth/debug`、`/test-supabase` 这 3 个调试页面当前均被无条件编译到生产静态产物（`dist/`）中。

应避免在页面 DOM 和控制台输出完整凭据对象，且生产构建应排除或受权限保护此类调试入口。

## 原审计逐项状态

| 编号 | 复核状态 |
| --- | --- |
| A01 | 固定占位配置与 CDN 已移除，统一客户端可被构建处理；真实恢复邮件、过期链接及刷新后的行为尚未端到端验收 |
| A02 | 空库表结构/直接外键方向正确；存量资料回填及升级缺失，见 R01 |
| A03 | 默认仅本机监听，Vite 已升级；依赖审计仍有 4 个受影响包条目，需单独评估剩余可达性 |
| A04 | 通过：6 个 RSS 链接均对应实际产物 |
| A05 | 文件目标已修正（`/auth/callback`）；但 `vercel.json` 缺少 `/auth/reset-password` 同等重写，Vercel 托管路由与 hash 保留待预览部署验收 |
| A06 | SECURITY DEFINER 方向正确；完整脚本与旧库叠加产生 R02 |
| A07 | 未完成，见 R03 |
| A08 | 部分完成：增加事务锁；重用、历史回填与约束未完成，见 R06 |
| A09 | 部分完成：检查历史错误；事务、可信历史和并发冲突未完成，见 R05 |
| A10 | 部分完成：登出重置、属性计数同步、旧查询取消；仍有 R08 |
| A11 | 常规认证链路已清理；测试与调试页面存在 R11 |
| A12 | 未完成，已通过实际构建确认，见 R07 |
| A13 | 仅移除页面 IP 显示，数据权限未修，见 R04 |
| A14 | 批量查询已实现；分页未实现，见 R09 |

优先处理 R01/R02 的数据库迁移与重复触发器，再处理字段权限、隐私边界、编辑事务及配置校验。构建与类型检查通过不覆盖这些数据库和运行时行为。
