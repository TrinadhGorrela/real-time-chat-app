// ============================================
// 0. INITIALIZATION & VARIABLES
// ============================================
const myEmail = localStorage.getItem("email");
const myName = localStorage.getItem("username");
const token = localStorage.getItem("token");

let stompClient = null;
let currentReceiverEmail = null;
let statusCheckInterval;
let typingTimeout;

// Tracker to prevent double bubbles from the 'echo'
let lastMsgContent = "";
let lastMsgTime = 0;

// ============================================
// 1. SECURITY CHECK
// ============================================
if (!myEmail || !myName) {
  window.location.href = "/login.html";
}

// ============================================
// 2. DOM READY - SINGLE INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // Display current user name
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
  document.getElementById("my-name-display").innerText = myName;

  // Connect WebSocket and load contacts
  connect();
  loadData();

  updateRequestBadge();

  // Mark user as online
  markUserOnline();

  // Check friend status every 5 seconds
  statusCheckInterval = setInterval(checkFriendStatus, 5000);

  // Mark offline when leaving page
  window.addEventListener("beforeunload", () => {
    markUserOffline();
  });

  // ✅ Event delegation for delete buttons (dynamically added)
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-msg-btn")) {
      const msgId = e.target.dataset.msgId;
      const elementId = "msg-" + msgId;
      deleteMessage(msgId, elementId);
    }
  });
});

// ============================================
// 3. WEBSOCKET CONNECTION
// ============================================
function connect() {
  const socket = new SockJS("http://localhost:8081/ws");
  stompClient = Stomp.over(socket);
  stompClient.debug = null;

  stompClient.connect(
    {},
    function (frame) {
      console.log("Connected to WebSocket");

      stompClient.subscribe("/topic/private/" + myEmail, function (payload) {
        const msg = JSON.parse(payload.body);
        const senderEmail = msg.sender ? msg.sender.trim().toLowerCase() : "";
        const currentUser = myEmail.trim().toLowerCase();

        // 1. Always allow Read Receipts (Status updates)
        if (msg.status === "READ" && !msg.content) {
          onMessageReceived(msg);
          return;
        }

        // 2. STOP DOUBLE MESSAGES: If I am the sender, ignore the server's echo
        if (senderEmail === currentUser) {
          console.log("Filtered echo to prevent double bubble.");
          return;
        }

        // 3. Process messages from others
        onMessageReceived(msg);
      });

      // Subscribe to status and typing updates
      subscribeToStatusUpdates();
      subscribeToTyping();
    },
    function (error) {
      setTimeout(connect, 5000);
    }
  );
}

// ============================================
// 4. HANDLING INCOMING MESSAGES
// ============================================
const notificationSound = new Audio("/audio/notification.mp3");

async function onMessageReceived(msg) {
  const msgSender = msg.sender ? msg.sender.trim().toLowerCase() : "";
  const activeChat = currentReceiverEmail
    ? currentReceiverEmail.trim().toLowerCase()
    : "";

  // A. Handle Read Receipts (Blue Ticks)
  if (msg.status === "READ" && !msg.content) {
    if (activeChat && msgSender === activeChat) markMessagesAsReadUI();
    return;
  }

  // B. Auto-Refresh Contact List if it's a new friend
  const safeId = msgSender.replace(/[@.]/g, "-");
  let senderItem = document.getElementById("user-item-" + safeId);

  if (!senderItem && msgSender !== myEmail) {
    console.log("⚠️ New friend detected! Refreshing contacts...");
    await loadData();
  }

  // C. Show Message Bubble or Notification
  const isMyMsg =
    msg.sender.trim().toLowerCase() === myEmail.trim().toLowerCase() &&
    msg.receiver.trim().toLowerCase() === activeChat;
  const isIncomingMsg = msgSender === activeChat;

  if (isMyMsg || isIncomingMsg) {
    appendMessageWithDateHeader(msg);
    if (isIncomingMsg) {
      sendReadReceipt(msgSender);
      // Optional: Play soft sound even if chat is open (WhatsApp does this)
      // notificationSound.play().catch(e => console.log("Audio error:", e));
    }
  } else {
    // If chatting with someone else, show notification
    if (msgSender !== myEmail) {
      // 1. Play Sound 🎵
      notificationSound
        .play()
        .catch((e) =>
          console.log("Audio play failed (user interaction needed first):", e)
        );

      // 2. Desktop Notification 🔔
      if (document.hidden && Notification.permission === "granted") {
        new Notification(`New message from ${msg.sender}`, {
          body: msg.content,
          icon: "/image/logo.png", // Replace with your logo path
        });
      }

      // 3. In-App UI Updates
      showToast(msg.sender, "New Message");
      highlightSidebar(msg.sender);
    }
  }
}

