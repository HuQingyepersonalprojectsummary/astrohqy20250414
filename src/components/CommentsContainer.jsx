import React, { useState, useCallback } from 'react';
import CommentList from './CommentList.jsx';
import CommentForm from './CommentForm.jsx';

// CommentsContainer 组件：管理评论列表和评论表单之间的通信
// Props:
// - postSlug: String, 当前文章的 slug
const CommentsContainer = ({ postSlug }) => {
  // State: refreshKey 用于触发 CommentList 的刷新
  const [refreshKey, setRefreshKey] = useState(0);

  // 处理评论提交成功的回调函数
  const handleCommentSubmitted = useCallback(() => {
    console.log("CommentsContainer: 评论提交成功，即将刷新评论列表");
    // 通过改变 refreshKey 来触发 CommentList 重新获取数据
    setRefreshKey(prev => prev + 1);
  }, []);

  // 样式定义
  const containerStyle = {
    marginTop: '40px',
    padding: '20px',
    backgroundColor: 'rgb(var(--gray-light), 0.1)',
    borderRadius: '12px',
    border: '1px solid rgb(var(--gray-light))'
  };

  const sectionTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: 'rgb(var(--gray-dark))',
    marginBottom: '20px',
    textAlign: 'center',
    borderBottom: '2px solid rgb(var(--accent))',
    paddingBottom: '10px'
  };

  return (
    <div style={containerStyle}>
      <h3 style={sectionTitleStyle}>💬 评论区</h3>
      
      {/* 评论列表 */}
      <CommentList 
        postSlug={postSlug} 
        refreshKey={refreshKey}
      />
      
      {/* 评论表单 */}
      <CommentForm 
        postSlug={postSlug} 
        onCommentSubmitted={handleCommentSubmitted}
      />
    </div>
  );
};

export default CommentsContainer;
