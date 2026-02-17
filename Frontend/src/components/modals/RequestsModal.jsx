import friendService from '../../services/friendService';
import styles from './Modal.module.css';

const RequestsModal = ({ requests, onClose, onAccepted, onDeclined }) => {
  const handleAccept = async (id) => {
    try {
      await friendService.acceptRequest(id);
      alert('Friend request accepted!');
      onAccepted();
      onClose();
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  const handleDecline = async (id) => {
    try {
      await friendService.declineRequest(id);
      onDeclined();
      onClose();
    } catch (err) {
      alert('Failed to decline request');
    }
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>Friend Requests</h3>
        <div className={styles.requestList}>
          {requests.length === 0 ? (
            <p style={{ color: '#8696a0', padding: '10px 0' }}>No pending requests</p>
          ) : (
            requests.map(r => (
              <div key={r.id} className={styles.requestRow}>
                <span className={styles.requestEmail}>{r.friendEmail}</span>
                <div className={styles.requestActions}>
                  <button className={styles.btnAccept} onClick={() => handleAccept(r.id)}>Accept</button>
                  <button className={styles.btnDecline} onClick={() => handleDecline(r.id)}>Decline</button>
                </div>
              </div>
            ))
          )}
        </div>
        <button className={styles.btnSecondary} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default RequestsModal;
