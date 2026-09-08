-- 针对现有 astrohqy20250414 表的 Supabase 设置脚本
-- 请在 Supabase SQL 编辑器中执行此脚本

-- 1. 确保 astrohqy20250414 表有必要的字段
-- 如果字段不存在，添加它们
DO $$ 
BEGIN
  -- 检查并添加 username 字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='astrohqy20250414' AND column_name='username') THEN
    ALTER TABLE public.astrohqy20250414 ADD COLUMN username TEXT UNIQUE;
  END IF;
  
  -- 检查并添加 avatar_url 字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='astrohqy20250414' AND column_name='avatar_url') THEN
    ALTER TABLE public.astrohqy20250414 ADD COLUMN avatar_url TEXT;
  END IF;
  
  -- 检查并添加 created_at 字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='astrohqy20250414' AND column_name='created_at') THEN
    ALTER TABLE public.astrohqy20250414 ADD COLUMN created_at TIMESTAMPTZ DEFAULT now() NOT NULL;
  END IF;
  
  -- 检查并添加 updated_at 字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='astrohqy20250414' AND column_name='updated_at') THEN
    ALTER TABLE public.astrohqy20250414 ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
  END IF;
END $$;

-- 2. 创建 comments 表
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS comments_post_slug_idx ON public.comments(post_slug);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments(created_at DESC);

-- 4. 启用 RLS
ALTER TABLE public.astrohqy20250414 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略 - astrohqy20250414 表
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.astrohqy20250414;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.astrohqy20250414 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.astrohqy20250414;
CREATE POLICY "Users can insert their own profile" 
ON public.astrohqy20250414 
FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.astrohqy20250414;
CREATE POLICY "Users can update own profile" 
ON public.astrohqy20250414 
FOR UPDATE 
USING (auth.uid() = id);

-- 6. 创建 RLS 策略 - comments 表
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
CREATE POLICY "Authenticated users can insert comments" 
ON public.comments 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" 
ON public.comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- 7. 创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建触发器
DROP TRIGGER IF EXISTS handle_updated_at_astrohqy20250414 ON public.astrohqy20250414;
CREATE TRIGGER handle_updated_at_astrohqy20250414
  BEFORE UPDATE ON public.astrohqy20250414
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_comments ON public.comments;
CREATE TRIGGER handle_updated_at_comments
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. 创建自动创建用户资料的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.astrohqy20250414 (id, username, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 创建用户注册触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 完成提示
SELECT 'Supabase 数据库设置完成！使用 astrohqy20250414 作为用户资料表。' as message;
