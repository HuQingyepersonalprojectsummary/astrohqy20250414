import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabaseClient';

// CommentItem 组件：显示单个评论及其操作
// Props:
// - comment: Object, 评论数据对象
// - onCommentUpdated: Function, 评论更新后的回调
// - comment: Object, 评论数据对象
// - initialIsLiked: Boolean, 当前用户是否已对该评论点赞 (来自父组件批量查询，避免 N+1)
// - onCommentUpdated: Function, 评论更新后的回调
// - onCommentDeleted: Function, 评论删除后的回调
const CommentItem = ({ comment, initialIsLiked = false, onCommentUpdated, onCommentDeleted, onLikeToggled }) => {
  const { user } = useStore(authStore);
  
  // 状态管理
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiked, setIsLiked] = useState(Boolean(initialIsLiked));
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [loading, setLoading] = useState(false);

  // 同步点赞状态 (当账号切换、退出或父组件批量数据更新时同步，解决 A10)
  useEffect(() => {
    if (!user) {
      setIsLiked(false);
    } else {
      setIsLiked(Boolean(initialIsLiked));
    }
  }, [initialIsLiked, user]);

  // 同步点赞计数字段
  useEffect(() => {
    setLikesCount(comment.likes_count || 0);
  }, [comment.likes_count]);

  // 同步编辑内容
  useEffect(() => {
    setEditContent(comment.content);
  }, [comment.content]);

  // 检查当前用户是否是评论作者
  const isAuthor = user && user.id === comment.user_id;

  // 确定作者名称和头像
  const authorName = comment.profiles?.username || '匿名用户';
  const avatarUrl = comment.profiles?.avatar_url;

  // 点赞/取消点赞 (S07 修复：绑定操作账号 ID，防御切号后迟到的响应污染状态)
  const handleLike = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }

    const actionUserId = user.id;
    setLoading(true);
    try {
      if (isLiked) {
        // 取消点赞
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', actionUserId);

        // 异步响应返回后，必须校验当前登录账号是否仍是发起操作的账号
        if (authStore.get().user?.id !== actionUserId) {
          return;
        }

        if (!error) {
          setIsLiked(false);
          const newCount = Math.max(0, likesCount - 1);
          setLikesCount(newCount);
          onLikeToggled && onLikeToggled(comment.id, false, newCount, actionUserId);
        } else {
          console.error('取消点赞失败:', error.message);
        }
      } else {
        // 点赞
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: comment.id,
            user_id: actionUserId
          });

        if (authStore.get().user?.id !== actionUserId) {
          return;
        }

        if (!error) {
          setIsLiked(true);
          const newCount = likesCount + 1;
          setLikesCount(newCount);
          onLikeToggled && onLikeToggled(comment.id, true, newCount, actionUserId);
        } else {
          console.error('点赞失败:', error.message);
        }
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除评论
  const handleDelete = async () => {
    if (!isAuthor) return;
    
    if (!confirm('确定要删除这条评论吗？此操作不可撤销。')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);

      if (!error) {
        onCommentDeleted && onCommentDeleted(comment.id);
      } else {
        alert('删除失败，请稍后再试');
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      alert('删除失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 保存编辑 (S08 修复：基于 updated_at 的乐观并发锁，防静默覆盖)
  const handleSaveEdit = async () => {
    if (!isAuthor || editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      // 更新评论内容并校验 updated_at 版本，防止并发编辑时相互覆盖
      const { data, error } = await supabase
        .from('comments')
        .update({
          content: editContent.trim()
        })
        .eq('id', comment.id)
        .eq('updated_at', comment.updated_at)
        .select('id, content, updated_at');

      if (error) {
        console.error('更新评论内容失败:', error.message);
        alert('编辑失败，请稍后再试');
        return;
      }

      // 如果返回空集合，说明该评论已在其他客户端或窗口被更新过
      if (!data || data.length === 0) {
        alert('该评论已被他人或在其他窗口中更新，请刷新页面查看最新内容后再尝试保存。');
        setIsEditing(false);
        onCommentUpdated && onCommentUpdated();
        return;
      }

      setIsEditing(false);
      onCommentUpdated && onCommentUpdated();
    } catch (error) {
      console.error('编辑评论失败:', error);
      alert('编辑失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  // 样式定义
  const commentItemStyle = {
    border: '1px solid rgb(var(--gray-light))',
    padding: '20px',
    marginBottom: '16px',
    borderRadius: '12px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(var(--black), 0.08)',
    transition: 'all 0.3s ease',
    position: 'relative'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  };

  const authorInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const avatarStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid rgb(var(--gray-light))',
    objectFit: 'cover'
  };

  const defaultAvatarStyle = {
    ...avatarStyle,
    backgroundColor: '#6366f1',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600'
  };

  const authorNameStyle = {
    fontWeight: '600',
    color: 'rgb(var(--gray-dark))',
    fontSize: '1.05rem'
  };

  const floorStyle = {
    backgroundColor: 'var(--accent)',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '500'
  };

  const contentStyle = {
    margin: '12px 0',
    lineHeight: '1.7',
    fontSize: '1rem',
    color: 'rgb(var(--gray-dark))',
    whiteSpace: 'pre-wrap'
  };

  const editTextareaStyle = {
    width: '100%',
    minHeight: '80px',
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid var(--accent)',
    fontSize: '1rem',
    lineHeight: '1.6',
    fontFamily: 'inherit',
    resize: 'vertical'
  };

  const footerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgb(var(--gray-light))'
  };

  const timeStyle = {
    fontSize: '0.85rem',
    color: 'rgb(var(--gray))',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const actionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const buttonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const likeButtonStyle = {
    ...buttonStyle,
    color: isLiked ? '#e11d48' : 'rgb(var(--gray))',
    backgroundColor: isLiked ? '#fef2f2' : 'transparent'
  };

  const editButtonStyle = {
    ...buttonStyle,
    color: 'rgb(var(--gray))',
    backgroundColor: 'transparent'
  };

  const deleteButtonStyle = {
    ...buttonStyle,
    color: '#dc2626',
    backgroundColor: 'transparent'
  };

  return (
    <div 
      style={commentItemStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(var(--black), 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(var(--black), 0.08)';
      }}
    >
      {/* 评论头部 */}
      <div style={headerStyle}>
        <div style={authorInfoStyle}>
          {/* 头像 */}
          {avatarUrl ? (
            <img src={avatarUrl} alt={`${authorName} 的头像`} style={avatarStyle} />
          ) : (
            <span style={defaultAvatarStyle}>
              {authorName.substring(0,1).toUpperCase()}
            </span>
          )}
          
          {/* 作者信息 */}
          <div>
            <div style={authorNameStyle}>{authorName}</div>
          </div>
        </div>

        {/* 楼层号 */}
        {comment.floor_number && (
          <span style={floorStyle}>#{comment.floor_number}楼</span>
        )}
      </div>

      {/* 评论内容 */}
      {isEditing ? (
        <div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={editTextareaStyle}
            maxLength={5000}
          />
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleSaveEdit}
              disabled={loading}
              style={{
                ...buttonStyle,
                backgroundColor: 'var(--accent)',
                color: 'white'
              }}
            >
              💾 保存
            </button>
            <button 
              onClick={handleCancelEdit}
              style={editButtonStyle}
            >
              ❌ 取消
            </button>
          </div>
        </div>
      ) : (
        <div style={contentStyle}>{comment.content}</div>
      )}

      {/* 评论底部 */}
      <div style={footerStyle}>
        <div style={timeStyle}>
          🕒 {new Date(comment.created_at).toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
          {comment.is_edited && (
            <span style={{ color: 'rgb(var(--gray))', fontSize: '0.8rem' }}>
              (已编辑)
            </span>
          )}
        </div>

        <div style={actionsStyle}>
          {/* 点赞按钮 */}
          <button
            onClick={handleLike}
            disabled={loading}
            style={likeButtonStyle}
            onMouseEnter={(e) => {
              if (!isLiked) e.currentTarget.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              if (!isLiked) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {isLiked ? '❤️' : '🤍'} {likesCount}
          </button>

          {/* 作者操作按钮 */}
          {isAuthor && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                disabled={loading || isEditing}
                style={editButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ✏️ 编辑
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                style={deleteButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                🗑️ 删除
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
