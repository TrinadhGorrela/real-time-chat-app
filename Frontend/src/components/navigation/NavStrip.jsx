import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import LogoutModal from "../modals/LogoutModal";
import styles from "./NavStrip.module.css";

const NavStrip = ({ onAddFriend, onShowRequests, pendingCount, mobileView }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  // Close menu when clicking anywhere outside it
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);


  const handleLogoutClick = () => {
    setShowMenu(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    authService.setOffline().catch(() => {});
    logout();
    navigate("/login");
  };

  const handleAddFriend = () => {
    setShowMenu(false);
    onAddFriend();
  };

  const handleShowRequests = () => {
    setShowMenu(false);
    onShowRequests();
  };

  return (
    // 2. ADDED THE DYNAMIC CLASS HERE 👇
    <nav className={`${styles.navStrip} ${mobileView === 'chat' ? styles.hideOnMobileChat : ''}`}>
      <div className={styles.navLogo} title="ChatApp">
        <img
          src="/image/logo.png"
          alt="Chat Logo"
          style={{ width: "45px", height: "40px", objectFit: "contain" }}
        />
      </div>

      {/* Profile button at bottom */}
      <div
        ref={btnRef}
        className={styles.navProfile}
        onClick={() => setShowMenu((prev) => !prev)}
        title={user?.name || "Profile"}
      >
        <i className="fa-solid fa-user"></i>
      </div>

      {/* Profile dropdown menu */}
      {showMenu && (
        <div className={styles.profileMenu} ref={menuRef}>
          <div className={styles.menuHeader}>
            <div className={styles.menuSignedIn}>Signed in as</div>
            <div className={styles.menuUserName}>{user?.name || "User"}</div>
            <div className={styles.menuUserEmail}>{user?.email}</div>
          </div>

          <div className={styles.menuItem} onClick={handleAddFriend}>
            <i className="fa-solid fa-user-plus"></i>
            <span>Add Friend</span>
          </div>

          <div className={styles.menuItem} onClick={handleShowRequests}>
            <i className="fa-solid fa-envelope"></i>
            <span>Requests</span>
            {pendingCount > 0 && (
              <span className={styles.badge}>{pendingCount}</span>
            )}
          </div>

          <div
            className={`${styles.menuItem} ${styles.danger}`}
            onClick={handleLogoutClick}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </div>
        </div>
      )}

      {/* RENDER MODAL HERE (Outside the menu) */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

    </nav>
  );
};

export default NavStrip;