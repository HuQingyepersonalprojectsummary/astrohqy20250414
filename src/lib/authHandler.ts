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
    console.log('AuthHandler: 监听器已初始化，跳过重复执行。'); // 更新日志信息
    return;
  }

  console.log('AuthHandler: 正在初始化 Supabase Auth 状态监听器...'); // 更新日志信息
  setAuthLoading(true); // 在开始检查会话前，将 authStore 的加载状态设置为 true

  // 1. 首次加载时，尝试获取当前用户的会话 (session)
  // 这有助于恢复用户之前的登录状态
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    // 新增日志: 记录从 getSession() 收到的原始数据
    console.log('AuthHandler - getSession() result: session 对象:', session, '错误对象:', error);

    if (error) {
      // 如果获取会话过程中发生错误
      console.error('AuthHandler: 获取初始会话失败:', error.message); // 日志：获取会话失败及错误信息
      // 新增日志: 即将调用的 action
      console.log(`AuthHandler - getSession(): 即将调用 setAuthError。错误: "${error.message}"`);
      setAuthError(`获取会话失败: ${error.message}`); // 更新 authStore，记录错误信息
    } else {
      // 如果成功获取会话 (session 可能为 null，表示用户未登录)
      console.log('AuthHandler: 初始会话获取成功。'); // 日志：获取会话成功
      // 新增日志: 即将调用的 action 和关键参数
      console.log(`AuthHandler - getSession(): 即将调用 setAuthSession。用户ID: ${session?.user?.id || null}, 会话存在: ${!!session}`);
      setAuthSession(session?.user ?? null, session); // 使用获取到的 user 和 session 更新 authStore
    }
  }).catch(err => {
    // 捕获在 getSession 过程中可能发生的 JavaScript 错误 (例如网络问题)
    console.error('AuthHandler: 调用 getSession() 时发生 JS 捕获的错误:', err); // 更新日志信息
    // 新增日志: 即将调用的 action
    console.log(`AuthHandler - getSession() catch: 即将调用 setAuthError。错误: "${err.message || '未知JS错误'}"`);
    setAuthError(`获取会话时发生网络或未知错误: ${err.message || '检查网络连接或Supabase服务状态。'}`); // 更新错误信息
  });

  // 2. 监听 Supabase 认证状态的变化事件
  // 这些事件包括：SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    // 此日志已存在且良好，但我们可以在其后或之前添加更具体的日志
    console.log('AuthHandler: Supabase onAuthStateChange event:', event, session); // 日志：认证状态变化事件及会话
    
    // 新增日志: 准备调用 setAuthSession
    console.log(`AuthHandler - onAuthStateChange: 接收到 '${event}' 事件。即将使用新的 session (用户ID: ${session?.user?.id || null}, 会话存在: ${!!session}) 更新 authStore。`);
    // 无论发生何种认证事件，都使用最新的 session 信息更新 authStore
    setAuthSession(session?.user ?? null, session);
    
    // 根据具体的事件类型，可以执行额外的特定操作
    switch (event) {
      case 'SIGNED_IN':
        console.log('AuthHandler - SIGNED_IN: 用户已登录。'); // 日志：用户已登录
        break;
      case 'SIGNED_OUT':
        console.log('AuthHandler - SIGNED_OUT: 用户已登出。'); // 日志：用户已登出
        break;
      case 'TOKEN_REFRESHED':
        console.log('AuthHandler - TOKEN_REFRESHED: 用户令牌已刷新。'); // 日志：令牌已刷新
        break;
      case 'USER_UPDATED':
        console.log('AuthHandler - USER_UPDATED: 用户信息已更新。'); // 日志：用户信息已更新
        break;
      case 'PASSWORD_RECOVERY':
        console.log('AuthHandler - PASSWORD_RECOVERY: 用户已进入密码恢复流程。'); // 日志：密码恢复流程
        break;
      default:
        // 处理其他或未知的认证事件
        console.log(`AuthHandler - 未知事件: ${event}`); // 为未知事件添加日志
        break;
    }
  });

  initialized = true; // 将初始化标记设置为 true，表示监听器已设置
  console.log('AuthHandler: Supabase Auth 状态监听器设置完毕。'); // 日志：监听器设置完毕

  // 返回一个取消订阅函数
  return () => {
    if (subscription) {
      subscription.unsubscribe(); // 调用 Supabase 提供的取消订阅方法
      initialized = false; // 重置初始化标记，允许将来重新初始化 (如果需要)
      console.log('AuthHandler: Supabase Auth 状态监听器已成功取消订阅。'); // 更新日志信息
    }
  };
}

// 注意：initializeAuthListener() 函数本身不在此文件内自动调用。
// 它应该由应用的某个全局客户端脚本（例如，在主布局文件 Layout.astro 的 <script> 标签中）显式调用一次。
