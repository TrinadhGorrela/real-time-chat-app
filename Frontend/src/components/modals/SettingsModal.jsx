import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import styles from "./SettingsModal.module.css";

const SettingsModal = ({ user, onClose }) => {
  const { updateUserProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState({
    type: "",
    message: "",
  });
  const [nameStatus, setNameStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [nameLoading, setNameLoading] = useState(false);

  useEffect(() => {
    setEditName(user?.name || "");
  }, [user]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({
        type: "error",
        message: "Please fill in all fields",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: "error",
        message: "New passwords do not match",
      });
      return;
    }

    setLoading(true);
    setPasswordStatus({ type: "", message: "" });

    try {
      await authService.updatePassword(currentPassword, newPassword);
      setPasswordStatus({
        type: "success",
        message: "Password updated successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordStatus({
        type: "error",
        message: err.response?.data?.message || "Failed to update password",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editName.trim() || editName === user.name) {
      setIsEditingName(false);
      return;
    }

    setNameLoading(true);
    setNameStatus({ type: "", message: "" });

    try {
      const response = await authService.updateName(editName);
      if (updateUserProfile) {
        updateUserProfile({ ...user, name: response.newName || editName });
      }
      setNameStatus({ type: "success", message: "Name updated successfully!" });
      setIsEditingName(false);
      setTimeout(() => setNameStatus({ type: "", message: "" }), 3000);
    } catch (err) {
      setNameStatus({
        type: "error",
        message: err.response?.data?.message || "Failed to update name",
      });
      setEditName(user?.name || "");
    } finally {
      setNameLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.profileSection}>
            <div className={styles.avatarContainer}>
              <img
                src="/image/User.jpg"
                alt="Profile"
                className={styles.avatar}
              />
            </div>
            <div className={styles.userInfo}>
              {isEditingName ? (
                <div className={styles.nameEditGroup}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={styles.nameInput}
                    autoFocus
                    disabled={nameLoading}
                  />
                  <button
                    onClick={handleUpdateName}
                    className={styles.saveNameBtn}
                    disabled={nameLoading || !editName.trim()}
                  >
                    {nameLoading ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fa-solid fa-check"></i>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(user?.name || "");
                    }}
                    className={styles.cancelNameBtn}
                    disabled={nameLoading}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ) : (
                <div className={styles.nameDisplayGroup}>
                  <h3 className={styles.userName}>{user?.name || "User"}</h3>
                  <button
                    className={styles.editNameBtn}
                    onClick={() => setIsEditingName(true)}
                    title="Edit Name"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                </div>
              )}
              <p className={styles.userEmail}>{user?.email}</p>
              {nameStatus.message && (
                <div
                  className={`${styles.statusMessage} ${styles[nameStatus.type]}`}
                  style={{ marginTop: "10px", fontSize: "0.85rem" }}
                >
                  {nameStatus.message}
                </div>
              )}
            </div>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.securitySection}>
            <h4 className={styles.sectionTitle}>Security</h4>

            {!showPasswordForm && passwordStatus.message && (
              <div
                className={`${styles.statusMessage} ${styles[passwordStatus.type]}`}
              >
                {passwordStatus.message}
              </div>
            )}

            {!showPasswordForm ? (
              <button
                className={styles.openFormBtn}
                onClick={() => setShowPasswordForm(true)}
              >
                <i className="fa-solid fa-lock"></i> Update Password
              </button>
            ) : (
              <form
                onSubmit={handleUpdatePassword}
                className={styles.passwordForm}
              >
                <div className={styles.formGroup}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                {passwordStatus.message && (
                  <div
                    className={`${styles.statusMessage} ${styles[passwordStatus.type]}`}
                    style={{ marginTop: "15px" }}
                  >
                    {passwordStatus.message}
                  </div>
                )}
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordStatus({ type: "", message: "" });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.updateBtn}
                    disabled={
                      loading ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
