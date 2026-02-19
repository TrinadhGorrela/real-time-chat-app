import { useEffect } from "react";
import styles from "./MediaModal.module.css";

const MediaModal = ({ fileUrl, type, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.header}>
        <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); handleDownload(fileUrl); }} title="Download">
          <i className="fa-solid fa-download"></i>
        </button>
        <button className={styles.actionBtn} onClick={onClose} title="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        {type === "VIDEO" ? (
          <video src={fileUrl} controls autoPlay className={styles.media} />
        ) : (
          <img src={fileUrl} alt="Media" className={styles.media} />
        )}
      </div>
    </div>
  );
};

const handleDownload = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = url.split('/').pop() || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed:", error);
    window.open(url, '_blank');
  }
};

export default MediaModal;
