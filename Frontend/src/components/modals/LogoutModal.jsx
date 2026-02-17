import styles from "./Modal.module.css";

const LogoutModal = ({ onConfirm, onCancel }) => {
  return (
    <div className={styles.modal} onClick={onCancel}>
      <div
        className={styles.modalContent}
        style={{ maxWidth: "300px", textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Logout</h3>
        <p>Are you sure you want to log out of your account</p>
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginTop: "20px",
          }}
        >
          <button className={styles.btnDanger} onClick={onConfirm}>
            Logout
          </button>
          <button className={styles.btnSecondary} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
