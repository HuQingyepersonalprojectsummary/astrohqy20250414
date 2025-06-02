import React, { useState } from 'react';

const CommentForm = ({ onCommentSubmit }) => {
  const [commentText, setCommentText] = useState('');
  const currentUser = { name: 'MockUser' };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now(),
      author: currentUser.name,
      text: commentText,
      ipAddress: '127.0.0.1 (Mock)',
      timestamp: new Date().toISOString(),
    };
    onCommentSubmit(newComment);
    setCommentText('');
    alert('Comment posted! (Mocked)');
  };

  const formStyle = {
    border: '1px solid rgb(var(--gray-light))',
    padding: '20px',
    marginTop: '20px', // Reduced margin from CommentList
    borderRadius: '8px',
    backgroundColor: 'rgb(var(--gray-light), 0.3)', // Slightly off-white background
    boxShadow: 'inset 0 1px 3px rgba(var(--black), 0.1)'
  };

  const headingStyle = {
    marginTop: '0',
    marginBottom: '15px',
    color: 'rgb(var(--gray-dark))',
    fontSize: '1.25em' // h5 equivalent
  };

  const textareaStyle = {
    width: '100%',
    minHeight: '100px',
    padding: '10px',
    boxSizing: 'border-box',
    borderRadius: '4px',
    border: '1px solid rgb(var(--gray))', // Darker border for textarea
    fontSize: '1rem',
    lineHeight: '1.5',
    fontFamily: 'inherit' // Inherit font from body
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    marginTop: '10px'
  };

  return (
    <div style={formStyle}>
      <h4 style={headingStyle}>Leave a Comment</h4>
      {currentUser ? (
        <form onSubmit={handleSubmit}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment here..."
            required
            style={textareaStyle}
          />
          <button type="submit" style={buttonStyle} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-dark)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}>
            Post Comment
          </button>
        </form>
      ) : (
        <p>Please log in to comment.</p>
      )}
    </div>
  );
};

export default CommentForm;
