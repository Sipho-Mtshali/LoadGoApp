import { useState } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page">
      <div className="auth-content">
        <div className="auth-info">
          <h1>LoadGo Admin Dashboard</h1>
          <p>
            Streamline your global logistics operations with our comprehensive 
            administrative platform. Built for professionals who demand reliability, 
            efficiency, and precision in supply chain management.
          </p>
          <div className="company-features">
            <div className="feature-item">Real-time shipment tracking</div>
            <div className="feature-item">Global fleet management</div>
            <div className="feature-item">Advanced analytics & reporting</div>
            <div className="feature-item">Multi-language support</div>
            <div className="feature-item">24/7 enterprise support</div>
          </div>
        </div>
        {isLogin ? (
          <LoginForm switchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm switchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;