import React, { useState } from 'react'; // 导入 React 和 useState hook

// UserLogin 组件：用于用户登录
const UserLogin = () => {
  // State: username, password 分别用于存储用户输入的用户名和密码
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 处理表单提交事件
  const handleSubmit = (e) => {
    e.preventDefault(); // 阻止表单默认提交行为
    // 模拟登录逻辑
    console.log('登录信息已提交 (模拟):', { username, password }); // 控制台输出 (中文)
    alert('登录成功！(模拟)'); // 弹出提示 (中文)
  };

  // 定义表单容器的内联样式
  // 注意：这些样式与 UserRegistration 组件中的样式相似，可以考虑提取到共享的样式文件或对象中
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
    backgroundColor: 'var(--accent, #2337ff)', // 使用主题强调色
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold'
    // 可以考虑为登录按钮使用不同的颜色，例如绿色 '#28a745'
  };

  // 定义UI文本 (中文)
  const formTitleText = "用户登录";
  const usernameLabelText = "用户名";
  const passwordLabelText = "密码";
  const loginButtonText = "登录";

  return (
    // 表单容器 div
    <div style={formContainerStyle}>
      {/* 表单标题 */}
      <h3 style={formTitleStyle}>{formTitleText}</h3>
      {/* 登录表单 */}
      <form onSubmit={handleSubmit}>
        {/* 用户名输入组 */}
        <div style={formGroupStyle}>
          <label htmlFor="login-username" style={labelStyle}>{usernameLabelText}</label>
          <input
            type="text"
            id="login-username" // htmlFor 和 id 匹配
            value={username}
            onChange={(e) => setUsername(e.target.value)} // 内容变化时更新 username state
            required // 必填项
            style={inputStyle}
          />
        </div>
        {/* 密码输入组 */}
        <div style={formGroupStyle}>
          <label htmlFor="login-password" style={labelStyle}>{passwordLabelText}</label>
          <input
            type="password"
            id="login-password"
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
          {loginButtonText}
        </button>
      </form>
    </div>
  );
};

export default UserLogin; // 导出 UserLogin 组件
