import styles from "./Modal.module.css";

const ConfirmModal = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Delete",
  isDanger = true,
}) => {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div
        className={styles.modalContent}
        style={{ maxWidth: "350px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>

        {/* FIX: Changed modalActions to buttonGroup right here */}
        <div className={styles.buttonGroup}>
          <button
            className={isDanger ? styles.btnDanger : styles.btnPrimary}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button className={styles.btnSecondary} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