// ============================================
// 5. CONTACT LIST LOGIC
// ============================================
async function loadData() {
  const token = localStorage.getItem("token");

  // Security Check: If no token, kick them out
  if (!token) {
    alert("Please login first.");
    window.location.href = "/login.html";
    return;
  }

  try {
    const res = await fetch(`http://localhost:8081/chatapp/mycontacts`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 403 || res.status === 401) {
      throw new Error("Session Expired");
    }

    const friends = await res.json();
    const list = document.getElementById("user-list");
    list.innerHTML = "";

    friends.forEach((user) => {
      const div = document.createElement("div");
      div.className = "user-item";

      const cleanEmail = user.email.trim().toLowerCase();
      const safeId = cleanEmail.replace(/[@.]/g, "-");
      div.id = "user-item-" + safeId;

      // Keep active status
      if (
        typeof currentReceiverEmail !== "undefined" &&
        cleanEmail === currentReceiverEmail
      ) {
        div.classList.add("active");
      }

      div.innerHTML = `
  <div class="user-avatar">
    <img src="/image/User.jpg" alt="User">
  </div>
  <div style="flex:1;">${user.name}</div>
  <span class="notification-badge" style="display:none">!</span>
`;

      div.onclick = () => selectUser(user.name, cleanEmail, div);
      list.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading contacts:", error);
    alert("Session expired. Please login again.");
    window.location.href = "/login.html";
  }
}

// ============================================
// 6. CHAT ACTIONS
// ============================================
async function selectUser(name, email, element) {
  currentReceiverEmail = email.trim().toLowerCase();
  const token = localStorage.getItem("token");

  // UI Updates
  document.getElementById("chat-user-name").innerText = name;
  document.getElementById("chat-header").style.display = "flex";
  document.getElementById("input-area").style.display = "flex";
  document.getElementById("welcome-screen").style.display = "none";

  // Clear and Show Message Container
  const msgContainer = document.getElementById("chat-messages");
  msgContainer.style.display = "flex";
  msgContainer.innerHTML = "";

  // Sidebar highlight logic (EXISTING)
  document
    .querySelectorAll(".user-item")
    .forEach((el) => el.classList.remove("active"));
  element.classList.add("active");

  // ✅ NEW: Remove Unread Badge & Highlight (WhatsApp Style)
  element.classList.remove("has-new-message");
  const badge = element.querySelector(".notification-badge");
  if (badge) {
    badge.innerText = ""; // Clear number
    badge.style.display = "none"; // Hide badge
  }

  try {
    const res = await fetch(
      `http://localhost:8081/chatapp/messages/${myEmail.toLowerCase()}/${currentReceiverEmail.toLowerCase()}`,
      { headers: { Authorization: "Bearer " + token } }
    );
    const history = await res.json();

    // Load history one by one
    if (Array.isArray(history)) {
      history.forEach((msg) => appendMessageWithDateHeader(msg));
    }
  } catch (err) {
    console.error("History Load Error:", err);
  }

  sendReadReceipt(currentReceiverEmail);
  scrollToBottom();
  checkFriendStatus(); // Check status when opening chat
}

function sendMessage() {
  const input = document.getElementById("msg-input");
  const content = input.value.trim();

  if (content && stompClient && currentReceiverEmail) {
    const msg = {
      sender: myEmail,
      receiver: currentReceiverEmail,
      content: content,
      status: "SENT",
      timestamp: new Date().toISOString(),
    };

    // 1. Add to screen immediately
    appendMessageWithDateHeader(msg);

    // 2. Send via WebSocket
    stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(msg));

    input.value = "";
    scrollToBottom();
  }
}

function appendMessage(msg) {
  if (!msg || !msg.content) return;

  const isMe = msg.sender.trim().toLowerCase() === myEmail.trim().toLowerCase();
  const now = Date.now();

  if (isMe && msg.content === lastMsgContent && now - lastMsgTime < 1000) {
    return;
  }

  const msgContainer = document.getElementById("chat-messages");
  if (!msgContainer) return;

  const div = document.createElement("div");
  div.className = "message " + (isMe ? "my-message" : "other-message");
  if (msg.id) div.id = "msg-" + msg.id;

  div.setAttribute("data-timestamp", msg.timestamp || new Date().toISOString());

  let timeStr = "";
  if (msg.timestamp) {
    timeStr = formatMessageTime(msg.timestamp);
  }

  let metaHtml = "";
  if (isMe) {
    const isRead = msg.status === "READ";
    const tickIcon = isRead ? "fa-check-double" : "fa-check";
    const tickClass = isRead ? "tick read" : "tick";

    metaHtml = `
      <div class="msg-meta" style="display: flex; align-items: center; justify-content: flex-end; gap: 5px;">
        ${
          msg.id
            ? `<i class="fa-solid fa-trash delete-msg-btn" data-msg-id="${msg.id}" style="cursor:pointer; font-size: 10px; margin-right: 5px; color: #8696a0;"></i>`
            : ""
        }
        ${
          timeStr
            ? `<span class="msg-time" style="font-size: 0.7rem; color: #8696a0; margin-right: 3px;">${timeStr}</span>`
            : ""
        }
        <span class="${tickClass}"><i class="fa-solid ${tickIcon}" style="font-size: 10px;"></i></span>
      </div>
    `;
  } else {
    metaHtml = `
      <div class="msg-meta" style="display: flex; align-items: center; justify-content: flex-start; gap: 5px;">
        ${
          timeStr
            ? `<span class="msg-time" style="font-size: 0.7rem; color: #8696a0;">${timeStr}</span>`
            : ""
        }
      </div>
    `;
  }

  div.innerHTML = `
    <div class="message-content" style="word-wrap: break-word; color: #111b21;">
      <span style="display: block;">${msg.content}</span>
      ${metaHtml}
    </div>
  `;

  msgContainer.appendChild(div);

  if (isMe) {
    lastMsgContent = msg.content;
    lastMsgTime = now;
  }

  scrollToBottom();
}

async function deleteMessage(msgId, elementId) {
  if (!confirm("Delete this message?")) return;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:8081/chatapp/message/${msgId}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });

    if (res.ok) {
      const element = document.getElementById(elementId);
      if (element) {
        element.remove();
      }
    } else {
      alert("Failed to delete message");
    }
  } catch (e) {
    console.error("Delete Error:", e);
    alert("Error deleting message");
  }
}

