import { Link } from "react-router-dom";
import styles from "./LandingPage.module.css";

const Hero = () => {
  return (
    <section className={styles.heroContainer}>
      <div className={styles.heroText}>
        <h1>Speak Like<br />Nobody's Listening.</h1>
        <p>
          <b>Chat Application</b> is an easy-to-use, instant messaging app that helps you stay connected. 
          Simple, secure, and built for everyone.
        </p>
        <div className={styles.ctaGroup}>
          <Link to="/register" className={`${styles.btn} ${styles.btnGreen}`}>
            Get Started{" "}
            <i
              className="fa-solid fa-arrow-right"
              style={{ marginLeft: 5 }}
            ></i>
          </Link>
        </div>
      </div>

      <div className={styles.heroVisuals}>
        <div className={styles.chatMock}>
          <div className={`${styles.messageWrapper} ${styles.outgoing}`}>
            <div className={`${styles.chatBubble} ${styles.bubbleGreen}`}>
              Hey, did you deploy the latest build?
              <div className={styles.time}>
                11:30 AM <i className="fa-solid fa-check-double"></i>
              </div>
            </div>
          </div>
          <div className={`${styles.messageWrapper} ${styles.outgoing}`}>
            <div
              className={`${styles.chatBubble} ${styles.bubbleGreen}`}
              style={{ position: "relative" }}
            >
              Messages are syncing in real time on both devices. 🚀
              <div className={styles.time}>
                11:31 AM <i className="fa-solid fa-check-double"></i>
              </div>
              <div className={styles.reactions}>👍 ✅</div>
            </div>
          </div>
          <div className={`${styles.messageWrapper} ${styles.incoming}`}>
            <div className={styles.avatarCircle}>T</div>
            <div className={`${styles.chatBubble} ${styles.bubbleWhite}`}>
              Yes, looks great! Status, typing, and read receipts all work.
              <div className={styles.time}>11:35 AM</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
