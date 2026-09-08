# 审计修复第三次复核

> 下文为本次修复前的审计快照。T01–T08 的最新代码修改、验证结果及上线边界见 [PROJECT_AUDIT_FIXES.md](PROJECT_AUDIT_FIXES.md)。旧资料仍保留在原表；原报告中的“丢失”指新应用未采用旧资料，并非原数据被删除。

日期：2026-09-08。复核范围为当前工作区全部暂存、未暂存和新增文件，对照 `PROJECT_AUDIT_REPORT.md`、`PROJECT_AUDIT_REVIEW.md` 与 `PROJECT_AUDIT_REVIEW_SECOND.md`。

## 结论

本轮修复已经关闭了大部分上一轮问题：评论字段伪造、匿名读取 IP/编辑历史、重复点赞触发器、编辑失败回滚、并发编辑覆盖、删除后楼层重用、固定偏移分页、缺失 Supabase 配置向占位域名发请求，以及生产调试页暴露功能，均已得到有效改进。

仍不能认定项目已完成审计。当前有 2 项迁移阻断问题、2 项前端异步一致性问题、1 项点赞隐私问题，以及未修复的依赖高危告警。

## 验证记录

| 检查 | 结果 |
| --- | --- |
| `npm run check` | 通过：38 个文件，0 errors / 0 warnings / 0 hints |
| `npm run build` | 通过：静态构建 20 个页面 |
| 缺少 Supabase 配置 | 进入访客模式，认证/评论控件禁用，不向占位 URL 发请求 |
| RSS | 6/6 链接对应 `dist/blog/*/index.html` |
| Vercel 重写目标 | callback、reset-password 的静态 `index.html` 均存在 |
| 隔离 PostgreSQL | INSERT 字段保护、匿名隐私读取拒绝、点赞 0→1→0、编辑回滚、乐观并发条件、游标分页、楼层删除后递增均通过 |
| `npm audit --json` | 仍有 4 个受影响条目：2 high、2 low；其中 Astro 与 sharp 相关告警仍在 |
| `git diff --check` | 发现行尾空格和文件末尾空行，不影响运行，但应清理 |

## 仍存在的问题

### T01 — P1：存量资料没有从旧资料表迁移，且会丢失用户自定义资料

位置：`supabase-migration-upgrade.sql:99–124`。

仓库旧基础脚本使用 `public.astrohqy20250414` 作为资料表，新迁移只读取 `auth.users` 并新建 `public.profiles`，没有复制旧资料表。隔离测试中，旧资料表的 `username='chosen_name'`、头像和简介在迁移后没有进入 `profiles`，新表被重新生成了邮箱前缀用户名。评论外键随后指向新表，旧资料因而丢失。

这不是单纯显示差异：已有用户的评论会被关联到新建的默认 profile，部署迁移会改变公开身份资料。迁移应明确把旧资料表映射、复制到 `profiles`，并在冲突时保留有效值；如果旧表确实不再支持，应在执行前给出数据迁移步骤和校验。

### T02 — P1：楼层清理受既有保护触发器阻断，迁移可能在加唯一约束前失败

位置：`supabase-migration-upgrade.sql:196–224`，保护触发器创建/清理在 `:243` 与 `:374`。

迁移先通过 `UPDATE comments` 重排重复楼层，之后才删除 `trigger_protect_comment_immutable_fields`。如果数据库中已有该保护触发器（或同等逻辑的旧触发器），它会把 `floor_number` 恢复为旧值，清理实际没有生效；随后创建 `unique_post_floor` 直接报 `23505`。隔离 PostgreSQL 已用重复楼层和既有保护触发器复现该失败。

应在所有数据清理前，以明确的迁移顺序停用/替换会阻止校准的触发器，并在清理后检查重复数为零，再建立唯一约束；不要只依赖一个固定触发器名称。

### T03 — P2：用户名最终回退仍可能撞唯一键

位置：`supabase-migration-upgrade.sql:62–70、111–118`；`supabase-setup-complete.sql:65–71、114–118`。

两次碰撞后直接使用 `user_` 加 UUID 前 12 位，但该候选值本身仍可能已被合法用户占用。隔离测试预先占用该值后，回填返回 `23505 profiles_username_key`，迁移中止。应使用循环递增后缀或直接使用完整 UUID，并在插入后验证唯一性；新用户触发器和存量回填应共用同一算法。

