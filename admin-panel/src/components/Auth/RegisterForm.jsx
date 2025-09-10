import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthForms.css';

const RegisterForm = ({ switchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Call register API but don't automatically log in
      const result = await register(name, email, password, phone);
      
      if (result.success) {
        // Show success message and redirect to login
        setError('Registration successful! Please login with your new account.');
        
        // Clear form
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setPhone('');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          switchToLogin();
        }, 2000);
      }
      
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Admin Registration</h2>
        {error && (
          <div className={`message ${error.includes('successful') ? 'success-message' : 'error-message'}`}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>
          <button 
            disabled={loading} 
            type="submit" 
            className="auth-button"
          >
            {loading ? 'Creating Account' : 'Create Account'}
          </button>
        </form>
        <div className="auth-switch">
          Already have an account?{' '}
          <span onClick={switchToLogin} className="auth-link">
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;