import styles from "./LandingPage.module.css";

const Features = () => {
  const features = [
    { 
      icon: 'fa-lock', 
      title: 'Private & Secure', 
      desc: 'Your chat conversations are end-to-end encrypted, so feel free to speak your mind. Your privacy is fully protected.' 
    },
    { 
      icon: 'fa-bolt', 
      title: 'Real-time messaging', 
      desc: 'Messages are delivered instantly. It feels like you’re talking face-to-face.' 
    },
    { 
      icon: 'fa-comment-dots', 
      title: 'Stay Connected', 
      desc: 'See who is online, watch them type in real-time, and know the exact moment your messages are read.' 
    },
    { 
      icon: 'fa-user-plus', 
      title: 'Friend Requests', 
      desc: 'Send a request to connect. You can only start chatting once they accept your invite, keeping you in full control.' 
    },
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
