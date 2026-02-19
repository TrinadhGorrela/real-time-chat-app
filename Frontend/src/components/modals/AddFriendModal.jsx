import { useState } from "react";
import friendService from "../../services/friendService";
import styles from "./Modal.module.css";

const AddFriendModal = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await friendService.sendFriendRequest(
        email.trim().toLowerCase(),
      );
      alert(result.message || "Friend request sent!");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send friend request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>Add Friend</h3>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className={styles.input}
            placeholder="Enter friend's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Request"}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFriendModal;
