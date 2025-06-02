import React from 'react'; // 导入 React 库

// CommentList 组件：用于显示评论列表
// Props:
// - comments: Array, 包含评论对象的数组。每个评论对象应包含 id, author, text, ipAddress, timestamp 等属性。
const CommentList = ({ comments }) => {
  // 定义列表容器的内联样式
  const listStyle = {
    marginTop: '30px',
  };

  // 定义标题的内联样式
  const headingStyle = {
    marginBottom: '20px',
    color: 'rgb(var(--gray-dark))',
    fontSize: '1.25em',
    paddingBottom: '10px',
    borderBottom: '1px solid rgb(var(--gray-light))'
  };

  // 定义“无评论”提示信息的内联样式
  const noCommentsStyle = {
    marginTop: '20px',
    fontStyle: 'italic',
    color: 'rgb(var(--gray))'
  };

  // 定义单个评论项的内联样式
  const commentItemStyle = {
    border: '1px solid rgb(var(--gray-light))',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(var(--black), 0.05)'
  };

  // 定义评论作者文本的内联样式
  const authorStyle = {
    margin: '0 0 8px 0',
    fontWeight: 'bold',
    color: 'rgb(var(--black))'
  };

  // 定义 IP 地址文本的内联样式
  const ipStyle = {
    fontSize: '0.85em',
    color: 'rgb(var(--gray))',
    marginLeft: '8px'
  };

  // 定义评论内容文本的内联样式
  const textStyle = {
    margin: '0 0 8px 0',
    lineHeight: '1.6'
  };

  // 定义日期文本的内联样式
  const dateStyle = {
    fontSize: '0.85em',
    color: 'rgb(var(--gray))'
  };

  // 定义用户可见的中文文本
  const commentsHeadingText = "评论"; // 评论区标题
  const noCommentsYetText = "暂无评论，快来抢沙发吧！"; // 没有评论时的提示信息
  const ipLabelText = "IP地址"; // IP 地址标签

  // 如果没有评论或者评论数组为空，则显示提示信息
  if (!comments || comments.length === 0) {
    return <p style={noCommentsStyle}>{noCommentsYetText}</p>;
  }

  // 如果有评论，则渲染评论列表
  return (
    // 评论列表的根 div
    <div style={listStyle}>
      {/* 评论区标题 */}
      <h4 style={headingStyle}>{commentsHeadingText}</h4>
      {/* 遍历 comments 数组，为每条评论渲染一个 div */}
      {comments.map((comment) => (
        <div key={comment.id} style={commentItemStyle}>
          {/* 评论作者和 IP 地址 */}
          <p style={authorStyle}>
            {comment.author} <span style={ipStyle}>({ipLabelText}: {comment.ipAddress})</span>
          </p>
          {/* 评论内容 */}
          <p style={textStyle}>{comment.text}</p>
          {/* 评论时间戳，格式化为本地可读字符串 */}
          <small style={dateStyle}>{new Date(comment.timestamp).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
};

export default CommentList; // 导出 CommentList 组件
