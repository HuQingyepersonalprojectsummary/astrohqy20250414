import React, { useState } from 'react'; // 导入 React 和 useState hook
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'; // 导入 Supabase 客户端实例与配置状态

// UserRegistration 组件：用于用户注册
const UserRegistration = () => {
  // State: username, email, password 分别用于存储用户输入的用户名、邮箱和密码
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 新增 State: loading 用于处理提交加载状态，error 用于显示错误信息，message 用于显示操作结果信息
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // 处理表单提交事件 (异步函数)
  const handleSubmit = async (e) => {
    e.preventDefault(); // 阻止表单默认提交行为

    // 验证 Supabase 配置 (S05 修复)
    if (!isSupabaseConfigured) {
      setError('后端服务未配置：当前处于访客只读模式，注册功能暂不可用。');
      return;
    }

    setLoading(true);   // 开始加载状态
    setError('');       // 清空之前的错误信息
    setMessage('');     // 清空之前的消息

    // 调用 Supabase Auth 的 signUp 方法进行用户注册
    // 我们将 username 存储在 user_metadata 中。
    // 之后需要设置一个 Supabase 数据库触发器，在 auth.users 表插入新用户时，
    // 将 user_metadata 中的 username 复制到 public.profiles 表的 username 字段。
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username, // 将 username 存储在 user_metadata 中
        },
        // 设置邮箱确认后的重定向URL
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    setLoading(false); // 结束加载状态

    // 安全日志记录
    if (signUpError) {
      console.error('UserRegistration - 注册失败:', signUpError.message);
    }

    if (signUpError) {
      // 如果注册过程中发生错误，则设置错误信息
      console.error('UserRegistration - Supabase 注册错误:', {
        error: signUpError,
        message: signUpError.message,
        details: signUpError.details,
        hint: signUpError.hint,
        code: signUpError.code
      });
      setError(`注册失败: ${signUpError.message}`); // 将错误信息展示给用户
    } else if (data.user) {
      // 根据 Supabase Auth 的默认行为，新用户注册后需要邮箱验证
      // data.user.identities 通常会指示用户是否已确认邮箱 (is_confirmed_at)
      // 但 signUp 本身可能不直接返回这个最新状态，而是发送确认邮件
      if (data.user.identities && data.user.identities.length > 0 && !data.user.identities[0].identity_data?.email_verified) {
         // Supabase v2.x.x `data.user.identities[0].identity_data.email_verified` may not exist or be reliable here.
         // The key indicator is if `data.session` is null and `data.user` exists, it usually means confirmation is required.
         // Or more reliably, if `data.user.aud === 'authenticated'` but `data.session` is null.
         // For Supabase Auth, if "Confirm email" is enabled in your Supabase project settings (which is the default),
         // a confirmation email will be sent.
        setMessage("注册请求已发送！请检查您的邮箱，点击确认链接以完成注册。");
      } else if (data.session) {
        // 如果 Supabase 项目禁用了邮件确认，或者用户通过其他方式已确认，则会直接返回 session
        setMessage("注册成功并已登录！");
        // 此处可以添加进一步操作，例如页面跳转或更新全局用户状态
      } else {
        // 默认情况下，新用户需要邮箱验证
         setMessage("注册请求已发送！请检查您的邮箱，点击确认链接以完成注册。");
      }
      setUsername(''); // 清空表单
      setEmail('');
      setPassword('');
    } else {
      // 意外情况，没有错误但也没有用户信息
      setError("发生未知错误，请稍后再试。");
    }
  };

  // 定义表单容器的内联样式 (与之前保持一致)
  const formContainerStyle = {
    border: '1px solid var(--border-color)', padding: '25px', margin: '30px auto',
    borderRadius: '8px', maxWidth: '450px', backgroundColor: 'var(--bg-color)', boxShadow: 'var(--box-shadow)'
  };
  const formTitleStyle = { textAlign: 'center', marginBottom: '25px', color: 'var(--heading-color)', fontSize: '1.5em' };
  const formGroupStyle = { marginBottom: '20px' };
  const labelStyle = { display: 'block', marginBottom: '8px', color: 'rgb(var(--gray-dark))', fontWeight: 'bold' };
  const inputStyle = { width: '100%', padding: '12px', boxSizing: 'border-box', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '1rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' };
  const buttonStyle = {
    width: '100%', padding: '12px', backgroundColor: loading ? 'var(--gray)' : 'var(--accent, #2337ff)', // 加载时按钮变灰
    color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', // 加载时禁用鼠标指针
    fontSize: '1rem', fontWeight: 'bold'
  };
  const errorStyle = { color: 'red', marginBottom: '15px', textAlign: 'center' }; // 错误信息样式
  const messageStyle = { color: 'green', marginBottom: '15px', textAlign: 'center' }; // 成功/提示信息样式

  // 定义UI文本 (中文)
  const formTitleText = "用户注册";
  const usernameLabelText = "用户名";
  const emailLabelText = "邮箱地址";
  const passwordLabelText = "密码";
  const registerButtonText = "注册";
  const loadingButtonText = "注册中..."; // 按钮加载状态文本

  return (
    <div style={formContainerStyle}>
      <h3 style={formTitleStyle}>{formTitleText}</h3>

      {/* 访客模式提示 (S05 修复) */}
      {!isSupabaseConfigured && (
        <div style={{ padding: '10px 15px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
          ⚠️ 后端认证服务未配置，注册功能暂不可用（访客只读模式）。
        </div>
      )}

      {/* 显示错误信息 */}
      {error && <p style={errorStyle}>{error}</p>}
      {/* 显示成功/提示信息 */}
      {message && <p style={messageStyle}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle}>
          <label htmlFor="reg-username" style={labelStyle}>{usernameLabelText}</label>
          <input type="text" id="reg-username" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} disabled={loading || !isSupabaseConfigured} />
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="reg-email" style={labelStyle}>{emailLabelText}</label>
          <input type="email" id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} disabled={loading || !isSupabaseConfigured} />
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="reg-password" style={labelStyle}>{passwordLabelText}</label>
          <input type="password" id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} disabled={loading || !isSupabaseConfigured} />
        </div>
        <button
          type="submit"
          style={{
            ...buttonStyle,
            backgroundColor: (!isSupabaseConfigured || loading) ? 'var(--gray)' : buttonStyle.backgroundColor,
            cursor: (!isSupabaseConfigured || loading) ? 'not-allowed' : 'pointer'
          }}
          onMouseOver={(e) => { if (!loading && isSupabaseConfigured) e.currentTarget.style.backgroundColor = 'var(--accent-dark)'; }}
          onMouseOut={(e) => { if (!loading && isSupabaseConfigured) e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
          disabled={loading || !isSupabaseConfigured} // 加载或未配置时禁用按钮
        >
          {loading ? loadingButtonText : registerButtonText} {/* 根据加载状态显示不同文本 */}
        </button>
      </form>
    </div>
  );
};

export default UserRegistration;
