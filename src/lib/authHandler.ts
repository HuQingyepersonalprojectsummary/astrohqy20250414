import { supabase } from '@/lib/supabaseClient';
// 从 authStore 中导入具体的 action 函数和 authStore 本身（如果需要直接 get() 状态）
import { authStore, setAuthSession, clearAuthSession, setAuthLoading, setAuthError } from '@/stores/authStore';
import type { User, Session } from '@supabase/supabase-js';

// 标记 AuthHandler 是否已经初始化，用于防止重复设置监听器
let initialized = false;

// 初始化 Supabase 认证状态监听器和首次会话检查
export function initializeAuthListener() {
  if (initialized) {
    console.log('AuthHandler: 监听器已初始化，跳过重复执行。');
    return;
  }

  console.log('AuthHandler: 正在初始化 Supabase Auth 状态监听器...');
  setAuthLoading(true); // 使用导入的 action 函数

  // 1. 首次加载时，尝试获取当前用户的会话 (session)
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    console.log('AuthHandler - getSession() result: session 对象:', session, '错误对象:', error);

    if (error) {
      console.error('AuthHandler: 获取初始会话失败:', error.message);
      console.log(`AuthHandler - getSession(): 即将调用 setAuthError。错误: "${error.message}"`);
      setAuthError(`获取会话失败: ${error.message}`); // 使用导入的 action 函数
    } else {
      console.log('AuthHandler: 初始会话获取成功。');
      const user = session?.user ?? null;
      console.log(`AuthHandler - getSession(): 即将调用 setAuthSession。用户ID: ${user?.id || null}, 会话存在: ${!!session}`);
      setAuthSession(user, session); // 使用导入的 action 函数 (这个函数内部会处理 isLoading 和 error)
    }
  }).catch(err => {
    console.error('AuthHandler: 调用 getSession() 时发生 JS 捕获的错误:', err);
    console.log(`AuthHandler - getSession() catch: 即将调用 setAuthError。错误: "${err.message || '未知JS错误'}"`);
    setAuthError(`获取会话时发生网络或未知错误: ${err.message || '检查网络连接或Supabase服务状态。'}`); // 使用导入的 action 函数
    // setAuthLoading(false) 应该由 setAuthError 内部处理，但如果需要可以显式调用
  });

  // 2. 监听 Supabase 认证状态的变化事件
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('AuthHandler: Supabase onAuthStateChange event:', event, session);
    const user = session?.user ?? null;

    console.log(`AuthHandler - onAuthStateChange: 接收到 '${event}' 事件。即将根据事件类型更新 authStore。`);

    switch (event) {
      case 'INITIAL_SESSION':
      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
      case 'USER_UPDATED':
        console.log(`AuthHandler - ${event}: 即将调用 setAuthSession。用户ID: ${user?.id || null}, 会话存在: ${!!session}`);
        setAuthSession(user, session);
        break;
      case 'SIGNED_OUT':
        console.log('AuthHandler - SIGNED_OUT: 即将调用 clearAuthSession。');
        clearAuthSession();
        break;
      case 'PASSWORD_RECOVERY':
        console.log('AuthHandler - PASSWORD_RECOVERY: 用户已进入密码恢复流程。通常不直接改变会话，但结束加载。');
        setAuthLoading(false); // 密码恢复流程可能不改变会话，但应结束加载状态
        // 如果需要，也可以设置一个特定的状态，例如 inPasswordRecovery: true
        break;
      default:
        console.log(`AuthHandler - 未知或未处理的事件: ${event}。会话信息:`, session, '将尝试使用 setAuthSession 更新。');
        // 对于未明确处理的事件，也尝试用当前会话更新状态，并确保 isLoading 为 false
        setAuthSession(user, session); 
        break;
    }
  });

  initialized = true;
  console.log('AuthHandler: Supabase Auth 状态监听器设置完毕。');

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