// ============================================
// FORMAT MESSAGE TIMESTAMP
// ============================================
function formatMessageTime(timestamp) {
  if (!timestamp) return "";

  // Handle both string and Date formats
  const date =
    typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();

  // Get current date at midnight
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  // Check if message is from today
  if (messageDate.getTime() === todayStart.getTime()) {
    // Today: Show time only (HH:MM)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } else if (
    messageDate.getTime() ===
    new Date(todayStart.getTime() - 86400000).getTime()
  ) {
    // Yesterday: Show "Yesterday"
    return "Yesterday";
  } else {
    // Older: Show date (MM/DD/YY)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

// ============================================
// 7. HELPER FUNCTIONS
// ============================================
function sendReadReceipt(originalSender) {
  const receipt = { sender: myEmail, receiver: originalSender, status: "READ" };
  stompClient.send("/app/chat.readMessage", {}, JSON.stringify(receipt));
}

function markMessagesAsReadUI() {
  const ticks = document.querySelectorAll(".my-message .tick i");
  ticks.forEach((icon) => {
    icon.className = "fa-solid fa-check-double";
    icon.parentElement.classList.add("read");
  });
}

function scrollToBottom() {
  const d = document.getElementById("chat-messages");
  if (d) d.scrollTop = d.scrollHeight;
}

function showToast(s, t) {
  const el = document.getElementById("notification-toast");
  document.getElementById("toast-msg").innerText = s + ": " + t;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 3000);
}

function highlightSidebar(email) {
  const cleanEmail = email.trim().toLowerCase();
  const safeId = cleanEmail.replace(/[@.]/g, "-");
  const userItem = document.getElementById("user-item-" + safeId);

  if (userItem) {
    // 1. Move User to Top of List (WhatsApp Style)
    const list = document.getElementById("user-list");
    list.prepend(userItem);

    // 2. Find and Update Badge
    const badge = userItem.querySelector(".notification-badge");
    if (badge) {
      let count = parseInt(badge.innerText) || 0;
      badge.innerText = count + 1; // Increment count
      badge.style.display = "block"; // Make visible
    }

    // 3. Add highlighting class
    userItem.classList.add("has-new-message");
  }
}

function handleEnter(e) {
  if (e.key === "Enter") sendMessage();
}

// ============================================
// 8. STATUS FUNCTIONS
// ============================================
function markUserOnline() {
  const token = localStorage.getItem("token");
  fetch("http://localhost:8081/chatapp/status/online", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
  }).catch((e) => console.log("Online status update failed:", e));
}

