import styles from "./WelcomeScreen.module.css";

const WelcomeScreen = () => {
  return (
    <div className={styles.welcomeScreen}>
      <img src="/image/logo.png" alt="Logo" className={styles.logo} />
      <h2>Welcome to Chat Application</h2>
      <p>Select a chat to start messaging</p>
    </div>
  );
};

export default WelcomeScreen;
