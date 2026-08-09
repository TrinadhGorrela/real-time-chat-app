import styles from "./LandingPage.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <h3>ChatApp</h3>
          <p>
            Connecting people seamlessly across the globe with real-time
            messaging.
          </p>
        </div>
        <div className={styles.footerLinks}>
          <div className={styles.linkGroup}>
            <h4>Connect</h4>
            <a
              href="https://github.com/TrinadhGorrela"
              target="_blank"
              rel="noreferrer"
            >
              <i className="fa-brands fa-github"></i> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/trinadhgorrela/"
              target="_blank"
              rel="noreferrer"
            >
              <i className="fa-brands fa-linkedin"></i> LinkedIn
            </a>
          </div>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>© 2026 Chat Application. All rights reserved.</span>
        <span>Developed by Siva Satya Trinadh Gorrela</span>
      </div>
    </footer>
  );
};

export default Footer;
