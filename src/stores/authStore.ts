// src/stores/authStore.ts
import { atom } from 'nanostores'; // 从 nanostores 导入 atom 创建响应式状态单元
import type { User, Session } from '@supabase/supabase-js'; // 从 Supabase 导入 User 和 Session 类型

// 定义认证状态的接口类型
export interface AuthState {
  user: User | null;        // 当前登录的用户对象，未登录则为 null
  session: Session | null;    // 当前用户的会话对象，未登录则为 null
  isLoading: boolean;       // 是否正在加载认证状态 (例如，在页面初始加载时检查会话)
  error: string | null;       // 认证相关的错误信息
}

// 创建一个 atom (原子状态单元) 来存储认证状态
// 初始状态：isLoading 为 true (表示正在检查)，user 和 session 为 null
export const authStore = atom<AuthState>({
  user: null,
  session: null,
  isLoading: true, // 初始化时，我们通常会去获取当前会话，所以设为 true
  error: null,
});

// --- Action-like functions to update the store ---
// --- 用于更新 store 状态的类 Action 函数 ---

// 设置用户会话信息 (通常在登录或会话恢复后调用)
export function setAuthSession(user: User | null, session: Session | null) {
  const newState: AuthState = { user, session, isLoading: false, error: null };
  authStore.set(newState);
}

// 清除用户会话信息 (通常在登出后调用)
export function clearAuthSession() {
  const newState: AuthState = { user: null, session: null, isLoading: false, error: null };
  authStore.set(newState);
}

// 设置加载状态
export function setAuthLoading(isLoading: boolean) {
  const currentState = authStore.get();
  const newState: AuthState = { ...currentState, isLoading };
  authStore.set(newState);
}

// 设置错误信息
export function setAuthError(errorMessage: string | null) {
  const currentState = authStore.get(); // 获取当前 store 的状态
  // 构建新的状态对象：设置错误信息，并将 isLoading 设置为 false。
  // 通常，发生认证错误时，也应该清除用户和会话信息。
  const newState: AuthState = { ...currentState, user: null, session: null, error: errorMessage, isLoading: false }; 
  // 新增日志：记录函数调用、接收的 errorMessage 参数以及将要设置的完整新状态
  console.log('AuthStore: 调用 setAuthError。错误信息参数:', errorMessage, '即将设置的新状态:', newState);
  authStore.set(newState); // 更新 store 的状态
  // 原有的日志 'AuthStore: 错误信息已设置' 已被上面的详细日志覆盖
}

// (这里的 console.log 仅用于开发和调试，生产环境中可以移除)
// (这些 console.log 语句主要用于开发和调试目的，在生产环境中建议移除或使用更完善的日志方案)
