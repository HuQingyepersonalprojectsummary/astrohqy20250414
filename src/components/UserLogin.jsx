import React, { useState } from 'react';

const UserLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', { username, password });
    alert('Login successful! (Mocked)');
  };

  // Re-using styles defined in UserRegistration or similar global scope if preferred
  const formContainerStyle = {
    border: '1px solid var(--gray-light, #e5e9f0)',
    padding: '25px',
    margin: '30px auto',
    borderRadius: '8px',
    maxWidth: '450px',
    backgroundColor: '#fff',
    boxShadow: 'var(--box-shadow)'
  };

  const formTitleStyle = {
    textAlign: 'center',
    marginBottom: '25px',
    color: 'rgb(var(--black))',
    fontSize: '1.5em'
  };

  const formGroupStyle = {
    marginBottom: '20px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: 'rgb(var(--gray-dark))',
    fontWeight: 'bold'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    boxSizing: 'border-box',
    border: '1px solid rgb(var(--gray-light))',
    borderRadius: '4px',
    fontSize: '1rem'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--accent, #2337ff)', // Using accent color, can be different e.g. green
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold'
    // Consider a different color for login button if desired, e.g. '#28a745'
  };


  return (
    <div style={formContainerStyle}>
      <h3 style={formTitleStyle}>Login</h3>
      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle}>
          <label htmlFor="login-username" style={labelStyle}>Username</label>
          <input
            type="text"
            id="login-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="login-password" style={labelStyle}>Password</label>
          <input
            type="password"
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <button type="submit" style={buttonStyle} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-dark)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}>
          Login
        </button>
      </form>
    </div>
  );
};

export default UserLogin;
