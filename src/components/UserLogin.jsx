import React, { useState } from 'react'; // 导入 React 和 useState hook
import { supabase } from '@/lib/supabaseClient'; // 导入 Supabase 客户端实例

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
      // 此处可以添加进一步操作，例如：
      // 1. 更新全局用户状态 (例如使用 Context API 或 Zustand/Nano Stores)
      // 2. 将用户重定向到个人资料页或首页: window.location.href = '/profile';
      // 3. 如果需要，可以在这里存储 session 信息 (Supabase JS 客户端会自动处理 session 持久化)
      console.log('登录成功，用户信息:', data.user);
      console.log('登录成功，会话信息:', data.session);
      // 触发一个自定义事件，以便其他部分（如 Header）可以监听到登录状态的改变
      // 这是一种简单的跨组件通信方式，更复杂的场景可能需要状态管理器
      const event = new CustomEvent('authChange', { detail: { loggedIn: true, user: data.user, session: data.session } });
      window.dispatchEvent(event);

    } else {
      // 意外情况
      setError("发生未知错误或登录失败，请检查您的凭据或稍后再试。");
    }
  };

  // 定义表单容器的内联样式 (与 UserRegistration 保持一致)
  const formContainerStyle = {
    border: '1px solid var(--gray-light, #e5e9f0)', padding: '25px', margin: '30px auto',
    borderRadius: '8px', maxWidth: '450px', backgroundColor: '#fff', boxShadow: 'var(--box-shadow)'
  };
  const formTitleStyle = { textAlign: 'center', marginBottom: '25px', color: 'rgb(var(--black))', fontSize: '1.5em' };
  const formGroupStyle = { marginBottom: '20px' };
  const labelStyle = { display: 'block', marginBottom: '8px', color: 'rgb(var(--gray-dark))', fontWeight: 'bold' };
  const inputStyle = { width: '100%', padding: '12px', boxSizing: 'border-box', border: '1px solid rgb(var(--gray-light))', borderRadius: '4px', fontSize: '1rem' };
  const buttonStyle = {
    width: '100%', padding: '12px', backgroundColor: loading ? 'var(--gray)' : 'var(--accent, #2337ff)',
    color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '1rem', fontWeight: 'bold'
  };
  const errorStyle = { color: 'red', marginBottom: '15px', textAlign: 'center' };
  const messageStyle = { color: 'green', marginBottom: '15px', textAlign: 'center' };
  
  // 定义UI文本 (中文)
  const formTitleText = "用户登录";
  // const usernameLabelText = "用户名"; // 改为邮箱登录
  const emailLabelText = "邮箱地址"; // 新增邮箱标签文本
  const passwordLabelText = "密码";
  const loginButtonText = "登录";
  const loadingButtonText = "登录中..."; // 按钮加载状态文本

  return (
    <div style={formContainerStyle}>
      <h3 style={formTitleStyle}>{formTitleText}</h3>
      {error && <p style={errorStyle}>{error}</p>}
      {message && <p style={messageStyle}>{message}</p>}
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
            disabled={loading}
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
            disabled={loading}
          />
        </div>
        {/* 提交按钮 */}
        <button 
          type="submit" 
          style={buttonStyle}
          onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--accent-dark)'; }} 
          onMouseOut={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
          disabled={loading}
        >
          {loading ? loadingButtonText : loginButtonText}
        </button>
      </form>
    </div>
  );
};

export default UserLogin;
