-- 数据库迁移 2026090801：适用于空库与仓库各旧版数据库。
-- 权威源文件：database/migrations/2026090801_comments.sql
-- 根目录两个入口由 npm run db:sync 生成，不要单独编辑。

BEGIN;
-- 一次迁移要么全部生效，要么整体回滚；阻止注册与修复并行修改资料。
SELECT pg_advisory_xact_lock(20260908, 1);
LOCK TABLE auth.users IN SHARE ROW EXCLUSIVE MODE;

-- 1. 确保基础扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. 幂等补全 public.profiles 表与字段
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='username') THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name') THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='website') THEN
    ALTER TABLE public.profiles ADD COLUMN website TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;
END $$;

-- 3. 注册与回填共用冲突重试；只允许数据库触发器/迁移调用。
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS app_private.migrations (
  version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION app_private.ensure_profile(p_id UUID, p_data JSONB)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE
  base_name TEXT := COALESCE(NULLIF(trim(p_data->>'username'), ''), 'user');
  candidate TEXT := base_name;
  suffix INTEGER := 0;
  conflict_name TEXT;
BEGIN
  LOOP
    BEGIN
      INSERT INTO public.profiles
        (id, username, full_name, avatar_url, website, bio, created_at, updated_at)
      VALUES (p_id, candidate, p_data->>'full_name', p_data->>'avatar_url',
        p_data->>'website', p_data->>'bio',
        COALESCE((p_data->>'created_at')::timestamptz, now()),
        COALESCE((p_data->>'updated_at')::timestamptz, now()))
      ON CONFLICT (id) DO NOTHING;
      RETURN;
    EXCEPTION WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS conflict_name = CONSTRAINT_NAME;
      IF conflict_name <> 'profiles_username_key' THEN RAISE; END IF;
      suffix := suffix + 1;
      candidate := base_name || '_' || p_id::text || '_' || suffix::text;
    END;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION app_private.ensure_profile(UUID, JSONB) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM app_private.ensure_profile(NEW.id,
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('username',
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'username'), ''),
        NULLIF(split_part(NEW.email, '@', 1), ''), 'user')));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 保留旧资料。旧表不删除；已存在的新 profile 以非空值为准，空字段从旧表补全。
-- 标记版本防止重跑时用旧资料覆盖用户迁移后的编辑。
CREATE TEMP TABLE legacy_profiles (id UUID PRIMARY KEY, data JSONB) ON COMMIT DROP;
DO $$
BEGIN
  IF to_regclass('public.astrohqy20250414') IS NOT NULL THEN
    EXECUTE 'INSERT INTO legacy_profiles SELECT id, to_jsonb(p) FROM public.astrohqy20250414 p';
  END IF;
END $$;
DO $$
DECLARE u RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM app_private.migrations WHERE version = '2026090801') THEN
    UPDATE public.profiles p SET
      full_name = COALESCE(NULLIF(p.full_name, ''), l.data->>'full_name'),
      avatar_url = COALESCE(NULLIF(p.avatar_url, ''), l.data->>'avatar_url'),
      website = COALESCE(NULLIF(p.website, ''), l.data->>'website'),
      bio = COALESCE(NULLIF(p.bio, ''), l.data->>'bio')
    FROM legacy_profiles l WHERE p.id = l.id;
  END IF;

  FOR u IN
    SELECT a.id, a.email, a.raw_user_meta_data, l.data AS legacy
    FROM auth.users a LEFT JOIN legacy_profiles l ON l.id = a.id
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = a.id)
    ORDER BY (l.id IS NULL), a.created_at, a.id
  LOOP
    PERFORM app_private.ensure_profile(u.id,
      COALESCE(u.raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object('username', COALESCE(
        NULLIF(trim(u.raw_user_meta_data->>'username'), ''),
        NULLIF(split_part(u.email, '@', 1), ''), 'user')) ||
      jsonb_strip_nulls(COALESCE(u.legacy, '{}'::jsonb)));
  END LOOP;
END $$;

-- 4. 确保持久化楼层计数器表存在 (S04 修复)
CREATE TABLE IF NOT EXISTS public.post_comment_counters (
  post_slug TEXT PRIMARY KEY,
  last_floor_number INTEGER DEFAULT 0 NOT NULL
);
ALTER TABLE public.post_comment_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.post_comment_counters FROM anon, authenticated;

-- 5. 幂等为 public.comments 表补全字段
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='likes_count') THEN
    ALTER TABLE public.comments ADD COLUMN likes_count INTEGER DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='is_edited') THEN
    ALTER TABLE public.comments ADD COLUMN is_edited BOOLEAN DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='original_content') THEN
    ALTER TABLE public.comments ADD COLUMN original_content TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='floor_number') THEN
    ALTER TABLE public.comments ADD COLUMN floor_number INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='updated_at') THEN
    ALTER TABLE public.comments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
  END IF;
END $$;

