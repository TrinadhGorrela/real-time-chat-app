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
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
  document.getElementById("my-name-display").innerText = myName;
  connect();
  loadData();

  updateRequestBadge();
  markUserOnline();

  statusCheckInterval = setInterval(checkFriendStatus, 5000);

  window.addEventListener("beforeunload", () => {
    markUserOffline();
  });

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
      stompClient.subscribe(
        "/topic/private/" + myEmail.toLowerCase(),
        function (message) {
          const msg = JSON.parse(message.body);
          onMessageReceived(msg);
        },
      );

      stompClient.subscribe("/user/queue/read-receipts", function (receipt) {
        const msg = JSON.parse(receipt.body);
        if (msg.status === "READ") {
          const element = document.querySelector(`#msg-${msg.id}`);
          if (element) {
            const tickIcon = element.querySelector(".tick i");
            if (tickIcon) {
              tickIcon.className = "fa-solid fa-check-double";
              tickIcon.style.color = "#4fc3f7";
            }
          }
        }
      });

      stompClient.subscribe("/topic/status", function (statusUpdate) {
        const statusData = JSON.parse(statusUpdate.body);
        checkFriendStatus();
      });

      subscribeToStatusUpdates();
      subscribeToTyping();
    },
    function (error) {
      console.error("âŒ WS Error:", error);
      setTimeout(connect, 5000);
    },
  );
}

// ============================================
// 4. HANDLING INCOMING MESSAGES
// ============================================
const notificationSound = new Audio("/audio/notification.mp3");

async function onMessageReceived(msg) {
  const msgSender = msg.sender ? msg.sender.trim().toLowerCase() : "";
  const msgReceiver = msg.receiver ? msg.receiver.trim().toLowerCase() : "";
  const myEmailLower = myEmail.trim().toLowerCase();
  const activeChat = currentReceiverEmail
    ? currentReceiverEmail.trim().toLowerCase()
    : "";

  if (msg.status === "READ" && !msg.content) {
    if (activeChat && msgSender === activeChat) markMessagesAsReadUI();
    return;
  }

  if (msg.status === "READ" && !msg.content) {
    if (activeChat && msgSender === activeChat) markMessagesAsReadUI();
    return;
  }

  const isFromMe = msgSender === myEmailLower;
  const isForMe = msgReceiver === myEmailLower;

  if (isFromMe && msgReceiver === activeChat) {
    return;
  }

  if (!isForMe) {
    return;
  }

  const safeId = msgSender.replace(/[@.]/g, "-");
  let senderItem = document.getElementById("user-item-" + safeId);

  if (!senderItem && msgSender !== myEmail) {
    console.log("⚠️ New friend detected! Refreshing contacts...");
    await loadData();
  }

  const isMessageForMe = msgReceiver === myEmail.trim().toLowerCase();
  const isMessageFromActiveChat = msgSender === activeChat;
  const isMyOwnMessage =
    msgSender === myEmail.trim().toLowerCase() && msgReceiver === activeChat;

  if (isMyOwnMessage || (isMessageFromActiveChat && isMessageForMe)) {
    appendMessageWithDateHeader(msg);

    setTimeout(() => {
      scrollToBottom();
    }, 10);

    if (isMessageFromActiveChat && isMessageForMe && !isMyOwnMessage) {
      sendReadReceipt(msgSender);
    }
  } else {
    if (msgSender !== myEmail && isMessageForMe) {
      notificationSound
        .play()
        .catch((e) =>
          console.log("Audio play failed (user interaction needed first):", e),
        );

      if (document.hidden && Notification.permission === "granted") {
        new Notification(`New message from ${msg.sender}`, {
          body: msg.content || "📎 Attachment",
          icon: "/image/logo.png",
        });
      }
      showToast(msg.sender, msg.content || "New Message");
      highlightSidebar(msg.sender);
    }
  }
}

