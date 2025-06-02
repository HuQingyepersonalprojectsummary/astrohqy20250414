import React, { useState, useEffect, useCallback } from 'react'; // 导入 React hooks
import { supabase } from '../../lib/supabaseClient'; // 导入 Supabase 客户端

// CommentList 组件：用于显示特定文章的评论列表
// Props:
// - postSlug: String, 当前文章的 slug，用于获取对应的评论
// - refreshKey: any (optional), 当此 prop 改变时，会触发评论的重新加载。用于从外部强制刷新。
const CommentList = ({ postSlug, refreshKey }) => {
  // State: fetchedComments 用于存储从数据库获取的评论
  const [fetchedComments, setFetchedComments] = useState([]);
  // State: loading 用于处理评论加载状态
  const [loading, setLoading] = useState(true);
  // State: error 用于显示加载过程中的错误信息
  const [error, setError] = useState('');

  // 定义获取评论的函数，使用 useCallback 优化，仅当 postSlug 改变时重新创建此函数
  const fetchComments = useCallback(async () => {
    // 如果 postSlug 不存在，则不执行获取操作，并清空评论、停止加载
    if (!postSlug) {
      setFetchedComments([]);
      setLoading(false);
      return;
    }

    console.log(`CommentList: 正在为博文 ${postSlug} 获取评论...`); // 日志：开始获取评论
    setLoading(true); // 开始加载状态
    setError('');     // 清空之前的错误信息

    try {
      // 从 'comments' 表中选择所有字段 (*),
      // 并通过外键关联查询 'profiles' 表中的 'username' 和 'avatar_url' 字段。
      // Supabase 会自动处理这种嵌套查询。
      // - eq('post_slug', postSlug): 筛选出与当前文章 slug 匹配的评论
      // - order('created_at', { ascending: false }): 按创建时间降序排列 (最新评论在前)
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('post_slug', postSlug)
        .order('created_at', { ascending: false });

      // 如果获取过程中发生错误
      if (fetchError) {
        throw fetchError; // 抛出错误，由下面的 catch 块统一处理
      }

      console.log('CommentList: 评论获取成功:', data); // 日志：评论获取成功
      setFetchedComments(data || []); // 更新 fetchedComments state；如果 data 为 null，则设置为空数组
    } catch (err) {
      // 处理获取评论过程中发生的任何错误
      console.error('CommentList: 获取评论时发生错误:', err.message); // 日志：获取评论错误
      setError(`获取评论失败: ${err.message || "未知错误。"}`); // 设置对用户友好的错误信息
      setFetchedComments([]); // 出错时清空评论列表
    } finally {
      setLoading(false); // 无论成功或失败，结束加载状态
    }
  }, [postSlug]); // 依赖项数组：当 postSlug 变化时，fetchComments 函数会重新创建

  // Effect Hook:
  // 1. 组件首次挂载后执行 fetchComments。
  // 2. 当 fetchComments 函数 (因 postSlug 变化而重新创建) 或 refreshKey prop 变化时，重新执行 fetchComments。
  useEffect(() => {
    fetchComments();
  }, [fetchComments, refreshKey]);

  // --- 样式定义 (与之前版本或设计稿保持一致) ---
  const listStyle = { marginTop: '30px' };
  const headingStyle = { marginBottom: '20px', color: 'rgb(var(--gray-dark))', fontSize: '1.25em', paddingBottom: '10px', borderBottom: '1px solid rgb(var(--gray-light))' };
  const noCommentsStyle = { marginTop: '20px', fontStyle: 'italic', color: 'rgb(var(--gray))' };
  const commentItemStyle = { border: '1px solid rgb(var(--gray-light))', padding: '15px', marginBottom: '15px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(var(--black), 0.05)' };
  const authorStyle = { margin: '0 0 8px 0', fontWeight: 'bold', color: 'rgb(var(--black))', display: 'flex', alignItems: 'center' };
  const avatarStyle = { width: '32px', height: '32px', borderRadius: '50%', marginRight: '10px', border: '1px solid #eee', objectFit: 'cover' }; // 头像样式，增加 objectFit
  const ipStyle = { fontSize: '0.85em', color: 'rgb(var(--gray))', marginLeft: '8px', fontWeight: 'normal' };
  const textStyle = { margin: '0 0 8px 0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }; // whiteSpace: 'pre-wrap' 用于保留换行符和空格序列
  const dateStyle = { fontSize: '0.85em', color: 'rgb(var(--gray))' };

  // --- UI 文本 (中文) ---
  const commentsHeadingText = "评论区"; // 评论区标题更新
  const noCommentsYetText = "暂无评论，快来抢沙发吧！"; // 没有评论时的提示
  const ipLabelText = "IP"; // IP 地址标签简化
  const loadingCommentsText = "正在加载评论..."; // 评论加载中的提示
  const defaultUsername = "匿名用户"; // 当无法获取用户名时的默认显示

  // 如果正在加载评论，显示加载提示信息
  if (loading) {
    return <div style={listStyle}><p style={noCommentsStyle}>{loadingCommentsText}</p></div>;
  }

  // 如果加载过程中发生错误，显示错误信息
  if (error) {
    return <div style={listStyle}><p style={{ ...noCommentsStyle, color: 'red' }}>{error}</p></div>;
  }

  // 如果没有评论 (获取成功但列表为空)，显示“暂无评论”的提示
  if (!fetchedComments || fetchedComments.length === 0) {
    return (
      <div style={listStyle}>
        <h4 style={headingStyle}>{commentsHeadingText}</h4>
        <p style={noCommentsStyle}>{noCommentsYetText}</p>
      </div>
    );
  }

  // 如果有评论，则渲染评论列表
  return (
    <div style={listStyle}>
      <h4 style={headingStyle}>{commentsHeadingText}</h4>
      {fetchedComments.map((comment) => {
        // 确定作者名称：优先使用 profiles 表中的 username，其次是 comment.author (兼容旧数据)，最后是默认的“匿名用户”
        const authorName = comment.profiles?.username || comment.author || defaultUsername;
        // 获取头像 URL，优先使用 profiles 表中的 avatar_url
        const avatarUrl = comment.profiles?.avatar_url;

        return (
          <div key={comment.id} style={commentItemStyle}>
            <p style={authorStyle}>
              {/* 如果有头像 URL，则显示头像图片 */}
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${authorName} 的头像`} style={avatarStyle} />
              ) : (
                // 如果没有头像 URL，显示一个默认的占位符 (例如，一个灰色圆圈)
                <span style={{...avatarStyle, backgroundColor: '#ccc', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '0.8em'}}>
                  {/* 可以放一个简单的首字母或图标 */}
                  {authorName.substring(0,1)}
                </span>
              )}
              {authorName}
              {/* 条件渲染 IP 地址：仅当 ip_address 存在且不是获取失败的提示时显示 */}
              {comment.ip_address && comment.ip_address !== 'IP地址获取失败' && (
                <span style={ipStyle}>({ipLabelText}: {comment.ip_address})</span>
              )}
            </p>
            {/* 评论内容，使用 comment.content */}
            <p style={textStyle}>{comment.content}</p>
            {/* 评论创建时间，使用 comment.created_at，并格式化为本地可读时间 */}
            <small style={dateStyle}>{new Date(comment.created_at).toLocaleString()}</small>
          </div>
        );
      })}
    </div>
  );
};

export default CommentList; // 导出 CommentList 组件
