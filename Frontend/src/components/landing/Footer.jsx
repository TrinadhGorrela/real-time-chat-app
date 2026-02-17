import styles from './LandingPage.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <span>© 2026 Chat Application</span>
        <span>Trinadh G · B.Tech ECE</span>
        <a href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </footer>
  );
};

export default Footer;
