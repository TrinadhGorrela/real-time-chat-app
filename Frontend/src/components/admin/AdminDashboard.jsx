import { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';

const ADMIN_PASSWORD = 'Trinadh462';
const BASE_URL = 'http://localhost:8081';

const AdminDashboard = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [inputPass, setInputPass] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);

  const fetchData = async (password) => {
    const headers = { 'admin-password': password };
    try {
      const [uRes, mRes, cRes] = await Promise.all([
        fetch(`${BASE_URL}/admin/users`, { headers }),
        fetch(`${BASE_URL}/admin/messages`, { headers }),
        fetch(`${BASE_URL}/admin/contacts`, { headers }),
      ]);
      setUsers(await uRes.json());
      setMessages(await mRes.json());
      setContacts(await cRes.json());
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/users`, {
        headers: { 'admin-password': inputPass },
      });
      if (res.ok) {
        setUnlocked(true);
        setError('');
        fetchData(inputPass);
      } else {
        setError('Invalid Secret Key');
      }
    } catch {
      setError('Backend not responding!');
    }
  };

  useEffect(() => {
    if (!unlocked) return;
    const interval = setInterval(() => fetchData(inputPass), 10000);
    return () => clearInterval(interval);
  }, [unlocked, inputPass]);

  if (!unlocked) {
    return (
      <div className={styles.overlay}>
        <div className={styles.loginBox}>
          <i className="fa-solid fa-user-shield" style={{ fontSize: '3rem', color: '#3b82f6', marginBottom: 15 }}></i>
          <h2>Admin Unlock</h2>
          <input
            type="password"
            className={styles.input}
            placeholder="Enter Secret Password"
            value={inputPass}
            onChange={(e) => setInputPass(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button className={styles.loginBtn} onClick={handleLogin}>
            Access Dashboard
          </button>
          {error && <p className={styles.errorMsg}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1><i className="fa-solid fa-database"></i> System Monitoring</h1>
        <button className={styles.refreshBtn} onClick={() => fetchData(inputPass)}>
          <i className="fa-solid fa-sync"></i> Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className={styles.card}>
        <h2><i className="fa-solid fa-users"></i> Registered Users</h2>
        <table className={styles.table}>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Password Hash</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><span className={styles.passwordCell}>{u.password}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Messages Table */}
      <div className={styles.card}>
        <h2><i className="fa-solid fa-comments"></i> Chat Logs</h2>
        <table className={styles.table}>
          <thead>
            <tr><th>Sender</th><th>Receiver</th><th>Message</th><th>Status</th></tr>
          </thead>
          <tbody>
            {[...messages].reverse().map((m, i) => (
              <tr key={i}>
                <td>{m.sender}</td>
                <td>{m.receiver}</td>
                <td>{m.content}</td>
                <td>
                  <span className={`${styles.badge} ${m.status === 'READ' ? styles.badgeRead : styles.badgeSent}`}>
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contacts Table */}
      <div className={styles.card}>
        <h2><i className="fa-solid fa-handshake"></i> Friendships</h2>
        <table className={styles.table}>
          <thead>
            <tr><th>User A</th><th>User B</th><th>Status</th></tr>
          </thead>
          <tbody>
            {contacts.map((c, i) => (
              <tr key={i}>
                <td>{c.userEmail}</td>
                <td>{c.friendEmail}</td>
                <td><span className={styles.badge}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
