import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(email.trim(), password);
      login(data);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginBody}>
      <div className={styles.loginContainer}>
        <div className={styles.logoArea}>
          <img src="/image/logo.png" alt="Logo" />
        </div>
        <h2>Welcome Back</h2>
        <p className={styles.subtitle}>Login to continue to ChatApp</p>

        {error && <div className={`${styles.alert} ${styles.error}`}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <i className="fa-regular fa-envelope"></i>
            <input
              type="email"
              className={styles.formControl}
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <i className="fa-solid fa-lock"></i>
            <input
              type={showPassword ? 'text' : 'password'}
              className={styles.formControl}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <i
              className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} ${styles.togglePassword}`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Log In'}
          </button>

          <div className={styles.registerLink}>
            Don't have an account? <Link to="/register">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
