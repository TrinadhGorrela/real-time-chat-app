import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    if (!trimmedPassword) {
      setError("Please enter your password");
      setLoading(false);
      return;
    }

    try {
      const data = await authService.login(trimmedEmail, trimmedPassword);

      if (!data || !data.token || !data.user) {
        throw new Error("Invalid response from server");
      }

      login(data);
      navigate("/chat");
    } catch (err) {
      console.error("Login error:", err);

      if (!err.response) {
        setError(
          "Unable to connect to server. Please check your internet connection.",
        );
      } else if (err.response.status === 401) {
        setError(err.response?.data?.message || "Invalid email or password");
      } else if (err.response.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(
          err.response?.data?.message || "Login failed. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginBody}>
      <div className={styles.loginContainer}>
        <div className={styles.logoArea}>
          <img
            src="/image/logo.png"
            alt="Logo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle cx="25" cy="25" r="20" fill="%2325d366"/><text x="25" y="32" font-size="20" text-anchor="middle" fill="white" font-family="Arial">C</text></svg>';
            }}
          />
        </div>
        <h2>Welcome Back</h2>
        <p className={styles.subtitle}>Login to continue to ChatApp</p>

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
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className={styles.inputGroup}>
            <i className="fa-solid fa-lock"></i>
            <input
              type={showPassword ? "text" : "password"}
              className={styles.formControl}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <i
              className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} ${styles.togglePassword}`}
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: loading ? "not-allowed" : "pointer" }}
            ></i>
          </div>

          {error && (
            <div className={`${styles.alert} ${styles.error}`}>{error}</div>
          )}

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span style={{ marginLeft: "8px" }}>Logging in...</span>
              </>
            ) : (
              "Log In"
            )}
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
