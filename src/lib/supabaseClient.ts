// src/lib/supabaseClient.ts

// 从 @supabase/supabase-js 导入 createClient 函数及 SupabaseClient 类型
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// 获取 Supabase URL 和匿名密钥 (Anon Key)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_project_url' &&
  !supabaseUrl.includes('placeholder')
);

// 开发模式安全调试信息
if (import.meta.env.DEV) {
  console.log('Supabase 客户端状态:', {
    configured: isSupabaseConfigured,
    env: import.meta.env.MODE
  });
}

// 缺失环境变量时的友好警告
if (!isSupabaseConfigured) {
  console.warn("提示: Supabase 环境变量 (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY) 未配置或为占位符。系统已自动进入访客只读模式，网络请求已被安全拦截。");
}

// 访客模式下的安全 Mock Client，杜绝向占位域名发送不可用网络请求 (S05 修复)
function createMockClient() {
  const chainable: any = {
    select: () => chainable,
    insert: () => chainable,
    update: () => chainable,
    delete: () => chainable,
    eq: () => chainable,
    gt: () => chainable,
    in: () => chainable,
    order: () => chainable,
    limit: () => chainable,
    range: () => chainable,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve)
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error('后端服务未配置，登录不可用（访客模式）。')
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: new Error('后端服务未配置，注册不可用（访客模式）。')
      }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({
        data: null,
        error: new Error('后端服务未配置，密码重置不可用（访客模式）。')
      }),
      updateUser: async () => ({
        data: { user: null },
        error: new Error('后端服务未配置，密码更新不可用（访客模式）。')
      }),
      setSession: async () => ({
        data: { session: null, user: null },
        error: new Error('后端服务未配置。')
      }),
      exchangeCodeForSession: async () => ({
        data: { session: null, user: null },
        error: new Error('后端服务未配置。')
      })
    },
    from: (_table: string) => chainable
  } as any;
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (createMockClient() as unknown as SupabaseClient);
