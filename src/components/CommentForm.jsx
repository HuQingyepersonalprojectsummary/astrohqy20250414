import React, { useState, useEffect } from 'react'; // 导入 React, useState 和 useEffect hook
import { useStore } from '@nanostores/react'; // 导入 useStore hook 用于订阅 Nano Store
import { authStore } from '@/stores/authStore'; // 导入全局认证状态存储
import { supabase } from '@/lib/supabaseClient'; // 导入 Supabase 客户端实例

// CommentForm 组件：用于用户提交评论
// Props:
// - postSlug: String, 当前文章的 slug，用于将评论与文章关联
// - onCommentSubmitted: Function, 评论成功提交后调用的回调函数 (例如，用于触发评论列表刷新)
const CommentForm = ({ postSlug, onCommentSubmitted }) => {
  // 新增日志: 组件加载和 props
  console.log("CommentForm.jsx: 组件已加载，Props:", { postSlug });

  // 从 authStore 获取当前认证状态 (user 对象和 isLoading 标志)
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
    
    // 新增日志: handleSubmit 开始，及用户和内容状态
    console.log("CommentForm.jsx - handleSubmit: 表单提交开始。内容长度:", commentText.trim().length, "用户:", user?.email);

    if (!commentText.trim()) {
      setError("评论内容不能为空。"); // 错误：评论内容不能为空
      return;
    }
    if (!user) { 
      setError("请先登录后再发表评论。"); // 错误：请先登录
      return;
    }

    setLoading(true);   // 开始提交加载状态
    setError('');       // 清空之前的错误信息
    setMessage('');     // 清空之前的消息

    try {
      // 详细日志：开始调用 Edge Function
      console.log("CommentForm.jsx - 开始调用 Edge Function:", {
        postSlug,
        userId: user.id,
        userEmail: user.email,
        contentLength: commentText.trim().length
      });

      // 调用 Supabase Edge Function 'submit-comment' 来提交评论
      // 这个 Edge Function 会处理评论的插入、用户身份验证、IP 地址获取等逻辑
      const { data, error: functionError } = await supabase.functions.invoke('submit-comment', {
        body: {
          postSlug: postSlug,     // 当前文章的 slug
          content: commentText.trim()    // 评论内容
        },
      });

      // 详细日志: Edge Function 调用完成情况
      console.log("CommentForm.jsx - Edge Function 调用完成:", {
        success: !functionError,
        error: functionError,
        data: data,
        errorCode: functionError?.code,
        errorMessage: functionError?.message,
        errorDetails: functionError?.details,
        errorHint: functionError?.hint
      });

      // 如果 Edge Function 返回错误
      if (functionError) {
        // 详细的错误信息
        const errorMsg = `Edge Function 调用失败: ${functionError.message}${functionError.code ? ` (代码: ${functionError.code})` : ''}${functionError.hint ? ` 提示: ${functionError.hint}` : ''}`;
        throw new Error(errorMsg);
      }
      
      // 新增日志: Edge Function 调用成功后的数据 (如果需要更详细，可以保留此行)
      // console.log("CommentForm.jsx - handleSubmit: Edge Function 调用成功，响应数据:", data); 
      setMessage("评论已成功发表！"); // 消息：评论成功发表
      setCommentText(''); // 清空文本域内容
      
      // 如果父组件传递了 onCommentSubmitted 回调函数，则调用它
      if (onCommentSubmitted) {
        onCommentSubmitted(); 
      }

    } catch (err) {
      // 更新日志: 处理数据库插入时捕获到的异常
      console.error("CommentForm.jsx - handleSubmit: 插入评论到数据库时捕获到异常:", err);
      // 设置对用户友好的错误信息
      setError(`发表评论失败: ${err.message || "未知错误，请稍后再试。"}`);
    } finally {
      setLoading(false); // 无论成功或失败，结束加载状态
    }
  };

  // --- 样式定义 (与之前版本或设计稿保持一致) ---
  const formStyle = { border: '1px solid rgb(var(--gray-light))', padding: '20px', marginTop: '20px', borderRadius: '8px', backgroundColor: 'rgb(var(--gray-light), 0.3)', boxShadow: 'inset 0 1px 3px rgba(var(--black), 0.1)'};
  const headingStyle = { marginTop: '0', marginBottom: '15px', color: 'rgb(var(--gray-dark))', fontSize: '1.25em'};
  const textareaStyle = { width: '100%', minHeight: '100px', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid rgb(var(--gray))', fontSize: '1rem', lineHeight: '1.5', fontFamily: 'inherit'};
  const buttonStyle = { padding: '10px 20px', backgroundColor: loading ? 'var(--gray)' : 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '500', marginTop: '10px'};
  const errorStyle = { color: 'red', marginBottom: '10px', textAlign: 'left' };
  const messageStyle = { color: 'green', marginBottom: '10px', textAlign: 'left' };

  // --- UI 文本 (中文) ---
  const formTitleText = "留下评论";
  const textareaPlaceholderText = "在这里写下您的评论...";
  const submitButtonText = "发表评论";
  const loadingButtonText = "发表中..."; // 按钮在加载状态时的文本
  const loginToCommentText = "请登录后发表评论。"; // 用户未登录时的提示
  const loadingAuthText = "正在加载用户状态..."; // 认证状态加载中的提示

  // 新增日志: 检查 authIsLoading
  console.log("CommentForm.jsx: 渲染前检查 authIsLoading:", authIsLoading);
  // 如果正在加载认证状态 (authIsLoading 来自 authStore)，则显示加载提示 (同时显示标题)
  if (authIsLoading) {
    return (
      <div style={formStyle}>
        <h4 style={headingStyle}>{formTitleText}</h4>
        <p>{loadingAuthText}</p>
      </div>
    );
  }

  // 新增日志: 检查用户状态
  console.log("CommentForm.jsx: 渲染前检查用户状态:", user ? user.email : '未登录');
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