### T04 — P2：切换账号时，旧账号的评论点赞查询仍可覆盖新状态

位置：`src/components/CommentList.jsx:37–120、172–215`。

`fetchComments` 的请求在 `useEffect([postSlug, refreshKey])` 中启动，但没有按用户代次取消或校验。请求启动时闭包中的 A 账号仍会用于 `comment_likes` 查询；如果用户切换为 B 后 A 请求才返回，它会把 A 的点赞集合写回当前页面。提取当前函数并延迟响应已复现：B 状态最终包含 A 点过的 `c1`。

应为评论请求和点赞请求绑定用户 ID/请求代次，在响应提交状态前校验仍是同一代；切号时还应取消或忽略所有旧评论请求。

### T05 — P2：快速切换文章时，旧评论请求也能覆盖新文章

位置：`src/components/CommentList.jsx:172–175` 与 `fetchComments`。

文章 slug 或刷新键改变时会并发启动新请求，但 `fetchComments` 没有取消标记或序列号校验。旧文章请求晚返回时仍会执行 `setFetchedComments`，可能短暂或持续显示在新文章下。点赞 effect 的取消标记只覆盖切换账号后的点赞查询，不能保护评论列表请求。

应让每次 `postSlug/refreshKey/user` 请求携带递增代次，只有最新代次允许更新评论、分页游标和点赞集合。

### T06 — P2：公开读取点赞表会暴露用户与评论的关联

位置：`supabase-setup-complete.sql:366、415–417`；迁移脚本对应 `:420、456–458`。

`comment_likes` 仍向 `anon` 授予全列 SELECT，策略也是 `USING (true)`。任何访客都能直接读取 `user_id`、`comment_id` 和时间，重建某个账号点赞过哪些评论。页面批量查询只需要当前用户自己的记录，不需要公开全部点赞关系。

应撤销匿名全表读取，改为仅允许已认证用户读取自己的点赞，或提供只返回当前用户关系的受限 RPC/视图；INSERT/DELETE 的现有 RLS 仍需保留。

### T07 — P2：依赖安全告警仍未关闭

`npm audit --json` 当前报告 4 个条目：Astro 相关 1 high、sharp 相关 1 high、esbuild 与 Astro 间接依赖 2 low（总计 2 high、2 low）。本项目为静态输出，部分 Astro SSR/开发服务器公告的可达条件可能不成立，但不能把“静态产物”当作依赖升级或完整安全验收。应在兼容性评估后升级 Astro/sharp，或记录明确的受影响范围和接受期限。

### T08 — P2：仓库仍保留多套互相冲突的数据库脚本

位置：`supabase-setup.sql`、`supabase-upgrade-comments.sql`、`supabase-setup-profiles.sql`。

部署文档已经把 `supabase-setup-complete.sql` 和 `supabase-migration-upgrade.sql` 指定为新库/旧库入口，这是流程上的改进；但旧脚本仍可被直接执行，继续创建 `astrohqy20250414` 资料表、公开编辑历史策略和旧触发器。它们与 `profiles`、列级授权和持久楼层计数器不一致，执行顺序不同会覆盖同名函数或重新放宽权限。

应将旧脚本移入明确的归档目录并标注不可执行，或删除并只保留带版本号的迁移目录；部署检查应拒绝把旧脚本当作当前生产初始化入口。

## 已确认修复

- 点赞计数只保留一个业务触发器，且 `SECURITY DEFINER` 可由他人点赞更新。
- 评论 INSERT/UPDATE 的系统字段由列权限和触发器保护；匿名无法读取 IP，客户端无法直接写编辑历史。
- 编辑历史由数据库 `OLD.content` 在同一更新事务中归档；正文约束失败时正文和历史一起回滚。
- `updated_at` 条件和空返回检查已阻止旧视图静默覆盖新编辑。
- 持久楼层计数器和游标分页已解决删除后重用楼层、固定 offset 漏读问题。
- 缺失配置进入显式访客模式；生产构建中的三个调试页面只渲染 404，未引用调试脚本。
- RSS 目标、认证回调与密码重置重写目标、类型检查和生产构建均通过。

## 建议顺序

先修 T01–T03 并在真实旧库快照上演练迁移；随后修 T04–T06 的请求代次和点赞读取策略；最后完成依赖升级评估与至少一次真实 Supabase 双账号、邮件恢复、评论增删改赞验收。
