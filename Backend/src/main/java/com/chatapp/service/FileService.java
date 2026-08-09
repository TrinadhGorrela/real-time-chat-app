package com.chatapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileService {
    
    @Value("${app.upload-dir}")
    private String uploadDir;

    private Path fileStorageLocation;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "txt",
            "mp4", "webm", "ogg", "mov", "mkv", "avi",
            "mp3", "wav", "ppt", "pptx");

    @PostConstruct
    public void init() {
        try {
            this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(fileStorageLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    public String save(@NonNull MultipartFile file) {
        String rawFilename = file.getOriginalFilename();
        if (rawFilename == null || rawFilename.isBlank()) {
            throw new RuntimeException("File name is empty");
        }

        String originalFilename = StringUtils.cleanPath(rawFilename);
        String fileExtension = getFileExtension(originalFilename);

        if (!ALLOWED_EXTENSIONS.contains(fileExtension.toLowerCase())) {
            throw new RuntimeException("Invalid file type: " + fileExtension);
        }

        String filename = System.currentTimeMillis() + "_" +
                UUID.randomUUID().toString().substring(0, 8) +
                "." + fileExtension;

        Path targetLocation = fileStorageLocation.resolve(filename);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Could not store file: " + filename, e);
        }

        return "/files/" + filename;
    }

    public Resource load(String filename) {
        try {
            Path filePath = fileStorageLocation.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("File not found: " + filename);
            }
        } catch (IOException e) {
            throw new RuntimeException("Error loading file: " + filename, e);
        }
    }

    public boolean delete(String filename) {
        try {
            Path file = fileStorageLocation.resolve(filename);
            return Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null)
            return "";
        int lastDot = filename.lastIndexOf('.');
        return (lastDot > 0) ? filename.substring(lastDot + 1) : "";
    }

    public String determineMessageType(String contentType) {
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
        return type;
    }

    public String getContentTypeFromFilename(String filename) {
        String ext = getFileExtension(filename).toLowerCase();
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
