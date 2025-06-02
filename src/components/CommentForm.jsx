import React, { useState } from 'react'; // 导入 React 和 useState hook

// CommentForm 组件：用于用户提交评论
// Props:
// - onCommentSubmit: Function, 评论提交成功时调用的回调函数，接收新评论对象作为参数
const CommentForm = ({ onCommentSubmit }) => {
  // State: commentText 用于存储用户在文本域中输入的评论内容
  const [commentText, setCommentText] = useState('');
  // currentUser: 模拟的当前用户信息。在实际应用中，这会从用户认证状态或 Context API 获取
  const currentUser = { name: '模拟用户' }; // 将 MockUser 改为中文

  // 处理表单提交事件
  const handleSubmit = (e) => {
    e.preventDefault(); // 阻止表单默认提交行为
    // 如果评论内容去除首尾空格后为空，则不执行任何操作
    if (!commentText.trim()) return;

    // 模拟评论提交逻辑
    const newComment = {
      id: Date.now(), // 使用当前时间戳作为简单唯一ID
      author: currentUser.name, // 评论作者 (当前为模拟用户)
      text: commentText, // 评论内容
      ipAddress: '127.0.0.1 (模拟IP)', // IP地址占位符，改为中文
      timestamp: new Date().toISOString(), // 评论时间戳 (ISO格式)
    };
    onCommentSubmit(newComment); // 调用父组件传递的回调函数，传递新评论对象
    setCommentText(''); // 清空文本域内容
    console.log('评论已提交 (模拟):', newComment); // 在控制台输出提交的评论 (中文)
    alert('评论已发表！(模拟)'); // 弹出提示，告知用户评论已发表 (中文)
  };

  // 定义表单容器的内联样式
  const formStyle = {
    border: '1px solid rgb(var(--gray-light))',
    padding: '20px',
    marginTop: '20px',
    borderRadius: '8px',
    backgroundColor: 'rgb(var(--gray-light), 0.3)',
    boxShadow: 'inset 0 1px 3px rgba(var(--black), 0.1)'
  };

  // 定义标题的内联样式
  const headingStyle = {
    marginTop: '0',
    marginBottom: '15px',
    color: 'rgb(var(--gray-dark))',
    fontSize: '1.25em'
  };

  // 定义文本域的内联样式
  const textareaStyle = {
    width: '100%',
    minHeight: '100px',
    padding: '10px',
    boxSizing: 'border-box',
    borderRadius: '4px',
    border: '1px solid rgb(var(--gray))',
    fontSize: '1rem',
    lineHeight: '1.5',
    fontFamily: 'inherit'
  };

  // 定义提交按钮的内联样式
  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    marginTop: '10px'
  };

  // 定义表单标题和占位符的中文文本
  const formTitleText = "留下评论";
  const textareaPlaceholderText = "在这里写下您的评论...";
  const submitButtonText = "发表评论";
  const loginToCommentText = "请登录后发表评论。";


  return (
    // 表单容器 div
    <div style={formStyle}>
      {/* 表单标题 */}
      <h4 style={headingStyle}>{formTitleText}</h4>
      {/* 条件渲染：如果存在当前用户 (currentUser)，则显示评论表单 */}
      {currentUser ? (
        <form onSubmit={handleSubmit}>
          {/* 评论输入文本域 */}
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)} // 内容变化时更新 commentText state
            placeholder={textareaPlaceholderText} // 文本域占位符
            required // 必填项
            style={textareaStyle}
          />
          {/* 提交按钮 */}
          <button
            type="submit"
            style={buttonStyle}
            // 鼠标悬停和移开时的背景色变化效果
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-dark)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
          >
            {submitButtonText}
          </button>
        </form>
      ) : (
        // 如果没有当前用户，则显示提示信息，要求用户登录
        <p>{loginToCommentText}</p>
      )}
    </div>
  );
};

export default CommentForm; // 导出 CommentForm 组件
