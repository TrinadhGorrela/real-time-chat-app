import { useState, useRef, useEffect } from "react";
import fileService from "../../services/fileService";
import styles from "./MessageInput.module.css";

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSend = () => {
    if (text.trim() && !uploading) {
      onSendMessage(text.trim());
      setText("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    onTyping();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileData = await fileService.uploadFile(selectedFile);

      const ext = selectedFile.name.split(".").pop().toLowerCase();
      let messageType = "FILE";
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
        messageType = "IMAGE";
      } else if (["pdf", "doc", "docx", "txt"].includes(ext)) {
        messageType = "DOCUMENT";
      }

      onSendMessage(caption.trim(), {
        messageType,
        fileUrl: fileData.fileUrl,
        fileName: fileData.fileName || selectedFile.name,
        fileSize: fileData.fileSize || selectedFile.size,
      });

      cancelPreview();
    } catch (err) {
      console.error("File upload failed:", err);
      alert("Failed to upload file: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const cancelPreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption("");
    setUploading(false);
  };

  return (
    <>
      {selectedFile && (
        <div className={styles.previewOverlay}>
          <div className={styles.previewHeader}>
            <button className={styles.closePreviewBtn} onClick={cancelPreview}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <span>Preview</span>
          </div>

          <div className={styles.previewBody}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className={styles.imagePreview}
              />
            ) : (
              <div className={styles.docPreview}>
                <i
                  className="fa-solid fa-file-pdf"
                  style={{ fontSize: "60px", color: "#d32f2f" }}
                ></i>
                <div className={styles.previewFileName}>
                  {selectedFile.name}
                </div>
                <div className={styles.previewFileSize}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            )}
          </div>

          <div className={styles.previewFooter}>
            <input
              type="text"
              className={styles.captionInput}
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={uploading}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmUpload();
              }}
            />
            <button
              className={styles.confirmSendBtn}
              onClick={handleConfirmUpload}
              disabled={uploading}
            >
              {uploading ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-solid fa-paper-plane"></i>
              )}
            </button>
          </div>
        </div>
      )}

      <div className={styles.inputArea}>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,.pdf,.doc,.docx,.txt"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        <button
          className={styles.plusBtn}
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          disabled={uploading}
        >
          <i className="fa-solid fa-plus" style={{ fontSize: "1.4rem" }}></i>
        </button>

        <input
          type="text"
          className={styles.msgInput}
          placeholder="Type a message"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyPress}
          disabled={uploading}
        />

        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!text.trim() || uploading}
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </>
  );
};

export default MessageInput;
