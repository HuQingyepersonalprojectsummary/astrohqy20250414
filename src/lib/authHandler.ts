// src/lib/authHandler.ts

// 导入 Supabase 客户端实例，用于与 Supabase 后端进行交互
import { supabase } from './supabaseClient';
// 导入 authStore (Nanostore 的 atom) 以及用于更新 store 状态的 action 函数
import { authStore, setAuthSession, clearAuthSession, setAuthLoading, setAuthError } from '../stores/authStore';

// 标记 AuthHandler 是否已经初始化，用于防止重复设置监听器
let initialized = false;

// 初始化 Supabase 认证状态监听器和首次会话检查
// 此函数应在应用的全局入口点（例如主布局文件的客户端脚本）调用一次
export function initializeAuthListener() {
  // 如果已经初始化过，则直接返回，避免重复操作
  if (initialized) {
    console.log('AuthHandler: 监听器已初始化，跳过重复设置。'); // 日志：已初始化，跳过
    return;
  }

  console.log('AuthHandler: 正在初始化 Supabase Auth 状态监听器...'); // 日志：开始初始化
  setAuthLoading(true); // 在开始检查会话前，将 authStore 的加载状态设置为 true

  // 1. 首次加载时，尝试获取当前用户的会话 (session)
  // 这有助于恢复用户之前的登录状态
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      // 如果获取会话过程中发生错误
      console.error('AuthHandler: 获取初始会话失败:', error.message); // 日志：获取会话失败及错误信息
      setAuthError(`获取会话失败: ${error.message}`); // 更新 authStore，记录错误信息
    } else {
      // 如果成功获取会话 (session 可能为 null，表示用户未登录)
      console.log('AuthHandler: 初始会话获取成功:', session); // 日志：获取会话成功及会话对象
      // 使用获取到的 user 和 session 更新 authStore
      // 如果 session 为 null，则 user 也为 null，表示未登录状态
      setAuthSession(session?.user ?? null, session);
    }
  }).catch(err => {
    // 捕获在 getSession 过程中可能发生的 JavaScript 错误 (例如网络问题)
    console.error('AuthHandler: 获取初始会话时发生 JS 错误:', err); // 日志：JS 错误
    setAuthError('获取会话时发生网络或未知错误。'); // 更新 authStore，记录通用错误信息
  }).finally(() => {
    // getSession Promise 完成后（无论成功或失败）
    // 注意：Supabase 的 onAuthStateChange 监听器在首次注册时也会触发一次，
    // 通常会基于当前会话状态。该回调中的 setAuthSession 会将 isLoading 设置为 false。
    // 因此，这里的 finally 块可能不需要显式设置 isLoading，以避免逻辑冲突。
    // setAuthLoading(false); // 可以考虑移除此行，依赖 onAuthStateChange 的首次回调
  });

  // 2. 监听 Supabase 认证状态的变化事件
  // 这些事件包括：SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('AuthHandler: Supabase onAuthStateChange 事件:', event, session); // 日志：认证状态变化事件及会话

    // 无论发生何种认证事件，都使用最新的 session 信息更新 authStore
    // - 如果用户登录 (SIGNED_IN)，session 会包含用户信息和会话令牌。
    // - 如果用户登出 (SIGNED_OUT)，session 会变为 null。
    // - 其他事件 (如 TOKEN_REFRESHED) 也会提供更新后的 session。
    // setAuthSession 函数会处理 session 为 null 的情况，并相应更新 user 和 isLoading 状态。
    setAuthSession(session?.user ?? null, session);

    // 根据具体的事件类型，可以执行额外的特定操作
    switch (event) {
      case 'SIGNED_IN':
        console.log('AuthHandler: 用户已登录'); // 日志：用户已登录
        // 例如：可以在此处触发获取用户档案 (profile) 的操作
        break;
      case 'SIGNED_OUT':
        console.log('AuthHandler: 用户已登出'); // 日志：用户已登出
        // clearAuthSession(); // 此行不再需要，因为 setAuthSession(null, null) 已完成同样的功能
        break;
      case 'TOKEN_REFRESHED':
        console.log('AuthHandler: 用户令牌已刷新'); // 日志：令牌已刷新
        // 如果应用依赖于手动处理令牌，可以在此进行操作
        break;
      case 'USER_UPDATED':
        console.log('AuthHandler: 用户信息已更新'); // 日志：用户信息已更新
        // 例如，用户在其他地方更改了邮箱或密码
        break;
      case 'PASSWORD_RECOVERY':
        console.log('AuthHandler: 用户已进入密码恢复流程'); // 日志：密码恢复流程
        // UI 可能需要响应此事件，例如显示密码重置相关的界面
        break;
      default:
        // 处理其他或未知的认证事件
        console.log('AuthHandler: 收到未处理的认证事件:', event);
        break;
    }
  });

  initialized = true; // 将初始化标记设置为 true，表示监听器已设置
  console.log('AuthHandler: Supabase Auth 状态监听器设置完毕。'); // 日志：监听器设置完毕

  // 返回一个取消订阅函数
  // 在某些场景下（例如单页面应用中组件卸载时），可能需要调用此函数来停止监听，以防止内存泄漏。
  // 在 Astro 这样的多页面应用或服务器渲染为主的框架中，全局监听器通常不需要手动取消，
  // 因为页面刷新会自然清理。但提供此函数是一种良好的实践。
  return () => {
    if (subscription) {
      subscription.unsubscribe(); // 调用 Supabase 提供的取消订阅方法
      initialized = false; // 重置初始化标记，允许将来重新初始化 (如果需要)
      console.log('AuthHandler: Supabase Auth 状态监听器已取消订阅。'); // 日志：已取消订阅
    }
  };
}

// 注意：initializeAuthListener() 函数本身不在此文件内自动调用。
// 它应该由应用的某个全局客户端脚本（例如，在主布局文件 Layout.astro 的 <script> 标签中）显式调用一次。
// 示例调用 (应放在其他文件中):
// import { initializeAuthListener } from './src/lib/authHandler';
// initializeAuthListener();
