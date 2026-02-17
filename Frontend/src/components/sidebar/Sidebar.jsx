import UserItem from "./UserItem";
import SearchBar from "./SearchBar";
import { useState } from "react";
import styles from "./Sidebar.module.css";

const Sidebar = ({
  contacts,
  activeContact,
  onSelectContact,
  unreadCounts,
}) => {
  const [search, setSearch] = useState("");

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <h3 className={styles.heading}>Chat Application</h3>
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className={styles.userList}>
        {/* UX Upgrade: Show a message if the search finds nothing */}
        {filtered.length > 0 ? (
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
