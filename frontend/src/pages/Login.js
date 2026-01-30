import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiUser, FiLock, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { login, register } from '../services/api';
import { colors, styles, mergeStyles } from '../styles';

function Login({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

   useEffect(() => {
  const handleResize = () => setWindowWidth(window.innerWidth);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    try {
      if (isLogin) {
        const response = await login(username, password);
        const token = response.data.access_token;
        localStorage.setItem('token', token);
        setToken(token);
        toast.success('🎉 Login successful!');
        navigate('/dashboard');
      } else {
        await register(username, password);
        toast.success('✅ Registration successful! Please login.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

 

  return (
    <div style={{
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.info} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: windowWidth < 768 ? '1rem' : '2rem',  // Changed
  }}>
    <div style={{
      ...styles.card.base,
      width: '100%',
      maxWidth: '420px',
      boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04)',
      padding: windowWidth < 768 ? '1.5rem' : '2rem',  // Add responsive padding
    }}>
        {/* Logo/Header */}
<div style={{ textAlign: 'center', marginBottom: windowWidth < 768 ? '1.5rem' : '2rem' }}>
  <div style={{
    fontSize: windowWidth < 768 ? '2.5rem' : '3rem',  // Smaller on mobile
    marginBottom: '0.5rem',
  }}>📄</div>
  <h2 style={{
    fontSize: windowWidth < 768 ? '1.5rem' : '1.875rem',  // Smaller on mobile
    fontWeight: 'bold',
    color: colors.gray[800],
    marginBottom: '0.5rem',
  }}>
    {isLogin ? 'Welcome Back' : 'Create Account'}
  </h2>
  <p style={{ 
    color: colors.gray[600], 
    fontSize: windowWidth < 768 ? '0.8rem' : '0.875rem',  // Smaller on mobile
  }}>
    {isLogin ? 'Sign in to continue to DocFlow' : 'Sign up to get started'}
  </p>
</div>

        {error && (
          <div style={{
            backgroundColor: colors.dangerLight,
            border: `1px solid ${colors.danger}`,
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username Input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              color: colors.gray[700],
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
            }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <FiUser style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.gray[400],
                fontSize: '1.25rem',
              }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  ...styles.input.base,
                  paddingLeft: '3rem',
                }}
                onFocus={(e) => Object.assign(e.target.style, styles.input.focus)}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.gray[300];
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: colors.gray[700],
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.gray[400],
                fontSize: '1.25rem',
              }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  ...styles.input.base,
                  paddingLeft: '3rem',
                }}
                onFocus={(e) => Object.assign(e.target.style, styles.input.focus)}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.gray[300];
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
  type="submit"
  style={mergeStyles(
    styles.button.base,
    styles.button.primary,
    { 
      width: '100%', 
      justifyContent: 'center', 
      fontSize: windowWidth < 768 ? '0.875rem' : '1rem',  // Smaller on mobile
      padding: windowWidth < 768 ? '0.75rem' : '0.875rem',  // Adjust padding
    }
  )}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.button.primaryHover)}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = colors.primary;
              e.target.style.transform = 'none';
              e.target.style.boxShadow = 'none';
            }}
          >
            {isLogin ? <FiLogIn /> : <FiUserPlus />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        
        <div className="bg-blue-500 text-white p-4">
  Tailwind Test
</div>
        {/* Toggle Login/Register */}
        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          paddingTop: '1.5rem',
          borderTop: `1px solid ${colors.gray[200]}`,
        }}>
          <p style={{ color: colors.gray[600], fontSize: '0.875rem' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={{
                color: colors.primary,
                fontWeight: '600',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;