function markUserOffline() {
  const token = localStorage.getItem("token");
  fetch("http://localhost:8081/chatapp/status/offline", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
  }).catch((e) => console.log("Offline status update failed:", e));
}

function checkFriendStatus() {
  if (!currentReceiverEmail) return;

  const token = localStorage.getItem("token");
  fetch(`http://localhost:8081/chatapp/status/check/${currentReceiverEmail}`, {
    headers: { Authorization: "Bearer " + token },
  })
    .then((r) => r.json())
    .then((data) => {
      const indicator = document.getElementById("status-indicator");
      const text = document.getElementById("status-text");
      const userStatus = document.getElementById("user-status");
      const typingIndicator = document.getElementById("typing-indicator");

      // Only show online status if NOT typing
      if (typingIndicator.style.display !== "block") {
        userStatus.style.display = "flex";

        if (data.isOnline) {
          indicator.style.background = "#31a24c";
          text.innerText = "Online";
        } else {
          indicator.style.background = "#8696a0";
          text.innerText = "Last seen " + formatTime(data.lastSeen);
        }
      }
    })
    .catch((e) => console.log("Status check failed:", e));
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
}

function subscribeToStatusUpdates() {
  if (stompClient && stompClient.connected) {
    stompClient.subscribe("/topic/status", function (message) {
      const statusUpdate = JSON.parse(message.body);
      // Refresh status if it's our current chat friend
      if (statusUpdate.email === currentReceiverEmail) {
        checkFriendStatus();
      }
    });
  }
}

// ============================================
// 9. TYPING FUNCTIONS
// ============================================

function onTyping() {
  if (!currentReceiverEmail || !stompClient) return;

  // Send typing status
  stompClient.send(
    "/app/chat.typing",
    {},
    JSON.stringify({
      sender: myEmail,
      receiver: currentReceiverEmail,
      isTyping: true,
    })
  );

  // Clear previous timeout
  clearTimeout(typingTimeout);

  // Stop typing after 3 seconds of inactivity
  typingTimeout = setTimeout(() => {
    stompClient.send(
      "/app/chat.typing",
      {},
      JSON.stringify({
        sender: myEmail,
        receiver: currentReceiverEmail,
        isTyping: false,
      })
    );
  }, 3000);
}