-- 确保 comments 表存在到 profiles 表的外键关联
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_comments_profiles' AND table_name = 'comments'
  ) THEN
    ALTER TABLE public.comments
      ADD CONSTRAINT fk_comments_profiles
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. 确保点赞表 (comment_likes) 与编辑历史表 (comment_edit_history) 存在
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_comment_user_like UNIQUE(comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comment_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  old_content TEXT NOT NULL,
  edited_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  edited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 7. 数据修复前移除所有已知旧触发器（包括改名但仍调用旧函数的触发器）。
-- 锁住写入，避免删触发器后出现没有维护计数/历史的写入窗口。
LOCK TABLE public.profiles, public.comments, public.comment_likes,
  public.comment_edit_history, public.post_comment_counters IN SHARE ROW EXCLUSIVE MODE;
DO $$
DECLARE t RECORD;
BEGIN
  FOR t IN
    SELECT n.nspname, c.relname, g.tgname
    FROM pg_trigger g JOIN pg_class c ON c.oid = g.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = g.tgfoid
    WHERE NOT g.tgisinternal AND n.nspname = 'public'
      AND c.relname IN ('comments', 'comment_likes')
      AND (p.proname IN ('protect_comment_immutable_fields', 'assign_comment_floor_number',
        'set_comment_floor_number', 'update_comment_likes_count',
        'handle_comment_update_history', 'handle_updated_at')
        OR g.tgname IN ('trigger_protect_comment_immutable_fields',
          'trigger_assign_comment_floor_number', 'set_floor_number_trigger',
          'comment_likes_count_trigger', 'trigger_update_comment_likes_count',
          'trigger_handle_comment_update_history', 'handle_updated_at_comments'))
  LOOP
    EXECUTE format('DROP TRIGGER %I ON %I.%I', t.tgname, t.nspname, t.relname);
  END LOOP;
END $$;

-- 保留合法的旧楼层和永久高水位。只将 NULL、非正值和重复项移到最大值之后。
WITH ranked AS (
  SELECT c.*, row_number() OVER (
    PARTITION BY post_slug, floor_number ORDER BY created_at, id) AS duplicate_rank
  FROM public.comments c
), repairs AS (
  SELECT id, post_slug, row_number() OVER (
    PARTITION BY post_slug ORDER BY created_at, id) AS offset_number
  FROM ranked WHERE floor_number IS NULL OR floor_number <= 0 OR duplicate_rank > 1
), maxima AS (
  SELECT c.post_slug, GREATEST(COALESCE(max(c.floor_number), 0),
    COALESCE(max(p.last_floor_number), 0), 0) AS last_number
  FROM public.comments c LEFT JOIN public.post_comment_counters p USING (post_slug)
  GROUP BY c.post_slug
)
UPDATE public.comments c SET floor_number = m.last_number + r.offset_number
FROM repairs r JOIN maxima m USING (post_slug) WHERE c.id = r.id;

ALTER TABLE public.comments ALTER COLUMN floor_number SET NOT NULL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.comments GROUP BY post_slug, floor_number HAVING count(*) > 1) THEN
    RAISE EXCEPTION '楼层修复失败，迁移回滚';
  END IF;
END $$;

-- 为 comments 补充 unique_post_floor 唯一约束 (S04 修复)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'unique_post_floor' AND table_name = 'comments'
  ) THEN
    ALTER TABLE public.comments
      ADD CONSTRAINT unique_post_floor UNIQUE (post_slug, floor_number);
  END IF;
END $$;

-- 初始化/同步文章楼层计数器到当前最大楼层
INSERT INTO public.post_comment_counters (post_slug, last_floor_number)
SELECT post_slug, COALESCE(MAX(floor_number), 0)
FROM public.comments
GROUP BY post_slug
ON CONFLICT (post_slug) DO UPDATE
SET last_floor_number = GREATEST(public.post_comment_counters.last_floor_number, EXCLUDED.last_floor_number);

-- 8. 校准存量评论的 likes_count (S09 修复：规避既有保护触发器抵消校准更新)
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  -- 标记内部事务
  PERFORM set_config('app.internal_likes_update', 'true', true);

  -- 临时解绑可能已存在的保护触发器，确保校准值生效
  DROP TRIGGER IF EXISTS trigger_protect_comment_immutable_fields ON public.comments;

  UPDATE public.comments c
  SET likes_count = COALESCE((
    SELECT COUNT(*)::INTEGER
    FROM public.comment_likes l
    WHERE l.comment_id = c.id
  ), 0);

  -- 验证校准有效性
  SELECT COUNT(*) INTO mismatch_count
  FROM public.comments c
  WHERE c.likes_count <> (
    SELECT COUNT(*)::INTEGER FROM public.comment_likes l WHERE l.comment_id = c.id
  );

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION '点赞计数校准验证失败: 仍有 % 条记录计数不匹配', mismatch_count;
  END IF;
END $$;

-- 9. 创建性能索引
CREATE INDEX IF NOT EXISTS comments_post_slug_idx ON public.comments(post_slug);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS comment_likes_user_id_idx ON public.comment_likes(user_id);
CREATE INDEX IF NOT EXISTS comment_edit_history_comment_id_idx ON public.comment_edit_history(comment_id);

