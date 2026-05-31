package com.chatapp.controller;

import com.chatapp.service.FilesStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/files")
public class FileController {

    @Autowired
    private FilesStorageService filesStorageService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String fileUrl = filesStorageService.save(file);
            String contentType = file.getContentType();
            String type = "FILE";
            if (contentType != null) {
                if (contentType.startsWith("image/"))
                    type = "IMAGE";
                else if (contentType.startsWith("video/"))
                    type = "VIDEO";
                else if (contentType.startsWith("audio/"))
                    type = "AUDIO";
                else if (contentType.contains("pdf") || contentType.contains("word") || contentType.contains("text")
                        || contentType.contains("presentation") || contentType.contains("powerpoint"))
                    type = "DOCUMENT";
            }

            Map<String, Object> response = Map.of(
                    "messageType", type,
                    "fileUrl", fileUrl,
                    "fileName", file.getOriginalFilename(),
                    "fileSize", file.getSize());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of(
                        "message", "File is too large!",
                        "details", "The maximum allowed limit has been exceeded. Please upload a smaller file.",
                        "status", HttpStatus.PAYLOAD_TOO_LARGE.value()));
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        Resource file = filesStorageService.load(filename);

        if (file != null && file.exists()) {
            String contentType = getContentTypeFromFilename(filename);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .header(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true")
                    .body(file);
        }

        return ResponseEntity.notFound().build();
    }

    @RequestMapping(method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOptions() {
        return ResponseEntity.ok()
                .header(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, "GET, POST, OPTIONS")
                .header(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "*")
                .header(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true")
                .build();
    }

    private String getContentTypeFromFilename(String filename) {
        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        return switch (ext) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "pdf" -> "application/pdf";
            case "txt" -> "text/plain";
            case "doc", "docx" -> "application/msword";
            case "xls", "xlsx" -> "application/vnd.ms-excel";
            case "mp4" -> "video/mp4";
            case "webm" -> "video/webm";
            case "ogg" -> "video/ogg";
            case "mov" -> "video/quicktime";
            case "mkv" -> "video/x-matroska";
            case "avi" -> "video/x-msvideo";
            case "mp3" -> "audio/mpeg";
            case "wav" -> "audio/wav";
            case "ppt" -> "application/vnd.ms-powerpoint";
            case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            default -> "application/octet-stream";
        };
    }
}