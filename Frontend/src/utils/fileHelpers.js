// Format bytes → "1.5 MB", "340 KB"
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get Font Awesome icon class for file type
export const getFileIcon = (fileName) => {
  if (!fileName) return 'fa-file';
  const ext = fileName.split('.').pop().toLowerCase();
  const icons = {
    pdf: 'fa-file-pdf',
    doc: 'fa-file-word',
    docx: 'fa-file-word',
    txt: 'fa-file-lines',
    jpg: 'fa-file-image',
    jpeg: 'fa-file-image',
    png: 'fa-file-image',
    gif: 'fa-file-image',
  };
  return icons[ext] || 'fa-file';
};

// Get color for file icon
export const getFileIconColor = (fileName) => {
  if (!fileName) return '#666';
  const ext = fileName.split('.').pop().toLowerCase();
  const colors = {
    pdf: '#d32f2f',
    doc: '#2196f3',
    docx: '#2196f3',
    txt: '#666',
    jpg: '#4caf50',
    jpeg: '#4caf50',
    png: '#4caf50',
    gif: '#9c27b0',
  };
  return colors[ext] || '#666';
};

// Determine message type from a File object
export const getMessageType = (file) => {
  const ext = file.name.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'IMAGE';
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return 'DOCUMENT';
  return 'FILE';
};

// Open a file URL in a new window or trigger download
export const handleFileOpen = (fileUrl, fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(ext)) {
    const newWindow = window.open('', '_blank');
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    newWindow.document.write(`
      <!DOCTYPE html><html>
      <head><title>${fileName}</title></head>
      <body style="margin:0;padding:20px;background:#111;display:flex;flex-direction:column;align-items:center;min-height:100vh;">
        ${isImage
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
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

// Escape HTML to prevent XSS in message content
export const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};