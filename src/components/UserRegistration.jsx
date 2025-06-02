import React, { useState } from 'react';

const UserRegistration = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration submitted:', { username, email, password });
    alert('Registration successful! (Mocked)');
  };

  const formContainerStyle = {
    border: '1px solid var(--gray-light, #e5e9f0)', // Use CSS variable
    padding: '25px',
    margin: '30px auto',
    borderRadius: '8px',
    maxWidth: '450px',
    backgroundColor: '#fff', // White background for the form
    boxShadow: 'var(--box-shadow)'
  };

  const formTitleStyle = {
    textAlign: 'center',
    marginBottom: '25px',
    color: 'rgb(var(--black))', // Use CSS variable
    fontSize: '1.5em' // h4 equivalent
  };

  const formGroupStyle = {
    marginBottom: '20px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: 'rgb(var(--gray-dark))', // Use CSS variable
    fontWeight: 'bold'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    boxSizing: 'border-box',
    border: '1px solid rgb(var(--gray-light))', // Use CSS variable
    borderRadius: '4px',
    fontSize: '1rem' // Consistent font size
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--accent, #2337ff)', // Use CSS variable
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold'
  };

  return (
    <div style={formContainerStyle}>
      <h3 style={formTitleStyle}>Register</h3>
      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle}>
          <label htmlFor="reg-username" style={labelStyle}>Username</label>
          <input
            type="text"
            id="reg-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="reg-email" style={labelStyle}>Email</label>
          <input
            type="email"
            id="reg-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={formGroupStyle}>
          <label htmlFor="reg-password" style={labelStyle}>Password</label>
          <input
            type="password"
            id="reg-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <button type="submit" style={buttonStyle} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-dark)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}>
          Register
        </button>
      </form>
    </div>
  );
};

export default UserRegistration;
