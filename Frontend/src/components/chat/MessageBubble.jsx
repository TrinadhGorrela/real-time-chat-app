import { useState } from "react";
import { formatMessageTime } from "../../utils/dateFormatter";
import { formatFileSize, escapeHtml } from "../../utils/fileHelpers";
import styles from "./MessageBubble.module.css";
import CustomAudioPlayer from "./CustomAudioPlayer";

const MessageBubble = ({ message, isOwn, onDelete, onMediaClick }) => {
  const timeStr = formatMessageTime(message.timestamp);
  const isRead = message.status === "READ";

  const [imgLoaded, setImgLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const renderContent = () => {
    let mediaContent = null;

    // IMAGE
    if (message.messageType === "IMAGE" && message.fileUrl) {
      mediaContent = (
        <div className={styles.imageContent}>
          {!imgLoaded && (
            <div className={styles.loadingOverlay}>
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
          )}
          <img
            src={message.fileUrl}
            alt="Image"
            className={styles.messageImage}
            onLoad={() => setImgLoaded(true)}
            onClick={() => onMediaClick(message.fileUrl, "IMAGE")}
            style={{ display: imgLoaded ? "block" : "none" }}
            onError={(e) => {
              setImgLoaded(true); // Stop spinner on error
              e.target.src =
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=";
            }}
          />
          {/* Keep a placeholder visible if hidden to avoid layout shift, or just rely on overlay */}
          {!imgLoaded && (
            <div style={{ width: "200px", height: "200px" }}></div>
          )}
        </div>
      );
    }
    // VIDEO
    else if (message.messageType === "VIDEO" && message.fileUrl) {
      mediaContent = (
        <div
          className={styles.videoContainer}
          onClick={() => onMediaClick(message.fileUrl, "VIDEO")}
        >
          {!videoLoaded && (
            <div className={styles.loadingOverlay}>
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
          )}
          <video
            src={message.fileUrl}
            className={styles.messageVideo}
            preload="metadata"
            muted
            onLoadedData={() => setVideoLoaded(true)}
          />
          {videoLoaded && (
            <div className={styles.playOverlay}>
              <i className={`fa-solid fa-play ${styles.playIcon}`}></i>
            </div>
          )}
        </div>
      );
    }
    // AUDIO
    else if (message.messageType === "AUDIO" && message.fileUrl) {
      mediaContent = (
        <div
          className={styles.audioContent}
          style={{ minWidth: "250px", padding: "10px" }}
        >
          <CustomAudioPlayer src={message.fileUrl} />
        </div>
      );
    }
    // FILE / DOCUMENT
    else if (
      (message.messageType === "DOCUMENT" || message.messageType === "FILE") &&
      message.fileName
    ) {
      mediaContent = (
        <div
          className={isOwn ? styles.fileContentOwn : styles.fileContentOther}
          onClick={() => window.open(message.fileUrl, "_blank")}
        >
          <div className={styles.fileIcon}>
            <i
              className={getIconClass(message.fileName)}
              style={{
                fontSize: "24px",
                color: getIconColor(message.fileName),
              }}
            ></i>
          </div>

          <div className={styles.fileInfo}>
            <div className={styles.fileName}>{message.fileName}</div>
            <div className={styles.fileSize}>
              {formatFileSize(message.fileSize || 0)}
            </div>
          </div>
          <div className={styles.downloadBtn}>
            <i className="fa-solid fa-download"></i>
          </div>
        </div>
      );
    }

    // Only render text if it's purely text OR if it's a caption (exclude empty strings)
    const hasText = message.content && message.content.trim().length > 0;

    if (!mediaContent && !hasText) {
      return <em style={{ color: "#999" }}>[Empty message]</em>;
    }

    return (
      <div className={styles.bubbleContent}>
        {mediaContent}
        {hasText && (
          <span
            className={styles.messageText}
            style={mediaContent ? { marginTop: "5px", display: "block" } : {}}
            dangerouslySetInnerHTML={{
              __html: escapeHtml(message.content),
            }}
          />
        )}
      </div>
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
              onClick={(e) => {
                e.stopPropagation();
                onDelete(message.id);
              }}
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

const getIconClass = (fileName) => {
  if (!fileName) return "fa-solid fa-file";
  const ext = fileName.split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return "fa-solid fa-file-pdf";
  if (["doc", "docx"].includes(ext)) return "fa-solid fa-file-word";
  if (["xls", "xlsx"].includes(ext)) return "fa-solid fa-file-excel";
  if (["ppt", "pptx"].includes(ext)) return "fa-solid fa-file-powerpoint";
  if (["txt"].includes(ext)) return "fa-solid fa-file-lines";
  if (["mp3", "wav"].includes(ext)) return "fa-solid fa-file-audio";
  return "fa-solid fa-file";
};

const getIconColor = (fileName) => {
  if (!fileName) return "#666";
  const ext = fileName.split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return "#d32f2f";
  if (["doc", "docx"].includes(ext)) return "#2b579a";
  if (["xls", "xlsx"].includes(ext)) return "#217346";
  if (["ppt", "pptx"].includes(ext)) return "#d24726";
  if (["txt"].includes(ext)) return "#666";
  if (["mp3", "wav"].includes(ext)) return "#a020f0";
  return "#666";
};

export default MessageBubble;