// ============================================
// 5. CONTACT LIST LOGIC
// ============================================
async function loadData() {
  const token = localStorage.getItem("token");

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

  document.getElementById("chat-user-name").innerText = name;
  document.getElementById("chat-header").style.display = "flex";
  document.getElementById("input-area").style.display = "flex";
  document.getElementById("welcome-screen").style.display = "none";

  const msgContainer = document.getElementById("chat-messages");
  msgContainer.style.display = "flex";
  msgContainer.style.flexDirection = "column";
  msgContainer.style.overflow = "auto";
  msgContainer.innerHTML = "";

  document
    .querySelectorAll(".user-item")
    .forEach((el) => el.classList.remove("active"));
  element.classList.add("active");

  element.classList.remove("has-new-message");
  const badge = element.querySelector(".notification-badge");
  if (badge) {
    badge.innerText = "";
    badge.style.display = "none";
  }

  try {
    const res = await fetch(
      `http://localhost:8081/chatapp/messages/${myEmail.toLowerCase()}/${currentReceiverEmail.toLowerCase()}`,
      { headers: { Authorization: "Bearer " + token } },
    );
    const history = await res.json();

    if (Array.isArray(history)) {
      history.forEach((msg) => appendMessageWithDateHeader(msg));
    }
  } catch (err) {
    console.error("History Load Error:", err);
  }

  sendReadReceipt(currentReceiverEmail);
  setTimeout(() => scrollToBottom(), 50);
  checkFriendStatus();
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
      messageType: "TEXT",
    };

    appendMessageWithDateHeader(msg);

    stompClient.send("/app/chat", {}, JSON.stringify(msg));

    input.value = "";
    scrollToBottom();
  }
}

function triggerDownload(url, fileName) {
  event.stopPropagation();

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 2000);
}

function appendMessage(msg) {
  if (!msg) return;
  const isMe = msg.sender.trim().toLowerCase() === myEmail.trim().toLowerCase();
  const now = Date.now();

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

  let contentHtml = "";

  if (msg.messageType === "IMAGE" && msg.fileUrl) {
    contentHtml = `
    <div style="position:relative; display:inline-block;">
      <img src="${msg.fileUrl}" 
           alt="Image" 
           style="max-width:250px; max-height:300px; border-radius:8px; cursor:pointer; object-fit:cover;"
           onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='; this.style.objectFit='contain';"
           onclick="window.open('${msg.fileUrl}', '_blank')">
    </div>`;
  } else if (
    (msg.messageType === "DOCUMENT" || msg.messageType === "FILE") &&
    msg.fileName
  ) {
    if (!isMe) {
      contentHtml = `
        <div style="display:flex; align-items:stretch; background: rgba(0,0,0,0.05); border-radius:6px; min-width: 220px; border: 1px solid rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- FILE INFO -->
          <div style="flex:1; display:flex; align-items:center; gap:10px; padding: 10px;">
              <div style="background:#ffdddd; padding:8px 10px; border-radius:4px;">
                   <i class="fa-solid fa-file-pdf" style="font-size:24px; color:#d32f2f;"></i>
              </div>
              <div style="display:flex; flex-direction:column; justify-content:center;">
                <span style="font-weight:600; font-size:13px; color:#111; line-height:1.2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${
                  msg.fileName
                }</span>
                <span style="font-size:10px; color:#666; margin-top:2px;">${formatFileSize(
                  msg.fileSize || 0,
                )}</span>
              </div>
          </div>

          <!-- DOWNLOAD BUTTON - RECEIVER ONLY -->
         <a href="${msg.fileUrl}" 
   download="${msg.fileName}" 
   target="_blank"
   style="width: 50px; cursor: pointer; border-left: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.02); text-decoration: none;"
   onmouseover="this.style.background='rgba(0,0,0,0.1)'" 
   onmouseout="this.style.background='rgba(0,0,0,0.02)'"
   onclick="handleFileOpen(event, '${msg.fileUrl}', '${msg.fileName}', '${
     msg.messageType || "FILE"
   }')">
  <i class="fa-solid fa-download" style="color: #54656f; font-size: 16px;"></i>
</a>
        </div>`;
    } else {
      contentHtml = `
    <div style="display:flex; align-items:center; gap:12px; padding:12px 16px; background: rgba(0,0,0,0.05); border-radius:12px 12px 4px 12px; max-width:280px; border:1px solid rgba(0,0,0,0.08); 
               cursor:pointer; transition:background 0.2s;" 
           onclick="handleFileOpen(event, '${msg.fileUrl}', '${
             msg.fileName
           }', '${msg.messageType || "FILE"}')"
           onmouseover="this.style.background='rgba(0,0,0,0.08)'"
           onmouseout="this.style.background='rgba(0,0,0,0.05)'">
      <div style="background:#ffdddd; padding:8px; border-radius:6px; flex-shrink:0;">
        <i class="fa-solid fa-file-pdf" style="font-size:20px; color:#d32f2f;"></i>
      </div>
      <div style="flex:1; min-width:0;">
        <div style="font-weight:500; font-size:14px; color:#111b21; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:2px;">${
          msg.fileName
        }</div>
        <div style="font-size:11px; color:#667781; font-weight:400;">${formatFileSize(
          msg.fileSize || 0,
        )}</div>
      </div>
    </div>`;
    }
  } else {
    contentHtml = msg.content
      ? escapeHtml(msg.content)
      : "<em style='color:#999;'>[Empty message]</em>";
  }

  let metaHtml = "";
  if (isMe) {
    const isRead = msg.status === "READ";
    const tickIcon = isRead ? "fa-check-double" : "fa-check";
    const tickClass = isRead ? "tick read" : "tick";

    metaHtml = `
      <div class="msg-meta" style="display: flex; align-items: center; justify-content: flex-end; gap: 5px; margin-top: 4px;">
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
      </div>`;
  } else {
    metaHtml = `
      <div class="msg-meta" style="display: flex; align-items: center; justify-content: flex-start; gap: 5px; margin-top: 4px;">
        ${
          timeStr
            ? `<span class="msg-time" style="font-size: 0.7rem; color: #8696a0;">${timeStr}</span>`
            : ""
        }
      </div>`;
  }

  div.innerHTML = `
    <div class="message-content" style="max-width: 100%; word-wrap: break-word; color: #111b21;">
      <span style="display: block;">${contentHtml}</span>
      ${metaHtml}
    </div>
  `;
  msgContainer.appendChild(div);

  scrollToBottom();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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

  const date =
    typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp);

  // Always show time in HH:MM format
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ============================================
// 7. HELPER FUNCTIONS
// ============================================
function sendReadReceipt(originalSender) {
  const receipt = {
    sender: myEmail,
    receiver: originalSender,
    status: "READ",
  };
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
  if (d && d.scrollHeight > 0) {
    d.scrollTop = d.scrollHeight;
  }
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
    const list = document.getElementById("user-list");
    list.prepend(userItem);

    const badge = userItem.querySelector(".notification-badge");
    if (badge) {
      let count = parseInt(badge.innerText) || 0;
      badge.innerText = count + 1;
      badge.style.display = "block";
    }

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

      if (typingIndicator.style.display !== "block") {
        userStatus.style.display = "flex";

        if (data.isOnline) {
          indicator.style.background = "#31a24c";
          text.innerText = "Online";
        } else {
          indicator.style.background = "#8696a0";
          const formattedTime = formatTime2(data.lastSeen); 
          text.innerText = "Last seen " + formattedTime;
        }
      }
    })
    .catch((e) => console.log("Status check failed:", e));
}

