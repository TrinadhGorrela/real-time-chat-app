import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <img src="/image/logo.png" alt="Logo" style={{ width: 35, height: 35, marginRight: 10, verticalAlign: 'middle' }} />
        Chat Application
      </div>
      <div className={styles.navLinks}>
        <a href="#features">Features</a>
      </div>
      <div className={styles.navButtons}>
        <Link to="/register" className={`${styles.btn} ${styles.btnGreen}`}>Register</Link>
        <Link to="/login" className={`${styles.btn} ${styles.btnBlack}`}>Log in</Link>
      </div>
    </nav>
  );
};

export default Navbar;
