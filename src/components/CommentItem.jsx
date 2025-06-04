import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabaseClient';

// CommentItem 组件：显示单个评论及其操作
// Props:
// - comment: Object, 评论数据对象
// - onCommentUpdated: Function, 评论更新后的回调
// - onCommentDeleted: Function, 评论删除后的回调
const CommentItem = ({ comment, onCommentUpdated, onCommentDeleted }) => {
  const { user } = useStore(authStore);
  
  // 状态管理
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [loading, setLoading] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);

  // 检查用户是否已点赞
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('comment_likes')
          .select('id')
          .eq('comment_id', comment.id)
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setIsLiked(true);
        }
      } catch (error) {
        // 用户未点赞，忽略错误
      }
    };

    checkIfLiked();
  }, [user, comment.id]);

  // 检查当前用户是否是评论作者
  const isAuthor = user && user.id === comment.user_id;

  // 确定作者名称和头像
  const authorName = comment.profiles?.username || '匿名用户';
  const avatarUrl = comment.profiles?.avatar_url;

  // 点赞/取消点赞
  const handleLike = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }

    setLoading(true);
    try {
      if (isLiked) {
        // 取消点赞
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id);

        if (!error) {
          setIsLiked(false);
          setLikesCount(prev => prev - 1);
        }
      } else {
        // 点赞
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: comment.id,
            user_id: user.id
          });

        if (!error) {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
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

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!isAuthor || editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      // 保存编辑历史
      await supabase
        .from('comment_edit_history')
        .insert({
          comment_id: comment.id,
          old_content: comment.content,
          edited_by: user.id
        });

      // 更新评论内容
      const { error } = await supabase
        .from('comments')
        .update({
          content: editContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', comment.id);

      if (!error) {
        setIsEditing(false);
        onCommentUpdated && onCommentUpdated();
      } else {
        alert('编辑失败，请稍后再试');
      }
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
            {comment.ip_address && comment.ip_address !== 'IP地址获取失败' && (
              <div style={{ fontSize: '0.8rem', color: 'rgb(var(--gray))' }}>
                IP: {comment.ip_address}
              </div>
            )}
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
