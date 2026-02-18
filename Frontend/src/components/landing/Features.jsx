import styles from './LandingPage.module.css';

const Features = () => {
  const features = [
    { icon: 'fa-bolt', title: 'Real-time messaging', desc: 'Send and receive messages instantly with WebSocket-based delivery.' },
    { icon: 'fa-eye', title: 'Read receipts', desc: 'See when your messages are delivered and read with blue ticks.' },
    { icon: 'fa-user-check', title: 'Online status', desc: "Know when your friends are online or view their last seen time." },
    { icon: 'fa-user-plus', title: 'Friend requests', desc: 'Send, accept, or decline chat requests to control your contacts.' },
  ];

  return (
    <section className={styles.featuresSection} id="features">
      <h2 className={styles.featuresTitle}>Chat Application Features</h2>
      <div className={styles.featuresGrid}>
        {features.map((f, i) => (
          <div key={i} className={styles.featureCard}>
            <i className={`fa-solid ${f.icon} ${styles.featureIcon}`}></i>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
