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
  // State: showSuccess 用于控制成功动画
  const [showSuccess, setShowSuccess] = useState(false);
  // State: isFocused 用于控制文本域焦点状态
  const [isFocused, setIsFocused] = useState(false);

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
      // 详细日志：开始插入评论 (直接数据库方式，不使用 Edge Function)
      console.log("CommentForm.jsx - 开始插入评论 (直接数据库):", {
        postSlug,
        userId: user.id,
        userEmail: user.email,
        contentLength: commentText.trim().length,
        method: "直接数据库插入"
      });

      // 直接使用 Supabase 客户端插入评论到数据库
      // 这是一个简化版本，不使用 Edge Function
      const { data, error: insertError } = await supabase
        .from('comments')
        .insert({
          post_slug: postSlug,
          user_id: user.id,
          content: commentText.trim(),
          ip_address: 'Web Client' // 简化的IP地址标识
        })
        .select()
        .single();

      // 详细日志: 数据库插入完成情况
      console.log("CommentForm.jsx - 数据库插入完成:", {
        success: !insertError,
        error: insertError,
        data: data,
        errorCode: insertError?.code,
        errorMessage: insertError?.message,
        errorDetails: insertError?.details,
        errorHint: insertError?.hint
      });

      // 如果数据库插入返回错误
      if (insertError) {
        // 详细的错误信息
        const errorMsg = `数据库插入失败: ${insertError.message}${insertError.code ? ` (代码: ${insertError.code})` : ''}${insertError.hint ? ` 提示: ${insertError.hint}` : ''}`;
        throw new Error(errorMsg);
      }
      
      // 成功提交评论后的处理
      console.log("CommentForm.jsx - 评论提交成功，数据:", data);

      // 显示成功消息和动画
      setMessage("🎉 评论已成功发表！");
      setShowSuccess(true);
      setCommentText(''); // 清空文本域内容

      // 如果父组件传递了 onCommentSubmitted 回调函数，则调用它
      if (onCommentSubmitted) {
        onCommentSubmitted();
      }

      // 3秒后隐藏成功消息
      setTimeout(() => {
        setMessage('');
        setShowSuccess(false);
      }, 3000);

    } catch (err) {
      // 更新日志: 处理数据库插入时捕获到的异常
      console.error("CommentForm.jsx - handleSubmit: 插入评论到数据库时捕获到异常:", err);
      // 设置对用户友好的错误信息
      setError(`发表评论失败: ${err.message || "未知错误，请稍后再试。"}`);
    } finally {
      setLoading(false); // 无论成功或失败，结束加载状态
    }
  };

  // --- 样式定义 (改进版) ---
  const formStyle = {
    border: '1px solid rgb(var(--gray-light))',
    padding: '24px',
    marginTop: '20px',
    borderRadius: '12px',
    backgroundColor: 'rgb(var(--gray-light), 0.2)',
    boxShadow: '0 4px 6px rgba(var(--black), 0.1)',
    transition: 'all 0.3s ease'
  };

  const headingStyle = {
    marginTop: '0',
    marginBottom: '20px',
    color: 'rgb(var(--gray-dark))',
    fontSize: '1.3em',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const textareaStyle = {
    width: '100%',
    minHeight: '120px',
    padding: '12px',
    boxSizing: 'border-box',
    borderRadius: '8px',
    border: '2px solid rgb(var(--gray-light))',
    fontSize: '1rem',
    lineHeight: '1.6',
    fontFamily: 'inherit',
    resize: 'vertical',
    transition: 'border-color 0.3s ease',
    backgroundColor: 'white'
  };

  const textareaFocusStyle = {
    ...textareaStyle,
    borderColor: 'var(--accent)',
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(var(--accent), 0.1)'
  };

  const buttonStyle = {
    padding: '12px 24px',
    backgroundColor: loading ? '#ccc' : 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    marginTop: '16px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '140px',
    justifyContent: 'center'
  };

  const errorStyle = {
    color: '#dc3545',
    marginBottom: '12px',
    textAlign: 'left',
    padding: '12px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '6px',
    fontSize: '0.9rem'
  };

  const messageStyle = {
    color: '#155724',
    marginBottom: '12px',
    textAlign: 'left',
    padding: '12px',
    backgroundColor: showSuccess ? '#d4edda' : 'transparent',
    border: showSuccess ? '1px solid #c3e6cb' : 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    transform: showSuccess ? 'scale(1.02)' : 'scale(1)',
    transition: 'all 0.3s ease'
  };

  // --- UI 文本 (中文) ---
  const formTitleText = "✍️ 留下评论";
  const textareaPlaceholderText = "分享您的想法和见解...";
  const submitButtonText = "📝 发表评论";
  const loadingButtonText = "⏳ 发表中..."; // 按钮在加载状态时的文本
  const loginToCommentText = "🔐 请登录后发表评论。"; // 用户未登录时的提示
  const loadingAuthText = "⏳ 正在加载用户状态..."; // 认证状态加载中的提示

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
          <div style={{ position: 'relative' }}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={textareaPlaceholderText}
              required // HTML5 内置校验：必填
              style={isFocused ? textareaFocusStyle : textareaStyle}
              disabled={loading} // 评论提交过程中禁用文本域
              maxLength={5000}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              fontSize: '0.85rem',
              color: 'rgb(var(--gray))'
            }}>
              <span>
                {commentText.length > 0 && (
                  <span style={{ color: commentText.length > 4500 ? '#dc3545' : 'rgb(var(--gray))' }}>
                    {commentText.length}/5000 字符
                  </span>
                )}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'rgb(var(--gray-light))' }}>
                支持 Markdown 格式
              </span>
            </div>
          </div>
          {/* 提交按钮 */}
          <button
            type="submit"
            style={{
              ...buttonStyle,
              opacity: (loading || commentText.trim().length === 0) ? 0.6 : 1,
              transform: loading ? 'scale(0.98)' : 'scale(1)'
            }}
            disabled={loading || commentText.trim().length === 0} // 评论提交过程中或内容为空时禁用按钮
          >
            {/* 根据加载状态显示不同的按钮文本 */}
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  animation: 'spin 1s linear infinite',
                  marginRight: '4px'
                }}>⏳</span>
                {loadingButtonText}
              </>
            ) : (
              submitButtonText
            )}
          </button>
        </form>
      ) : (
        // 如果用户未登录，则显示提示信息，要求用户登录
        <p>{loginToCommentText}</p>
      )}

      {/* CSS 动画样式 */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CommentForm; // 导出 CommentForm 组件
