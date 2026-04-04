import { useState, useRef, useEffect } from "react";
import fileService from "../../services/fileService";
import { getFileIconClass, getFileIconColor } from "../../utils/fileHelpers";
import styles from "./MessageInput.module.css";
import ConfirmModal from "../modals/ConfirmModal";
import CustomAudioPlayer from "./CustomAudioPlayer";

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const MAX_SIZE = 70 * 1024 * 1024;

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    if (
      selectedFile.type.startsWith("image/") ||
      selectedFile.type.startsWith("video/") ||
      selectedFile.type.startsWith("audio/")
    ) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

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

    if (file.size > MAX_SIZE) {
      setErrorMessage(
        "This file exceeds the upload limit (70MB). Please select a smaller file.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);

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
      } else if (["mp4", "webm", "ogg", "mov", "mkv", "avi"].includes(ext)) {
        messageType = "VIDEO";
      } else if (["mp3", "wav", "mpeg"].includes(ext)) {
        messageType = "AUDIO";
      } else if (
        ["pdf", "doc", "docx", "txt", "ppt", "pptx", "xls", "xlsx"].includes(
          ext,
        )
      ) {
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
      let msg =
        "Upload failed: " + (err.response?.data?.message || err.message);
      if (err.code === "ECONNABORTED") {
        msg =
          "Upload failed: Request timed out. internet connection might be slow.";
      }
      setErrorMessage(msg);
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
            <span>{selectedFile.name}</span>
          </div>

          <div className={styles.previewBody}>
            {previewUrl ? (
              selectedFile?.type.startsWith("video/") ? (
                <video
                  key={previewUrl}
                  controls
                  playsInline
                  className={styles.imagePreview}
                >
                  <source src={previewUrl} type={selectedFile.type} />
                  Your browser does not support the video tag.
                </video>
              ) : selectedFile?.type.startsWith("audio/") ? (
                <div className={styles.audioPreview}>
                  <CustomAudioPlayer src={previewUrl} />
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className={styles.imagePreview}
                />
              )
            ) : (
              <div className={styles.docPreview}>
                <i
                  className={getFileIconClass(selectedFile.name)}
                  style={{
                    fontSize: "60px",
                    color: getFileIconColor(selectedFile.name),
                  }}
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
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
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
      {errorMessage && (
        <ConfirmModal
          title="Upload Error"
          message={errorMessage}
          confirmText="Ok"
          isDanger={true}
          onConfirm={() => setErrorMessage(null)}
        />
      )}
    </>
  );
};

export default MessageInput;