-- 10. 部署触发器：楼层号持久原子分配与 INSERT 字段初始化 (S02 / S04 修复)
CREATE OR REPLACE FUNCTION public.assign_comment_floor_number()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  assigned_floor INTEGER;
BEGIN
  INSERT INTO public.post_comment_counters (post_slug, last_floor_number)
  VALUES (
    NEW.post_slug,
    COALESCE((SELECT MAX(floor_number) FROM public.comments WHERE post_slug = NEW.post_slug), 0)
  )
  ON CONFLICT (post_slug) DO NOTHING;

  UPDATE public.post_comment_counters
  SET last_floor_number = last_floor_number + 1
  WHERE post_slug = NEW.post_slug
  RETURNING last_floor_number INTO assigned_floor;

  NEW.floor_number := assigned_floor;

  -- 强制服务端初始化系统字段，杜绝客户端在 INSERT 时伪造
  NEW.likes_count := 0;
  NEW.is_edited := false;
  NEW.original_content := NULL;
  NEW.created_at := now();
  NEW.updated_at := now();
  NEW.user_id := COALESCE(auth.uid(), NEW.user_id);
  NEW.ip_address := NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_assign_comment_floor_number ON public.comments;
CREATE TRIGGER trigger_assign_comment_floor_number
  BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.assign_comment_floor_number();

-- 11. 部署触发器：点赞计数 (清理旧触发器 comment_likes_count_trigger)
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.internal_likes_update', 'true', true);

  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS comment_likes_count_trigger ON public.comment_likes;
DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON public.comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- 12. 部署触发器：受保护字段防篡改 (S02 修复：完整覆盖 UPDATE)
CREATE OR REPLACE FUNCTION public.protect_comment_immutable_fields()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.id := OLD.id;
  NEW.user_id := OLD.user_id;
  NEW.post_slug := OLD.post_slug;
  NEW.floor_number := OLD.floor_number;
  NEW.created_at := OLD.created_at;
  NEW.ip_address := OLD.ip_address;
  NEW.original_content := OLD.original_content;

  IF current_setting('app.internal_likes_update', true) IS DISTINCT FROM 'true' THEN
    NEW.likes_count := OLD.likes_count;
  END IF;

  IF NEW.content IS NOT DISTINCT FROM OLD.content THEN
    NEW.is_edited := OLD.is_edited;
    NEW.updated_at := OLD.updated_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_comment_immutable_fields ON public.comments;
CREATE TRIGGER trigger_protect_comment_immutable_fields
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.protect_comment_immutable_fields();

-- 13. 部署触发器：数据库级原子编辑历史归档
CREATE OR REPLACE FUNCTION public.handle_comment_update_history()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    INSERT INTO public.comment_edit_history (comment_id, old_content, edited_at, edited_by)
    VALUES (OLD.id, OLD.content, now(), COALESCE(auth.uid(), OLD.user_id));

    NEW.is_edited := true;
    NEW.updated_at := GREATEST(clock_timestamp(), OLD.updated_at + interval '1 microsecond');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_handle_comment_update_history ON public.comments;
CREATE TRIGGER trigger_handle_comment_update_history
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_update_history();

-- 14. 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_edit_history ENABLE ROW LEVEL SECURITY;

-- 15. 权限与列级安全隔离 (S02 / S03 修复：关闭客户端敏感字段直读与伪造写入)
REVOKE ALL ON public.comments FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, post_slug, user_id, content, likes_count, is_edited, floor_number, created_at, updated_at)
  ON public.comments TO anon, authenticated;
GRANT INSERT (post_slug, content, user_id) ON public.comments TO authenticated;
GRANT UPDATE (content) ON public.comments TO authenticated;
GRANT DELETE ON public.comments TO authenticated;

REVOKE ALL ON public.comment_edit_history FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.comment_edit_history TO authenticated;

REVOKE ALL ON public.comment_likes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.comment_likes TO authenticated;
GRANT INSERT (comment_id, user_id), DELETE ON public.comment_likes TO authenticated;

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

-- 16. 幂等更新 RLS 策略
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can view own likes" ON public.comment_likes;
CREATE POLICY "Users can view own likes"
  ON public.comment_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can like comments" ON public.comment_likes;
CREATE POLICY "Authenticated users can like comments"
  ON public.comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.comment_likes;
CREATE POLICY "Users can unlike their own likes"
  ON public.comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- S02 / S03 修复：废除公开读取与客户端直写策略
DROP POLICY IF EXISTS "Anyone can view edit history" ON public.comment_edit_history;
DROP POLICY IF EXISTS "Users can create edit history for their comments" ON public.comment_edit_history;
DROP POLICY IF EXISTS "Authors can view their own edit history" ON public.comment_edit_history;
CREATE POLICY "Authors can view their own edit history"
  ON public.comment_edit_history FOR SELECT
  TO authenticated
  USING (auth.uid() = edited_by);

INSERT INTO app_private.migrations(version) VALUES ('2026090801') ON CONFLICT DO NOTHING;
COMMIT;
SELECT '数据库迁移 2026090801 执行成功' as result;

