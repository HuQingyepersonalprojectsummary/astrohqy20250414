import React from 'react';

const CommentList = ({ comments }) => {
  const listStyle = {
    marginTop: '30px',
  };

  const headingStyle = {
    marginBottom: '20px',
    color: 'rgb(var(--gray-dark))',
    fontSize: '1.25em', // h5 equivalent
    paddingBottom: '10px',
    borderBottom: '1px solid rgb(var(--gray-light))'
  };

  const noCommentsStyle = {
    marginTop: '20px',
    fontStyle: 'italic',
    color: 'rgb(var(--gray))'
  };

  const commentItemStyle = {
    border: '1px solid rgb(var(--gray-light))',
    padding: '15px',
    marginBottom: '15px',
    borderRadius: '8px',
    backgroundColor: '#fff', // White background for each comment
    boxShadow: '0 1px 3px rgba(var(--black), 0.05)'
  };

  const authorStyle = {
    margin: '0 0 8px 0',
    fontWeight: 'bold',
    color: 'rgb(var(--black))'
  };

  const ipStyle = {
    fontSize: '0.85em',
    color: 'rgb(var(--gray))',
    marginLeft: '8px'
  };

  const textStyle = {
    margin: '0 0 8px 0',
    lineHeight: '1.6'
  };

  const dateStyle = {
    fontSize: '0.85em',
    color: 'rgb(var(--gray))'
  };

  if (!comments || comments.length === 0) {
    return <p style={noCommentsStyle}>No comments yet. Be the first to comment!</p>;
  }

  return (
    <div style={listStyle}>
      <h4 style={headingStyle}>Comments</h4>
      {comments.map((comment) => (
        <div key={comment.id} style={commentItemStyle}>
          <p style={authorStyle}>
            {comment.author} <span style={ipStyle}>(IP: {comment.ipAddress})</span>
          </p>
          <p style={textStyle}>{comment.text}</p>
          <small style={dateStyle}>{new Date(comment.timestamp).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
};

export default CommentList;
