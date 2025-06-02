import React, { useState, useEffect } from 'react'; // 导入 React, useState 和 useEffect hook
import { useStore } from '@nanostores/react'; // 导入 useStore hook 用于订阅 Nano Store
import { authStore } from '../../stores/authStore'; // 导入全局认证状态存储
import { supabase } from '../../lib/supabaseClient'; // 导入 Supabase 客户端实例

// CommentForm 组件：用于用户提交评论
// Props:
// - postSlug: String, 当前文章的 slug，用于将评论与文章关联
// - onCommentSubmitted: Function, 评论成功提交后调用的回调函数 (例如，用于触发评论列表刷新)
const CommentForm = ({ postSlug, onCommentSubmitted }) => {
  // 从 authStore 获取当前认证状态 (user 对象和 isLoading 标志)
  // useStore 会使组件在 authStore 状态变化时自动重新渲染
  const { user, isLoading: authIsLoading } = useStore(authStore);

  // State: commentText 用于存储用户在文本域中输入的评论内容
  const [commentText, setCommentText] = useState('');
  // State: loading 用于处理评论提交的加载状态
  const [loading, setLoading] = useState(false);
  // State: error 用于显示提交过程中的错误信息
  const [error, setError] = useState('');
  // State: message 用于显示操作结果信息 (例如提交成功)
  const [message, setMessage] = useState('');

  // 处理表单提交事件 (异步函数)
  const handleSubmit = async (e) => {
    e.preventDefault(); // 阻止表单默认提交行为
    // 如果评论内容去除首尾空格后为空，则设置错误并返回
    if (!commentText.trim()) {
      setError("评论内容不能为空。"); // 错误：评论内容不能为空
      return;
    }
    // 如果用户未登录 (再次检查，尽管UI应该已经阻止了未登录用户看到表单)
    if (!user) {
      setError("请先登录后再发表评论。"); // 错误：请先登录
      return;
    }

    setLoading(true);   // 开始提交加载状态
    setError('');       // 清空之前的错误信息
    setMessage('');     // 清空之前的消息

    try {
      // 调用名为 'submit-comment' 的 Supabase Edge Function
      // Edge Function 应该负责：
      // 1. 验证用户身份 (Supabase 客户端会自动传递 Authorization header)
      // 2. 获取用户 IP 地址 (在 Edge Function 环境中)
      // 3. 将评论内容、postSlug、用户ID、IP地址等存入数据库
      const { data, error: functionError } = await supabase.functions.invoke('submit-comment', {
        body: {
          postSlug: postSlug,     // 当前文章的 slug
          content: commentText    // 评论内容
        },
      });

      // 如果 Edge Function 返回错误
      if (functionError) {
        throw functionError; // 抛出错误，由下面的 catch 块统一处理
      }

      // Edge Function 成功执行后的处理
      console.log('Edge Function "submit-comment" 调用成功:', data); // 日志：Edge Function 调用成功
      setMessage("评论已成功发表！"); // 消息：评论成功发表
      setCommentText(''); // 清空文本域内容

      // 如果父组件传递了 onCommentSubmitted 回调函数，则调用它
      // 这通常用于通知父组件评论列表需要刷新
      if (onCommentSubmitted) {
        onCommentSubmitted();
      }

    } catch (err) {
      // 处理调用 Edge Function 过程中发生的任何错误 (包括网络错误和 functionError)
      console.error('调用 "submit-comment" Edge Function 时发生错误:', err.message); // 日志：Edge Function 调用错误
      // 设置对用户友好的错误信息
      setError(`发表评论失败: ${err.message || "未知错误，请稍后再试。"}`);
    } finally {
      setLoading(false); // 无论成功或失败，结束加载状态
    }
  };

  // 定义表单容器的内联样式
  const formStyle = {
    border: '1px solid rgb(var(--gray-light))', padding: '20px', marginTop: '20px',
    borderRadius: '8px', backgroundColor: 'rgb(var(--gray-light), 0.3)',
    boxShadow: 'inset 0 1px 3px rgba(var(--black), 0.1)'
  };
  // 定义标题的内联样式
  const headingStyle = {
    marginTop: '0', marginBottom: '15px', color: 'rgb(var(--gray-dark))', fontSize: '1.25em'
  };
  // 定义文本域的内联样式
  const textareaStyle = {
    width: '100%', minHeight: '100px', padding: '10px', boxSizing: 'border-box',
    borderRadius: '4px', border: '1px solid rgb(var(--gray))', fontSize: '1rem',
    lineHeight: '1.5', fontFamily: 'inherit'
  };
  // 定义提交按钮的内联样式 (根据加载状态改变背景色和光标)
  const buttonStyle = {
    padding: '10px 20px', backgroundColor: loading ? 'var(--gray)' : 'var(--accent)',
    color: 'white', border: 'none', borderRadius: '4px',
    cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem',
    fontWeight: '500', marginTop: '10px'
  };
  // 定义错误信息段落的样式
  const errorStyle = { color: 'red', marginBottom: '10px', textAlign: 'left' };
  // 定义成功/提示信息段落的样式
  const messageStyle = { color: 'green', marginBottom: '10px', textAlign: 'left' };

  // 定义UI文本 (中文)
  const formTitleText = "留下评论";
  const textareaPlaceholderText = "在这里写下您的评论...";
  const submitButtonText = "发表评论";
  const loadingButtonText = "发表中..."; // 按钮在加载状态时的文本
  const loginToCommentText = "请登录后发表评论。"; // 用户未登录时的提示
  const loadingAuthText = "正在加载用户状态..."; // 认证状态加载中的提示

  // 如果正在加载认证状态 (authIsLoading 来自 authStore)，则显示加载提示
  if (authIsLoading) {
    return <div style={formStyle}><p>{loadingAuthText}</p></div>;
  }

  // 组件的 JSX 渲染输出
  return (
    // 表单容器 div
    <div style={formStyle}>
      {/* 表单标题 */}
      <h4 style={headingStyle}>{formTitleText}</h4>
      {/* 条件渲染：如果用户已登录 (user 对象存在)，则显示评论表单 */}
      {user ? (
        <form onSubmit={handleSubmit}>
          {/* 如果有错误信息，则显示 */}
          {error && <p style={errorStyle}>{error}</p>}
          {/* 如果有成功/提示信息，则显示 */}
          {message && <p style={messageStyle}>{message}</p>}
          {/* 评论输入文本域 */}
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={textareaPlaceholderText}
            required // HTML5 内置校验：必填
            style={textareaStyle}
            disabled={loading} // 评论提交过程中禁用文本域
          />
          {/* 提交按钮 */}
          <button
            type="submit"
            style={buttonStyle}
            // 鼠标悬停和移开时的背景色变化效果 (仅在非加载状态下)
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--accent-dark)'; }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
            disabled={loading} // 评论提交过程中禁用按钮
          >
            {/* 根据加载状态显示不同的按钮文本 */}
            {loading ? loadingButtonText : submitButtonText}
          </button>
        </form>
      ) : (
        // 如果用户未登录，则显示提示信息，要求用户登录
        <p>{loginToCommentText}</p>
      )}
    </div>
  );
};

export default CommentForm; // 导出 CommentForm 组件
