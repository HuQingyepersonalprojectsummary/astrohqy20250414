-- 此历史入口已停用。原脚本保存在 database/legacy/supabase-setup-profiles.sql.disabled。
-- 新库：supabase-setup-complete.sql；旧库：supabase-migration-upgrade.sql。
DO $$ BEGIN
  RAISE EXCEPTION '旧数据库脚本已停用，请执行 supabase-migration-upgrade.sql（新库也可执行 supabase-setup-complete.sql）。';
END $$;
