import React, { useState } from 'react'; // 导入 React 和 useState hook
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'; // 导入 Supabase 客户端实例与配置状态

// UserLogin 组件：用于用户登录
const UserLogin = () => {
  // State: email (原 username), password 用于存储用户输入的邮箱和密码
  // 注意: Supabase 默认使用邮箱进行登录，因此将原 username 字段改为 email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 新增 State: loading 用于处理提交加载状态，error 用于显示错误信息，message 用于显示操作结果信息
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // 新增 State: 密码重置相关状态
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // 处理表单提交事件 (异步函数)
  const handleSubmit = async (e) => {
    e.preventDefault(); // 阻止表单默认提交行为
    setLoading(true);   // 开始加载状态
    setError('');       // 清空之前的错误信息
    setMessage('');     // 清空之前的消息

    // 调用 Supabase Auth 的 signInWithPassword 方法进行用户登录
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setLoading(false); // 结束加载状态

    if (signInError) {
      // 如果登录过程中发生错误 (例如密码错误，用户不存在等)
      console.error('Supabase 登录错误:', signInError.message);
      setError(signInError.message); // 将错误信息展示给用户
    } else if (data.user) {
      // 登录成功
      setMessage("登录成功！");
      setEmail('');   // 清空表单
      setPassword('');
      // 触发一个自定义事件，以便其他部分（如 Header）可以监听到登录状态的改变
      // 这是一种简单的跨组件通信方式，更复杂的场景可能需要状态管理器
      const event = new CustomEvent('authChange', { detail: { loggedIn: true, user: data.user, session: data.session } });
      window.dispatchEvent(event);

    } else {
      // 意外情况
      setError("发生未知错误或登录失败，请检查您的凭据或稍后再试。");
    }
  };

  // 处理密码重置请求
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setResetError(error.message);
      } else {
        setResetMessage('密码重置邮件已发送！请检查您的邮箱。');
        setResetEmail('');
        // 3秒后自动关闭重置表单
        setTimeout(() => {
          setShowResetForm(false);
          setResetMessage('');
        }, 3000);
      }
    } catch (error) {
      setResetError('发送重置邮件失败，请稍后再试。');
    } finally {
      setResetLoading(false);
    }
  };

  // 切换到密码重置表单
  const showPasswordReset = () => {
    setShowResetForm(true);
    setError('');
    setMessage('');
    setResetError('');
    setResetMessage('');
  };

  // 返回登录表单
  const backToLogin = () => {
    setShowResetForm(false);
    setResetError('');
    setResetMessage('');
    setResetEmail('');
  };

  // 定义表单容器的内联样式 (与 UserRegistration 保持一致)
  const formContainerStyle = {
    border: '1px solid var(--border-color)', padding: '25px', margin: '30px auto',
    borderRadius: '8px', maxWidth: '450px', backgroundColor: 'var(--bg-color)', boxShadow: 'var(--box-shadow)'
  };
  const formTitleStyle = { textAlign: 'center', marginBottom: '25px', color: 'var(--heading-color)', fontSize: '1.5em' };
  const formGroupStyle = { marginBottom: '20px' };
  const labelStyle = { display: 'block', marginBottom: '8px', color: 'rgb(var(--gray-dark))', fontWeight: 'bold' };
  const inputStyle = { width: '100%', padding: '12px', boxSizing: 'border-box', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '1rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' };
  const buttonStyle = {
    width: '100%', padding: '12px', backgroundColor: loading ? 'var(--gray)' : 'var(--accent, #2337ff)',
    color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '1rem', fontWeight: 'bold'
  };
  const errorStyle = { color: 'red', marginBottom: '15px', textAlign: 'center' };
  const messageStyle = { color: 'green', marginBottom: '15px', textAlign: 'center' };

  // 新增样式：忘记密码链接和重置表单
  const forgotPasswordStyle = {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: '0.9rem'
  };

  const linkStyle = {
    color: 'var(--accent, #2337ff)',
    cursor: 'pointer',
    textDecoration: 'underline'
  };

  const backLinkStyle = {
    color: 'var(--gray)',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '0.9rem',
    marginTop: '15px',
    textAlign: 'center'
  };

  // 定义UI文本 (中文)
  const formTitleText = "用户登录";
  const resetFormTitleText = "重置密码";
  // const usernameLabelText = "用户名"; // 改为邮箱登录
  const emailLabelText = "邮箱地址"; // 新增邮箱标签文本
  const passwordLabelText = "密码";
  const loginButtonText = "登录";
  const loadingButtonText = "登录中..."; // 按钮加载状态文本
  const forgotPasswordText = "忘记密码？";
  const resetButtonText = "发送重置邮件";
  const resetLoadingText = "发送中...";
  const backToLoginText = "返回登录";
  const resetEmailPlaceholder = "输入您的邮箱地址";
  const resetInstructionText = "请输入您的邮箱地址，我们将发送密码重置链接给您。";

  return (
    <div style={formContainerStyle}>
      <h3 style={formTitleStyle}>
        {showResetForm ? resetFormTitleText : formTitleText}
      </h3>

      {/* 访客模式提示 (S05 修复) */}
      {!isSupabaseConfigured && (
        <div style={{ padding: '10px 15px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
          ⚠️ 后端认证服务未配置，登录与找回密码功能暂不可用（访客只读模式）。
        </div>
      )}

      {/* 显示错误和消息 */}
      {!showResetForm && error && <p style={errorStyle}>{error}</p>}
      {!showResetForm && message && <p style={messageStyle}>{message}</p>}
      {showResetForm && resetError && <p style={errorStyle}>{resetError}</p>}
      {showResetForm && resetMessage && <p style={messageStyle}>{resetMessage}</p>}

      {/* 密码重置表单 */}
      {showResetForm ? (
        <div>
          <p style={{ textAlign: 'center', marginBottom: '20px', color: 'rgb(var(--gray-dark))' }}>
            {resetInstructionText}
          </p>
          <form onSubmit={handlePasswordReset}>
            <div style={formGroupStyle}>
              <label htmlFor="reset-email" style={labelStyle}>{emailLabelText}</label>
              <input
                type="email"
                id="reset-email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                style={inputStyle}
                disabled={resetLoading || !isSupabaseConfigured}
                placeholder={resetEmailPlaceholder}
              />
            </div>
            <button
              type="submit"
              style={{
                ...buttonStyle,
                backgroundColor: (resetLoading || !isSupabaseConfigured) ? 'var(--gray)' : 'var(--accent, #2337ff)'
              }}
              disabled={resetLoading || !isSupabaseConfigured}
            >
              {resetLoading ? resetLoadingText : resetButtonText}
            </button>
          </form>
          <div style={backLinkStyle}>
            <span onClick={backToLogin} style={linkStyle}>
              {backToLoginText}
            </span>
          </div>
        </div>
      ) : (
        /* 登录表单 */
        <form onSubmit={handleSubmit}>
        {/* 邮箱输入组 (原用户名输入组) */}
        <div style={formGroupStyle}>
          <label htmlFor="login-email" style={labelStyle}>{emailLabelText}</label> {/* htmlFor 和 id 更新为 email */}
          <input
            type="email" // input 类型改为 email
            id="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // 更新 email state
            required
            style={inputStyle}
            disabled={loading || !isSupabaseConfigured}
            placeholder="you@example.com" // 添加邮箱占位符
          />
        </div>
        {/* 密码输入组 */}
        <div style={formGroupStyle}>
          <label htmlFor="login-password" style={labelStyle}>{passwordLabelText}</label>
          <input
            type="password"
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
            disabled={loading || !isSupabaseConfigured}
          />
        </div>
        {/* 提交按钮 */}
        <button
          type="submit"
          style={{
            ...buttonStyle,
            backgroundColor: (!isSupabaseConfigured || loading) ? 'var(--gray)' : buttonStyle.backgroundColor,
            cursor: (!isSupabaseConfigured || loading) ? 'not-allowed' : 'pointer'
          }}
          onMouseOver={(e) => { if (!loading && isSupabaseConfigured) e.currentTarget.style.backgroundColor = 'var(--accent-dark)'; }}
          onMouseOut={(e) => { if (!loading && isSupabaseConfigured) e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
          disabled={loading || !isSupabaseConfigured}
        >
          {loading ? loadingButtonText : loginButtonText}
        </button>

        {/* 忘记密码链接 */}
        <div style={forgotPasswordStyle}>
          <span onClick={showPasswordReset} style={linkStyle}>
            {forgotPasswordText}
          </span>
        </div>
      </form>
      )}
    </div>
  );
};

export default UserLogin;