function subscribeToTyping() {
  if (stompClient && stompClient.connected) {
    stompClient.subscribe("/topic/typing/" + myEmail, function (message) {
      const typingData = JSON.parse(message.body);
      const userStatus = document.getElementById("user-status");
      const typingIndicator = document.getElementById("typing-indicator");

      if (typingData.isTyping && typingData.sender === currentReceiverEmail) {
        // HIDE online status
        userStatus.style.display = "none";

        // SHOW typing indicator
        typingIndicator.style.display = "block";
        typingIndicator.innerText = "Typing...";
      } else if (
        !typingData.isTyping &&
        typingData.sender === currentReceiverEmail
      ) {
        // HIDE typing indicator
        typingIndicator.style.display = "none";

        // SHOW online status again
        userStatus.style.display = "flex";
        checkFriendStatus();
      }
    });
  }
}

async function updateRequestBadge() {
  const token = localStorage.getItem("token");
  const badge = document.getElementById("request-badge");
  if (!badge || !token) return;

  try {
    const res = await fetch("http://localhost:8081/chatapp/requests", {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) return;

    const reqs = await res.json();
    const count = (reqs && reqs.length) || 0;

    if (count > 0) {
      badge.innerText = count;
      badge.style.display = "inline-block"; // or "block"
    } else {
      badge.innerText = "";
      badge.style.display = "none";
    }
  } catch (e) {
    console.error("Request badge update failed:", e);
  }
}

// ============================================
// 10. FRIEND REQUESTS LOGIC
// ============================================
function openRequestsModal() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("req-list-container");
  const requestBadge = document.getElementById("request-badge");

  // Reset UI and Open Modal
  container.innerHTML = "<p style='color:gray;'>Checking requests...</p>";
  openModal("reqModal");

  // ✅ User opened Requests: mark as seen (hide badge)
  if (requestBadge) {
    requestBadge.innerText = "";
    requestBadge.style.display = "none";
  }

  fetch(`http://localhost:8081/chatapp/requests`, {
    headers: { Authorization: "Bearer " + token },
  })
    .then((r) => r.json())
    .then((reqs) => {
      container.innerHTML = "";

      const count = (reqs && reqs.length) || 0;

      if (count === 0) {
        container.innerHTML =
          "<p style='color:gray; padding:10px;'>No pending requests</p>";
        return;
      }

      reqs.forEach((r) => {
        const row = document.createElement("div");
        row.style =
          "padding:12px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f0f2f5;";

        row.innerHTML = `
          <span style="font-weight:500; color:#111b21;">${r.friendEmail}</span>
          <div style="display:flex; gap:6px;">
            <button onclick="acceptRequest(${r.id})"
                    style="background:#00a884; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:600;">
              Accept
            </button>
            <button onclick="declineRequest(${r.id})"
                    style="background:#f0f2f5; color:#ef4444; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-weight:600;">
              Decline
            </button>
          </div>
        `;

        container.appendChild(row);
      });
    })
    .catch((err) => {
      container.innerHTML = "<p style='color:red;'>Connection Error</p>";
      console.error(err);
    });
}

async function acceptRequest(id) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch("http://localhost:8081/chatapp/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ id: id }),
    });

    if (res.ok) {
      alert("Friendship Accepted!");
      closeModal("reqModal");
      loadData(); // reload contacts

      // Refresh request badge quietly
      openRequestsModal(); // or extract the badge-update part into a separate function
    }
  } catch (e) {
    console.error("Accept failed", e);
  }
}

async function declineRequest(id) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch("http://localhost:8081/chatapp/decline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ id: id }),
    });

    if (res.ok) {
      alert("Request declined");
      openRequestsModal();
      updateRequestBadge();
    }
  } catch (e) {
    console.error("Decline failed", e);
  }
}

async function sendFriendRequest() {
  const emailInput = document.getElementById("search-email");
  const targetEmail = emailInput.value.trim().toLowerCase();
  const token = localStorage.getItem("token");

  if (!targetEmail) return;

  try {
    const res = await fetch("http://localhost:8081/chatapp/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ approver: targetEmail }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      closeModal("addModal");
      emailInput.value = "";
    }
  } catch (e) {
    console.error("Request failed", e);
  }
}

// ============================================
// 11. UI: MENUS & MODALS
// ============================================
function toggleHeaderMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById("header-menu");
  menu.classList.toggle("show");
}

function deleteCurrentFriend() {
  if (currentReceiverEmail) deleteFriend(currentReceiverEmail);
}

