import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import styles from './Register.module.css';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const newUser = await authService.register(fullName, email.trim(), password);
      login({ token: null, user: { email: newUser.email, name: newUser.name } });

      // Get a real token by logging in
      const loginData = await authService.login(email.trim(), password);
      login(loginData);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerBody}>
      <div className={styles.registerContainer}>
        <div className={styles.logoArea}>
          <img src="/image/logo.png" alt="Logo" />
        </div>
        <h2>Create Account</h2>
        <p className={styles.subtitle}>Join our community today</p>

        {error && <div className={`${styles.alert} ${styles.error}`}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.nameRow}>
            <div className={styles.inputGroup}>
              <i className="fa-regular fa-user"></i>
              <input
                type="text"
                className={styles.formControl}
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <i className="fa-regular fa-user"></i>
              <input
                type="text"
                className={styles.formControl}
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

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
              minLength={6}
            />
            <i
              className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} ${styles.togglePassword}`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>

          <div className={styles.inputGroup}>
            <i className="fa-solid fa-lock"></i>
            <input
              type={showConfirm ? 'text' : 'password'}
              className={styles.formControl}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <i
              className={`fa-regular ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} ${styles.togglePassword}`}
              onClick={() => setShowConfirm(!showConfirm)}
            ></i>
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Sign Up'}
          </button>

          <div className={styles.loginLink}>
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
