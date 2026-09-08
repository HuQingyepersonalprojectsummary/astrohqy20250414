import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import CommentItem from './CommentItem.jsx';

const PAGE_SIZE = 20;

// 切号、换文章或刷新会创建全新的列表；旧组件的请求与写入回调不能修改它。
const CommentList = ({ postSlug, refreshKey = 0 }) => {
  const { user } = useStore(authStore);
  const userId = user?.id ?? null;
  return <CommentListPage key={JSON.stringify([postSlug, refreshKey, userId])}
    postSlug={postSlug} userId={userId} />;
};

const CommentListPage = ({ postSlug, userId }) => {
  const [fetchedComments, setFetchedComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState(new Set());
  const request = useRef({ generation: 0, controller: null, active: false, busy: false });
  const cursor = useRef(null);

  const fetchComments = useCallback(async (isLoadMore = false) => {
    const state = request.current;
    if (!state.active || (isLoadMore && state.busy)) return;
    state.controller?.abort();
    const generation = ++state.generation;
    const controller = new AbortController();
    state.controller = controller;
    state.busy = true;
    const isCurrent = () => state.active && generation === state.generation &&
      !controller.signal.aborted && (authStore.get().user?.id ?? null) === userId;

    if (!postSlug || !isSupabaseConfigured) {
      setFetchedComments([]);
      setLikedCommentIds(new Set());
      setHasMore(false);
      setLoading(false);
      state.busy = false;
      return;
    }
    if (isLoadMore) setLoadingMore(true);
    else {
      setLoading(true);
      setRefreshing(true);
    }
    setError('');

    try {
      let query = supabase.from('comments').select(`
        id, post_slug, user_id, content, likes_count, is_edited,
        floor_number, created_at, updated_at, profiles (username, avatar_url)
      `).eq('post_slug', postSlug)
        .order('floor_number', { ascending: true }).limit(PAGE_SIZE)
        .abortSignal(controller.signal);
      if (isLoadMore && cursor.current !== null) query = query.gt('floor_number', cursor.current);
      const { data, error: fetchError } = await query;
      if (!isCurrent()) return;
      if (fetchError) throw fetchError;
      const newComments = data || [];

      // 每次最多查询一页；点赞状态返回后再显示该页，避免按未知状态发起写入。
      let newLikedSet = new Set();
      if (userId && newComments.length) {
        const { data: likesData, error: likesError } = await supabase.from('comment_likes')
          .select('comment_id').in('comment_id', newComments.map(c => c.id))
          .eq('user_id', userId).abortSignal(controller.signal);
        if (!isCurrent()) return;
        if (likesError) throw likesError;
        newLikedSet = new Set((likesData || []).map(item => item.comment_id));
      }
      if (!isCurrent()) return;
      setFetchedComments(prev => isLoadMore ? [...prev, ...newComments] : newComments);
      setLikedCommentIds(prev => isLoadMore ? new Set([...prev, ...newLikedSet]) : newLikedSet);
      setHasMore(newComments.length === PAGE_SIZE);
      cursor.current = newComments.at(-1)?.floor_number ?? (isLoadMore ? cursor.current : null);
    } catch (err) {
      if (isCurrent()) setError(`获取评论失败: ${err.message || '未知错误'}`);
    } finally {
      if (isCurrent()) {
        state.busy = false;
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, [postSlug, userId]);

  useEffect(() => {
    request.current.active = true;
    fetchComments(false);
    return () => {
      request.current.active = false;
      request.current.generation++;
      request.current.controller?.abort();
    };
  }, [fetchComments]);

  const handleCommentUpdated = useCallback(() => fetchComments(false), [fetchComments]);
  const handleCommentDeleted = useCallback(() => fetchComments(false), [fetchComments]);

  const handleLikeToggled = useCallback((commentId, isLiked, newCount, actionUserId) => {
    if (!request.current.active || actionUserId !== userId ||
        authStore.get().user?.id !== actionUserId) return;
    setLikedCommentIds(prev => {
      const next = new Set(prev);
      if (isLiked) next.add(commentId);
      else next.delete(commentId);
      return next;
    });
    setFetchedComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: newCount } : c));
  }, [userId]);

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

  const loadMoreBtnStyle = {
    display: 'block',
    width: '100%',
    padding: '12px',
    marginTop: '20px',
    backgroundColor: '#fff',
    border: '1px solid var(--accent)',
    borderRadius: '8px',
    color: 'var(--accent)',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: loadingMore ? 'not-allowed' : 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease'
  };

  // UI 文本
  const commentsHeadingText = "💬 评论列表";
  const noCommentsYetText = "🎯 暂无评论，快来抢沙发吧！";
  const loadingCommentsText = "⏳ 正在加载评论...";
  const refreshingText = "🔄 正在刷新...";

  // 访客模式未配置提示
  if (!isSupabaseConfigured) {
    return (
      <div style={listStyle}>
        <h4 style={headingStyle}>{commentsHeadingText}</h4>
        <div style={{ padding: '20px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '8px', textAlign: 'center', margin: '20px 0' }}>
          💬 后端评论服务未配置，当前处于访客只读模式（暂无评论内容展示）。
        </div>
      </div>
    );
  }

  // 如果正在加载首屏评论，显示加载提示信息
  if (loading) {
    return (
      <div style={listStyle}>
        <h4 style={headingStyle}>{commentsHeadingText}</h4>
        <p style={noCommentsStyle}>{loadingCommentsText}</p>
      </div>
    );
  }

  // 如果加载过程中发生错误，显示错误信息
  if (error && fetchedComments.length === 0) {
    return (
      <div style={listStyle}>
        <h4 style={headingStyle}>{commentsHeadingText}</h4>
        <p style={{ ...noCommentsStyle, color: 'red' }}>{error}</p>
        <button type="button" onClick={() => fetchComments(false)}>重试加载评论</button>
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

  // 如果有评论，则渲染评论列表及分页加载入口
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
          initialIsLiked={likedCommentIds.has(comment.id)}
          onCommentUpdated={handleCommentUpdated}
          onCommentDeleted={handleCommentDeleted}
          onLikeToggled={handleLikeToggled}
        />
      ))}

      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
      {hasMore && (
        <button
          type="button"
          style={loadMoreBtnStyle}
          onClick={() => fetchComments(true)}
          disabled={loadingMore}
        >
          {loadingMore ? '⏳ 正在加载更多评论...' : '📥 加载更多评论'}
        </button>
      )}

      {/* CSS 动画样式 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CommentList;
