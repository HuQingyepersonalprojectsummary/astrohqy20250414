import React, { useState } from 'react'; // 导入 React 和 useState hook

// UserRegistration 组件：用于用户注册
const UserRegistration = () => {
  // State: username, email, password 分别用于存储用户输入的用户名、邮箱和密码
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 处理表单提交事件
  const handleSubmit = (e) => {
    e.preventDefault(); // 阻止表单默认提交行为
    // 模拟注册逻辑
    console.log('注册信息已提交 (模拟):', { username, email, password }); // 控制台输出 (中文)
    alert('注册成功！(模拟)'); // 弹出提示 (中文)
  };

  // 定义表单容器的内联样式
  const formContainerStyle = {
    border: '1px solid var(--gray-light, #e5e9f0)',
    padding: '25px',
    margin: '30px auto',
    borderRadius: '8px',
    maxWidth: '450px',
    backgroundColor: '#fff',
    boxShadow: 'var(--box-shadow)'
  };

  // 定义表单标题的内联样式
  const formTitleStyle = {
    textAlign: 'center',
    marginBottom: '25px',
    color: 'rgb(var(--black))',
    fontSize: '1.5em'
  };

  // 定义表单组 (label + input) 的内联样式
  const formGroupStyle = {
    marginBottom: '20px'
  };

  // 定义标签 (label) 的内联样式
  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: 'rgb(var(--gray-dark))',
    fontWeight: 'bold'
  };

  // 定义输入框 (input) 的内联样式
  const inputStyle = {
    width: '100%',
    padding: '12px',
    boxSizing: 'border-box',
    border: '1px solid rgb(var(--gray-light))',
    borderRadius: '4px',
    fontSize: '1rem'
  };

  // 定义按钮的内联样式
  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--accent, #2337ff)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold'
  };

  // 定义UI文本 (中文)
  const formTitleText = "用户注册";
  const usernameLabelText = "用户名";
  const emailLabelText = "邮箱地址";
  const passwordLabelText = "密码";
  const registerButtonText = "注册";

  return (
    // 表单容器 div
    <div style={formContainerStyle}>
      {/* 表单标题 */}
      <h3 style={formTitleStyle}>{formTitleText}</h3>
      {/* 注册表单 */}
      <form onSubmit={handleSubmit}>
        {/* 用户名输入组 */}
        <div style={formGroupStyle}>
          <label htmlFor="reg-username" style={labelStyle}>{usernameLabelText}</label>
          <input
            type="text"
            id="reg-username" // htmlFor 和 id 匹配，用于无障碍访问
            value={username}
            onChange={(e) => setUsername(e.target.value)} // 内容变化时更新 username state
            required // 必填项
            style={inputStyle}
          />
        </div>
        {/* 邮箱输入组 */}
        <div style={formGroupStyle}>
          <label htmlFor="reg-email" style={labelStyle}>{emailLabelText}</label>
          <input
            type="email"
            id="reg-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // 内容变化时更新 email state
            required
            style={inputStyle}
          />
        </div>
        {/* 密码输入组 */}
        <div style={formGroupStyle}>
          <label htmlFor="reg-password" style={labelStyle}>{passwordLabelText}</label>
          <input
            type="password"
            id="reg-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // 内容变化时更新 password state
            required
            style={inputStyle}
          />
        </div>
        {/* 提交按钮 */}
        <button
          type="submit"
          style={buttonStyle}
          // 鼠标悬停和移开时的背景色变化效果
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-dark)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
        >
          {registerButtonText}
        </button>
      </form>
    </div>
  );
};

export default UserRegistration; // 导出 UserRegistration 组件
