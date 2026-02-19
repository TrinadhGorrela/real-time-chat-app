package com.chatapp.controller;

import com.chatapp.service.FilesStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/files")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:8081" }, allowCredentials = "true")
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
                else if (contentType.contains("pdf") || contentType.contains("word") || contentType.contains("text"))
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

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        Resource file = filesStorageService.load(filename);

        if (file != null && file.exists()) {
            String contentType = getContentTypeFromFilename(filename);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:3000")
                    .header(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true")
                    .body(file);
        }

        return ResponseEntity.notFound().build();
    }

    @RequestMapping(method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOptions() {
        return ResponseEntity.ok()
                .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:3000")
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
            case "ppt", "pptx" -> "application/vnd.ms-powerpoint";
            case "mp4" -> "video/mp4";
            default -> "application/octet-stream";
        };
    }
}