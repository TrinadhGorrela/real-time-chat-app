import styles from "./Toast.module.css";

const Toast = ({ message }) => (
  <div className={styles.toast}>
    <i className="fa-solid fa-message"></i>
    <span>{message}</span>
  </div>
);

export default Toast;