async function deleteFriend(friendEmail) {
  if (!confirm("Delete this conversation? This action cannot be undone."))
    return;

  const token = localStorage.getItem("token");
  try {
    const res = await fetch("http://localhost:8081/chatapp/delete-contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ friend: friendEmail }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Contact deleted!");

      // Clear UI
      document.getElementById("chat-header").style.display = "none";
      document.getElementById("input-area").style.display = "none";
      document.getElementById("chat-messages").innerHTML = "";
      document.getElementById("welcome-screen").style.display = "flex";

      currentReceiverEmail = null;

      // Reload contacts
      await loadData();
    } else {
      alert("Error: " + data.message);
    }
  } catch (e) {
    console.error("Delete failed:", e);
    alert("Failed to delete contact");
  }
}

function toggleProfileMenu(e) {
  e.stopPropagation();
  document.getElementById("profile-menu").classList.toggle("show");
}

function closeProfileMenu(e) {
  if (!document.getElementById("profile-menu").contains(e.target))
    document.getElementById("profile-menu").classList.remove("show");
}

function openModal(id) {
  document.getElementById(id).style.display = "block";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

// ============================================
// FORMAT MESSAGE TIME (TIME ONLY)
// ============================================
function formatMessageTime(timestamp) {
  if (!timestamp)
    return new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const date =
    typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp);

  // Return ONLY time (e.g. "10:25 AM")
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ============================================
// NEW: APPEND MESSAGE WITH DATE HEADER
// ============================================
function appendMessageWithDateHeader(msg) {
  const msgContainer = document.getElementById("chat-messages");
  const msgDate = new Date(msg.timestamp || Date.now());
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize today to midnight

  // Normalize message date to midnight for comparison
  const msgDayStart = new Date(
    msgDate.getFullYear(),
    msgDate.getMonth(),
    msgDate.getDate()
  );

  // Check if we need a date header
  const lastMsg = msgContainer.lastElementChild;
  let needsHeader = false;

  if (!lastMsg) {
    needsHeader = true;
  } else {
    const lastDateStr = lastMsg.getAttribute("data-timestamp");
    if (lastDateStr) {
      const lastDate = new Date(lastDateStr);
      const lastDayStart = new Date(
        lastDate.getFullYear(),
        lastDate.getMonth(),
        lastDate.getDate()
      );
      if (lastDayStart.getTime() !== msgDayStart.getTime()) {
        needsHeader = true;
      }
    } else {
      needsHeader = true;
    }
  }

  
  if (needsHeader) {
    const dateHeader = document.createElement("div");
    dateHeader.className = "date-header";
    // Inline styles for quick fix (move to CSS later if you want)
    dateHeader.style.cssText = `
      text-align: center; 
      margin: 15px 0 5px; 
      color: #54656f; 
      font-size: 12px;
      font-weight: 500;
      background: #e8eaed;
      display: inline-block;
      padding: 5px 12px;
      border-radius: 8px;
      align-self: center;
      box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
    `;

    // Determine text (Today, Yesterday, or Date)
    if (msgDayStart.getTime() === today.getTime()) {
      dateHeader.textContent = "Today";
    } else if (
      msgDayStart.getTime() === new Date(today.getTime() - 86400000).getTime()
    ) {
      dateHeader.textContent = "Yesterday";
    } else {
      dateHeader.textContent = msgDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const wrapper = document.createElement("div");
    wrapper.style.textAlign = "center";
    wrapper.style.width = "100%";
    wrapper.style.marginBottom = "10px";
    wrapper.appendChild(dateHeader);
    msgContainer.appendChild(wrapper);
  }
  appendMessage(msg);
}

// ============================================
// SEARCH: FILTER CONTACTS
// ============================================
function filterContacts(term) {
  const search = term.trim().toLowerCase();
  const items = document.querySelectorAll(".user-item");

  items.forEach((item) => {
    const nameDiv = item.querySelector("div:nth-child(2)");
    const name = nameDiv ? nameDiv.textContent.trim().toLowerCase() : "";

    if (!search || name.includes(search)) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
}
