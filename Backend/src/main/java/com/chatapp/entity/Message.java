package com.chatapp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sender;

    @Column(nullable = false)
    private String receiver;

    @Column(columnDefinition = "TEXT")
    private String content = "";

    @Column(nullable = false)
    private String status = "SENT";

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime timestamp;

    @Column(name = "message_type")
    private String messageType = "TEXT";

    @Column(name = "file_url")
    private String fileUrl = "";

    @Column(name = "file_name")
    private String fileName = "";

    @Column(name = "file_size")
    private Long fileSize = 0L;

    public boolean isFileMessage() {
        return !"TEXT".equals(messageType);
    }
}
