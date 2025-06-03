-- 测试数据库设置的简单查询
-- 在 Supabase SQL 编辑器中运行这些查询来验证设置

-- 1. 检查 profiles 表是否存在
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. 检查 comments 表是否存在
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'comments'
ORDER BY ordinal_position;

-- 3. 检查外键关系
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (tc.table_name = 'profiles' OR tc.table_name = 'comments');

-- 4. 检查 RLS 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND (tablename = 'profiles' OR tablename = 'comments');

-- 5. 测试基本查询（应该返回空结果，但不应该报错）
SELECT COUNT(*) as profiles_count FROM public.profiles;
SELECT COUNT(*) as comments_count FROM public.comments;

-- 6. 测试关联查询（这是导致错误的查询类型）
SELECT 
  c.*,
  p.username,
  p.avatar_url
FROM public.comments c
LEFT JOIN public.profiles p ON c.user_id = p.id
LIMIT 5;
