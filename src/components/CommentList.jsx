import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import CommentItem from './CommentItem.jsx';

// CommentList 组件：用于显示特定文章的评论列表
// Props:
// - postSlug: String, 当前文章的 slug，用于获取对应的评论
// - refreshKey: any (optional), 当此 prop 改变时，会触发评论的重新加载
const CommentList = ({ postSlug, refreshKey }) => {
  console.log("CommentList.jsx: 组件已加载，Props:", { postSlug, refreshKey });

  // State: fetchedComments 用于存储从数据库获取的评论
  const [fetchedComments, setFetchedComments] = useState([]);
  // State: loading 用于处理评论加载状态
  const [loading, setLoading] = useState(true);
  // State: error 用于显示加载过程中的错误信息
  const [error, setError] = useState('');
  // State: refreshing 用于显示刷新状态
  const [refreshing, setRefreshing] = useState(false);

  // 定义获取评论的函数，使用 useCallback 优化
  const fetchComments = useCallback(async () => {
    console.log(`CommentList.jsx - fetchComments: 正在为 postSlug '${postSlug}' 获取评论 (refreshKey: ${refreshKey})`);

    if (!postSlug) {
      console.log("CommentList.jsx - fetchComments: postSlug 为空，不获取评论。");
      setFetchedComments([]);
      setLoading(false);
      return;
    }

    // 如果是刷新（refreshKey > 0），则显示刷新状态而不是加载状态
    if (refreshKey > 0) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      // 从 'comments' 表中选择所有字段，包括新增的字段，并关联查询 'profiles' 表
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
        .order('floor_number', { ascending: true }); // 按楼层号排序

      if (fetchError) {
        console.error("CommentList.jsx - fetchComments: 获取评论数据库错误:", fetchError);
        throw fetchError;
      }

      console.log('CommentList.jsx - fetchComments: 评论获取成功', data);
      setFetchedComments(data || []);
    } catch (err) {
      console.error("CommentList.jsx - fetchComments: 处理获取评论时发生异常:", err);
      setError(`获取评论失败: ${err.message || "未知错误。"}`);
      setFetchedComments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postSlug, refreshKey]);

  // 处理评论更新的回调
  const handleCommentUpdated = useCallback(() => {
    console.log("CommentList.jsx - handleCommentUpdated: 评论已更新，重新获取评论列表");
    fetchComments();
  }, [fetchComments]);

  // 处理评论删除的回调
  const handleCommentDeleted = useCallback((commentId) => {
    console.log("CommentList.jsx - handleCommentDeleted: 评论已删除，ID:", commentId);
    // 从本地状态中移除已删除的评论，避免重新请求
    setFetchedComments(prev => prev.filter(comment => comment.id !== commentId));
  }, []);

  // Effect Hook: 组件挂载后以及 fetchComments 变化时，执行获取评论的逻辑
  useEffect(() => {
    console.log("CommentList.jsx - useEffect: 即将调用 fetchComments，依赖项变化 (postSlug 或 refreshKey)。");
    fetchComments();
  }, [fetchComments]);

  // 样式定义
  const listStyle = {
    marginTop: '20px',
    position: 'relative'
  };

  const headingStyle = {
    marginBottom: '24px',
    color: 'rgb(var(--gray-dark))',
    fontSize: '1.4em',
    fontWeight: '600',
    paddingBottom: '12px',
    borderBottom: '2px solid var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const refreshIndicatorStyle = {
    fontSize: '0.9rem',
    color: 'var(--accent)',
    fontWeight: 'normal',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const noCommentsStyle = {
    marginTop: '40px',
    fontStyle: 'italic',
    color: 'rgb(var(--gray))',
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: 'rgb(var(--gray-light), 0.1)',
    borderRadius: '12px',
    border: '2px dashed rgb(var(--gray-light))'
  };

  // UI 文本
  const commentsHeadingText = "💬 评论列表";
  const noCommentsYetText = "🎯 暂无评论，快来抢沙发吧！";
  const loadingCommentsText = "⏳ 正在加载评论...";
  const refreshingText = "🔄 正在刷新...";

  // 如果正在加载评论，显示加载提示信息
  if (loading) {
    return (
      <div style={listStyle}>
        <h4 style={headingStyle}>{commentsHeadingText}</h4>
        <p style={noCommentsStyle}>{loadingCommentsText}</p>
      </div>
    );
  }

  // 如果加载过程中发生错误，显示错误信息
  if (error) {
    return (
      <div style={listStyle}>
        <h4 style={headingStyle}>{commentsHeadingText}</h4>
        <p style={{ ...noCommentsStyle, color: 'red' }}>{error}</p>
      </div>
    );
  }

  // 如果没有评论，显示"暂无评论"的提示
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
      <h4 style={headingStyle}>
        {commentsHeadingText}
        {refreshing && (
          <span style={refreshIndicatorStyle}>
            <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
            {refreshingText}
          </span>
        )}
      </h4>
      
      {fetchedComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onCommentUpdated={handleCommentUpdated}
          onCommentDeleted={handleCommentDeleted}
        />
      ))}

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

export default CommentList;
