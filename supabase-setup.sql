-- Supabase 数据库设置脚本
-- 请在 Supabase SQL 编辑器中执行此脚本
-- 注意：使用现有的 astrohqy20250414 表作为用户资料表

-- 1. 检查并更新 astrohqy20250414 表结构（如果需要）
-- 如果表不存在，创建它；如果存在，确保有必要的字段
CREATE TABLE IF NOT EXISTS public.astrohqy20250414 (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 如果表已存在但缺少某些字段，添加它们（这些语句会忽略已存在的字段）
DO $$
BEGIN
  -- 添加 username 字段（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='astrohqy20250414' AND column_name='username') THEN
    ALTER TABLE public.astrohqy20250414 ADD COLUMN username TEXT UNIQUE;
  END IF;

  -- 添加 full_name 字段（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='astrohqy20250414' AND column_name='full_name') THEN
    ALTER TABLE public.astrohqy20250414 ADD COLUMN full_name TEXT;
  END IF;

  -- 添加 avatar_url 字段（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='astrohqy20250414' AND column_name='avatar_url') THEN
    ALTER TABLE public.astrohqy20250414 ADD COLUMN avatar_url TEXT;
  END IF;

  -- 添加 website 字段（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='astrohqy20250414' AND column_name='website') THEN
    ALTER TABLE public.astrohqy20250414 ADD COLUMN website TEXT;
  END IF;

  -- 添加 bio 字段（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='astrohqy20250414' AND column_name='bio') THEN
    ALTER TABLE public.astrohqy20250414 ADD COLUMN bio TEXT;
  END IF;

  -- 添加 created_at 字段（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='astrohqy20250414' AND column_name='created_at') THEN
    ALTER TABLE public.astrohqy20250414 ADD COLUMN created_at TIMESTAMPTZ DEFAULT now() NOT NULL;
  END IF;

  -- 添加 updated_at 字段（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='astrohqy20250414' AND column_name='updated_at') THEN
    ALTER TABLE public.astrohqy20250414 ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
  END IF;
END $$;

-- 2. 创建 comments 表（评论表）
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS comments_post_slug_idx ON public.comments(post_slug);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments(created_at DESC);

-- 4. 启用行级安全 (RLS)
ALTER TABLE public.astrohqy20250414 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 5. 创建 astrohqy20250414 表的 RLS 策略
-- 允许用户查看所有用户的公开资料
CREATE POLICY "Public profiles are viewable by everyone"
ON public.astrohqy20250414
FOR SELECT
USING (true);

-- 允许用户插入自己的资料
CREATE POLICY "Users can insert their own profile"
ON public.astrohqy20250414
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的资料
CREATE POLICY "Users can update own profile"
ON public.astrohqy20250414
FOR UPDATE
USING (auth.uid() = id);

-- 6. 创建 comments 表的 RLS 策略
-- 允许所有人查看评论
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments 
FOR SELECT 
USING (true);

-- 允许认证用户插入评论
CREATE POLICY "Authenticated users can insert comments" 
ON public.comments 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的评论
CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 允许用户删除自己的评论
CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- 7. 创建触发器函数来自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 为 astrohqy20250414 表创建 updated_at 触发器
CREATE TRIGGER handle_updated_at_astrohqy20250414
  BEFORE UPDATE ON public.astrohqy20250414
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. 为 comments 表创建 updated_at 触发器
CREATE TRIGGER handle_updated_at_comments
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 10. 创建函数来自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.astrohqy20250414 (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 创建触发器，当新用户注册时自动创建资料
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 12. 插入一些示例数据（可选）
-- 注意：这些是示例数据，您可以根据需要修改或删除

-- 示例评论（需要先有用户注册后才能插入真实评论）
-- INSERT INTO public.comments (post_slug, user_id, content, ip_address) VALUES
-- ('first-post', '00000000-0000-0000-0000-000000000000', '这是一条示例评论！', '127.0.0.1'),
-- ('second-post', '00000000-0000-0000-0000-000000000000', '另一条示例评论。', '127.0.0.1');

-- 完成提示
SELECT 'Supabase 数据库设置完成！' as message;