function formatTime2(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    return `${diffMins}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const daysDiff = Math.floor((todayStart - dateStart) / (1000 * 60 * 60 * 24));

  if (daysDiff === 1) {
    return `yesterday at ${time}`;
  } else {
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${dateStr} at ${time}`;
  }
}

function subscribeToStatusUpdates() {
  if (stompClient && stompClient.connected) {
    stompClient.subscribe("/topic/status", function (message) {
      const statusUpdate = JSON.parse(message.body);
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

  stompClient.send(
    "/app/chat.typing",
    {},
    JSON.stringify({
      sender: myEmail,
      receiver: currentReceiverEmail,
      isTyping: true,
    }),
  );

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    stompClient.send(
      "/app/chat.typing",
      {},
      JSON.stringify({
        sender: myEmail,
        receiver: currentReceiverEmail,
        isTyping: false,
      }),
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
        userStatus.style.display = "none";
        typingIndicator.style.display = "block";
        typingIndicator.innerText = "Typing...";
      } else if (
        !typingData.isTyping &&
        typingData.sender === currentReceiverEmail
      ) {
        typingIndicator.style.display = "none";
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
      badge.style.display = "inline-block";
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
  container.innerHTML = "<p style='color:gray;'>Checking requests...</p>";
  openModal("reqModal");

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
      loadData();
      openRequestsModal();
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
      document.getElementById("chat-header").style.display = "none";
      document.getElementById("input-area").style.display = "none";
      document.getElementById("chat-messages").innerHTML = "";
      document.getElementById("welcome-screen").style.display = "flex";

      currentReceiverEmail = null;
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
// APPEND MESSAGE WITH DATE HEADER
// ============================================
function appendMessageWithDateHeader(msg) {
  const msgContainer = document.getElementById("chat-messages");

  if (!msgContainer) {
    console.warn("⚠️ Chat container missing - cannot show message");
    return;
  }

  if (msgContainer.style.display === "none") {
    console.warn("⚠️ Chat container hidden - making visible");
    msgContainer.style.display = "flex";
    msgContainer.style.flexDirection = "column";
  }

  const msgDate = new Date(msg.timestamp || Date.now());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const msgDayStart = new Date(
    msgDate.getFullYear(),
    msgDate.getMonth(),
    msgDate.getDate(),
  );

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
        lastDate.getDate(),
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

document
  .getElementById("fileInput")
  .addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      return;
    }

    const inputArea = document.getElementById("input-area");
    const uploadingIndicator = document.createElement("div");
    uploadingIndicator.id = "uploading-indicator";
    uploadingIndicator.innerHTML = "ðŸ“¤ Uploading...";
    uploadingIndicator.style.cssText =
      "position:absolute; bottom:60px; right:15px; background:#00a884; color:white; padding:8px 12px; border-radius:20px; font-size:0.85rem; z-index:100;";
    inputArea.parentNode.appendChild(uploadingIndicator);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8081/files/upload", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Server upload failed: " + response.status);
      }

      const fileData = await response.json();
      let type = fileData.messageType || "FILE";
      const ext = file.name.split(".").pop().toLowerCase();

      if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
        type = "IMAGE";
      } else if (["pdf", "doc", "docx", "txt"].includes(ext)) {
        type = "DOCUMENT";
      }

      const messageDto = {
        sender: myEmail,
        receiver: currentReceiverEmail,
        content: "",
        status: "SENT",
        timestamp: new Date().toISOString(),
        messageType: type,
        fileUrl: fileData.fileUrl,
        fileName: fileData.fileName || file.name,
        fileSize: fileData.fileSize || file.size,
      };

      stompClient.send("/app/chat", {}, JSON.stringify(messageDto));
      appendMessageWithDateHeader(messageDto);
    } catch (error) {
      console.error("âŒ File upload error:", error);
      alert("Failed to upload: " + error.message);
    } finally {
      document.getElementById("uploading-indicator")?.remove();
      document.getElementById("fileInput").value = "";
    }
  });

