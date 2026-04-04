export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileIconClass = (fileName) => {
  if (!fileName) return "fa-solid fa-file";
  const ext = fileName.split(".").pop().toLowerCase();
  const iconMap = {
    pdf: "fa-solid fa-file-pdf",
    doc: "fa-solid fa-file-word",
    docx: "fa-solid fa-file-word",
    xls: "fa-solid fa-file-excel",
    xlsx: "fa-solid fa-file-excel",
    ppt: "fa-solid fa-file-powerpoint",
    pptx: "fa-solid fa-file-powerpoint",
    txt: "fa-solid fa-file-lines",
    mp3: "fa-solid fa-file-audio",
    wav: "fa-solid fa-file-audio",
    jpg: "fa-solid fa-file-image",
    jpeg: "fa-solid fa-file-image",
    png: "fa-solid fa-file-image",
    gif: "fa-solid fa-file-image",
  };
  return iconMap[ext] || "fa-solid fa-file";
};

export const getFileIconColor = (fileName) => {
  if (!fileName) return "#666";
  const ext = fileName.split(".").pop().toLowerCase();
  const colorMap = {
    pdf: "#d32f2f",
    doc: "#2b579a",
    docx: "#2b579a",
    xls: "#217346",
    xlsx: "#217346",
    ppt: "#d24726",
    pptx: "#d24726",
    txt: "#666",
    mp3: "#a020f0",
    wav: "#a020f0",
    jpg: "#4caf50",
    jpeg: "#4caf50",
    png: "#4caf50",
    gif: "#9c27b0",
  };
  return colorMap[ext] || "#666";
};

export const getMessageType = (file) => {
  const ext = file.name.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "IMAGE";
  if (["mp4", "webm", "ogg"].includes(ext)) return "VIDEO";
  if (["pdf", "doc", "docx", "txt"].includes(ext)) return "DOCUMENT";
  return "FILE";
};

export const handleFileOpen = (fileUrl, fileName) => {
  const ext = fileName.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "pdf"].includes(ext)) {
    const newWindow = window.open("", "_blank");
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
    newWindow.document.write(`
      <!DOCTYPE html><html>
      <head><title>${fileName}</title></head>
      <body style="margin:0;padding:20px;background:#111;display:flex;flex-direction:column;align-items:center;min-height:100vh;">
        ${
          isImage
            ? `<img src="${fileUrl}" style="max-width:90vw;max-height:85vh;object-fit:contain;border-radius:8px;">`
            : `<embed src="${fileUrl}" type="application/pdf" style="width:90vw;height:85vh;border-radius:8px;">`
        }
        <a href="${fileUrl}" download="${fileName}"
           style="margin-top:15px;color:#4fc3f7;text-decoration:none;font-family:sans-serif;">
          ⬇️ Download ${fileName}
        </a>
      </body></html>
    `);
  } else {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

export const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};
