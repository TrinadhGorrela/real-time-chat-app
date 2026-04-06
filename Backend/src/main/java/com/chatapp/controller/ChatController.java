package com.chatapp.controller;

import com.chatapp.entity.Message;
import com.chatapp.repository.MessageRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
public class ChatController {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @Autowired
    private MessageRepo messageRepo;

    // ============================================
    // 1. SENDING MESSAGES (WebSocket)
    // ============================================
    @MessageMapping("/chat")
    @SendToUser("/queue/private-chat")
    @Transactional
    public Message sendMessage(@Payload Message chatMessage) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String senderEmail = auth != null ? auth.getName() : null;

        if (senderEmail == null) {
            senderEmail = chatMessage.getSender();
        }

        senderEmail = senderEmail.trim().toLowerCase();
        String receiverEmail = chatMessage.getReceiver().trim().toLowerCase();

        if (chatMessage.getContent() == null)
            chatMessage.setContent("");
        if (chatMessage.getFileUrl() == null)
            chatMessage.setFileUrl("");
        if (chatMessage.getFileName() == null)
            chatMessage.setFileName("");

        chatMessage.setSender(senderEmail);
        chatMessage.setReceiver(receiverEmail);
        chatMessage.setStatus("SENT");
        chatMessage.setTimestamp(LocalDateTime.now());

        Message saved = messageRepo.save(chatMessage);
        simpMessagingTemplate.convertAndSend("/topic/private/" + saved.getReceiver(), saved);
        simpMessagingTemplate.convertAndSend("/topic/private/" + saved.getSender(), saved);
        return saved;
    }

    // ============================================
    // 2. READ RECEIPT (WebSocket)
    // ============================================
    @MessageMapping("/chat.readMessage")
    public void sendReadReceipt(@Payload Message receipt) {
        if (receipt.getReceiver() != null) {
            String originalSender = receipt.getReceiver();
            String reader = receipt.getSender();
            messageRepo.markMessagesAsRead(originalSender, reader);
            Map<String, Object> readEvent = Map.of(
                    "type", "READ_RECEIPT",
                    "reader", reader);

            simpMessagingTemplate.convertAndSend("/topic/private/" + originalSender, readEvent);
        }
    }

    // ============================================
    // 3. GET HISTORY (REST API)
    // ============================================
    @GetMapping("/chatapp/messages/{user1}/{user2}")
    public List<Message> getChatHistory(@PathVariable String user1, @PathVariable String user2) {
        return messageRepo.findConversation(
                user1.trim().toLowerCase(),
                user2.trim().toLowerCase());
    }

    // ============================================
    // 4. DELETE MESSAGE (REST API)
    // ============================================
    @Autowired
    private com.chatapp.service.FilesStorageService filesStorageService;

    @DeleteMapping("/chatapp/message/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        return messageRepo.findById(id).map(message -> {
            if (message.getFileUrl() != null && !message.getFileUrl().isEmpty()) {
                String fileUrl = message.getFileUrl();
                String storedFilename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
                filesStorageService.delete(storedFilename);
            }

            messageRepo.delete(message);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // ============================================
    // 5. Typing Indicator (WebSocket)
    // ============================================
    @MessageMapping("/chat.typing")
    public void sendTypingStatus(@Payload Map<String, String> typingStatus) {
        String receiver = typingStatus.get("receiver");
        String sender = typingStatus.get("sender");
        String isTyping = typingStatus.get("isTyping");

        simpMessagingTemplate.convertAndSend(
                "/topic/typing/" + receiver.toLowerCase(),
                Map.of(
                        "sender", sender.toLowerCase(),
                        "isTyping", "true".equals(isTyping)));
    }

    // ============================================
    // 6. CLEAR CHAT (REST API)
    // ============================================
    @PostMapping("/chatapp/clear-chat")
    public ResponseEntity<?> clearChat(@RequestBody Map<String, String> request, Principal principal) {
        String myEmail = principal.getName();
        String friendEmail = request.get("friend");

        if (friendEmail == null || friendEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Friend email required"));
        }

        try {
            messageRepo.deleteConversation(myEmail, friendEmail);
            System.out.println("Purged conversation history between: " + myEmail + " and " + friendEmail);
            return ResponseEntity.ok(Map.of("message", "Chat cleared successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Error clearing chat", "error", e.getMessage()));
        }
    }

}