function showMessage(message) {
  const messagesDiv = document.getElementById("chat-messages");
  const messageDiv = document.createElement("div");
  messageDiv.className =
    message.senderEmail === localStorage.getItem("userEmail")
      ? "message sent"
      : "message received";

  if (message.messageType === "IMAGE") {
    messageDiv.innerHTML = `
      <div class="message-content">
        <img src="${
          message.fileUrl
        }" alt="Image" style="max-width:250px; max-height:300px; border-radius:8px; cursor:pointer;" onclick="window.open('${
          message.fileUrl
        }')">
        <div class="message-time">${formatTime(message.timestamp)}</div>
      </div>
    `;
  } else if (message.messageType === "DOCUMENT") {
    messageDiv.innerHTML = `
      <div class="message-content">
        <div style="display:flex; align-items:center; gap:8px; padding:12px; background:#f0f0f0; border-radius:8px; max-width:280px;">
          <i class="fa-solid fa-file-pdf" style="font-size:2rem; color:#d32f2f;"></i>
          <div>
            <div style="font-weight:500;">${message.fileName}</div>
            <div style="font-size:0.8rem; color:#666;">${formatFileSize(
              message.fileSize,
            )}</div>
          </div>
        </div>
        <div class="message-time">${formatTime(message.timestamp)}</div>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="message-content">${message.content}</div>
      <div class="message-time">${formatTime(message.timestamp)}</div>
    `;
  }

  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function handleFileOpen(event, fileUrl, fileName, fileType) {
  event.preventDefault();

  const ext = fileName.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "pdf"].includes(ext)) {
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>${fileName}</title></head>
      <body style="margin:0;padding:20px;background:#f5f5f5;">
        <div style="max-width:90vw;max-height:90vh;margin:auto;">
          ${
            ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
              ? `<img src="${fileUrl}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">`
              : `<embed src="${fileUrl}" type="application/pdf" style="width:100%;height:90vh;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">`
          }
        </div>
        <div style="text-align:center;margin-top:10px;">
          <a href="${fileUrl}" download="${fileName}" style="color:#007bff;text-decoration:none;">â¬‡ï¸ Download ${fileName}</a>
        </div>
      </body>
    </html>
    `);
  } else {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
