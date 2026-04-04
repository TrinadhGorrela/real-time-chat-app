import UserItem from "./UserItem";
import SearchBar from "./SearchBar";
import { useState, useRef, useEffect, useMemo } from "react";
import styles from "./Sidebar.module.css";

const Sidebar = ({
  contacts,
  activeContact,
  onSelectContact,
  unreadCounts,
  isLoading,
  user,
  pendingCount,
  onAddFriend,
  onShowRequests,
  onSettingsClick,
  onLogoutClick,
}) => {
  const [search, setSearch] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

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

  const filtered = useMemo(() => {
    return contacts
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (a.lastMessageTime && b.lastMessageTime) {
          return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        }
        if (a.lastMessageTime) return -1;
        if (b.lastMessageTime) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [contacts, search]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <div className={styles.profileHeader}>
          <div
            ref={btnRef}
            className={styles.iconButton}
            onClick={() => setShowMenu((prev) => !prev)}
            title="Menu"
          >
            <i className="fa-solid fa-bars"></i>
            {pendingCount > 0 && <span className={styles.badgeDot}></span>}
          </div>

          <div className={styles.searchContainer}>
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {showMenu && (
            <div className={styles.profileMenu} ref={menuRef}>
              <div className={styles.menuHeader}>
                <div className={styles.menuSignedIn}>Signed in as</div>
                <div className={styles.menuUserName}>
                  {user?.name || "User"}
                </div>
                <div className={styles.menuUserEmail}>{user?.email}</div>
              </div>

              <div
                className={styles.menuItem}
                onClick={() => {
                  setShowMenu(false);
                  onAddFriend();
                }}
              >
                <i className="fa-solid fa-user-plus"></i>
                <span>Add Friend</span>
              </div>

              <div
                className={styles.menuItem}
                onClick={() => {
                  setShowMenu(false);
                  onShowRequests();
                }}
              >
                <i className="fa-solid fa-envelope"></i>
                <span>Requests</span>
                {pendingCount > 0 && (
                  <span className={styles.badge}>{pendingCount}</span>
                )}
              </div>

              <div
                className={styles.menuItem}
                onClick={() => {
                  setShowMenu(false);
                  onSettingsClick();
                }}
              >
                <i className="fa-solid fa-gear"></i>
                <span>Settings</span>
              </div>

              <div
                className={`${styles.menuItem} ${styles.danger}`}
                onClick={() => {
                  setShowMenu(false);
                  onLogoutClick();
                }}
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.userList}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <i className="fa-solid fa-spinner fa-spin"></i> Loading contacts...
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((contact) => (
            <UserItem
              key={contact.email}
              contact={contact}
              isActive={activeContact?.email === contact.email}
              unreadCount={unreadCounts?.[contact.email?.toLowerCase()] || 0}
              onClick={() => onSelectContact(contact)}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            {search ? "No contacts found" : "No contacts yet"}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
