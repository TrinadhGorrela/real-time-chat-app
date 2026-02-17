import { formatMessageTime } from "../../utils/dateFormatter";
import {
  formatFileSize,
  escapeHtml,
} from "../../utils/fileHelpers";
import styles from "./MessageBubble.module.css";

const MessageBubble = ({ message, isOwn, onDelete }) => {
  const timeStr = formatMessageTime(message.timestamp);
  const isRead = message.status === "READ";

  const renderContent = () => {
    // IMAGE
    if (message.messageType === "IMAGE" && message.fileUrl) {
      return (
        <div className={styles.imageContent}>
          <img
            src={message.fileUrl}
            alt="Image"
            className={styles.messageImage}
            onClick={() => window.open(message.fileUrl, "_blank")}
            onError={(e) => {
              e.target.src =
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=";
            }}
          />
        </div>
      );
    }

 // DOCUMENT / FILE
    if (
      (message.messageType === "DOCUMENT" || message.messageType === "FILE") &&
      message.fileName
    ) {
      // Both Sender and Receiver get a clickable card that opens the file in a new tab
      return (
        <div
          className={isOwn ? styles.fileContentOwn : styles.fileContentOther}
          onClick={() => window.open(message.fileUrl, "_blank")}
        >
          <div className={styles.fileIcon}>
            <i
              className="fa-solid fa-file-pdf"
              style={{ fontSize: "24px", color: "#d32f2f" }}
            ></i>
          </div>
          
          <div className={styles.fileInfo}>
            <div className={styles.fileName}>{message.fileName}</div>
            <div className={styles.fileSize}>
              {formatFileSize(message.fileSize || 0)}
            </div>
          </div>

          {/* Download icon just for visual familiarity (WhatsApp Web does this) */}
          <div className={styles.downloadBtn}>
             <i className="fa-solid fa-download"></i>
          </div>
        </div>
      );
    }


    // TEXT
    return (
      <span
        className={styles.messageText}
        dangerouslySetInnerHTML={{
          __html: message.content
            ? escapeHtml(message.content)
            : '<em style="color:#999">[Empty message]</em>',
        }}
      />
    );
  };

  return (
    <div
      className={`${styles.message} ${isOwn ? styles.myMessage : styles.otherMessage}`}
    >
      <div className={styles.messageContent}>
        {renderContent()}
        <div className={styles.msgMeta}>
          {isOwn && message.id && !String(message.id).startsWith("temp") && (
            <i
              className={`fa-solid fa-trash ${styles.deleteBtn}`}
              onClick={() => onDelete(message.id)}
              title="Delete"
            />
          )}
          {timeStr && <span className={styles.msgTime}>{timeStr}</span>}
          {isOwn && (
            <span className={styles.tick}>
              <i
                className={`fa-solid ${isRead ? "fa-check-double" : "fa-check"}`}
                style={{
                  color: isRead ? "#53bdeb" : "#8696a0",
                  fontSize: "10px",
                }}
              />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
