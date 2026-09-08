import { supabase } from '@/lib/supabaseClient';
import { setAuthSession, clearAuthSession, setAuthLoading, setAuthError } from '@/stores/authStore';

// 标记 AuthHandler 是否已经初始化，用于防止重复设置监听器
let initialized = false;

// 初始化 Supabase 认证状态监听器和首次会话检查
export function initializeAuthListener() {
  if (initialized) {
    return;
  }

  setAuthLoading(true);

  // 1. 首次加载时，尝试获取当前用户的会话 (session)
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.error('AuthHandler: 获取初始会话失败:', error.message);
      setAuthError(`获取会话失败: ${error.message}`);
    } else {
      const user = session?.user ?? null;
      setAuthSession(user, session);
    }
  }).catch(err => {
    console.error('AuthHandler: 调用 getSession() 时发生 JS 捕获的错误:', err);
    setAuthError(`获取会话时发生网络或未知错误: ${err.message || '检查网络连接或Supabase服务状态。'}`);
  });

  // 2. 监听 Supabase 认证状态的变化事件
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null;

    switch (event) {
      case 'INITIAL_SESSION':
      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
      case 'USER_UPDATED':
        setAuthSession(user, session);
        break;
      case 'SIGNED_OUT':
        clearAuthSession();
        break;
      case 'PASSWORD_RECOVERY':
        setAuthLoading(false);
        break;
      default:
        setAuthSession(user, session);
        break;
    }
  });

  initialized = true;

  return () => {
    if (subscription) {
      subscription.unsubscribe();
      initialized = false;
      console.log('AuthHandler: Supabase Auth 状态监听器已成功取消订阅。');
    }
  };
}

// 注意：initializeAuthListener() 函数本身不在此文件内自动调用。
// 它应该由应用的某个全局客户端脚本（例如，在主布局文件 Layout.astro 的 <script> 标签中）显式调用一次。
