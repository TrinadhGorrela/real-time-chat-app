package com.chatapp.controller;

import com.chatapp.entity.Message;
import com.chatapp.repository.MessageRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:8081")
public class ChatController {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @Autowired
    private MessageRepo messageRepo;

    // ============================================
    // 1. SENDING MESSAGES (WebSocket)
    // ============================================
    @MessageMapping("/chat.sendMessage")
    public Message sendMessage(@Payload Message chatMessage) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String senderEmail = auth != null ? auth.getName() : null;

        if (senderEmail == null) {
            senderEmail = chatMessage.getSender();
        }

        senderEmail = senderEmail.trim().toLowerCase();
        String receiverEmail = chatMessage.getReceiver().trim().toLowerCase();

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
            simpMessagingTemplate.convertAndSend("/topic/private/" + originalSender, receipt);
            messageRepo.markMessagesAsRead(originalSender, receipt.getSender());
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
    @DeleteMapping("/chatapp/message/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        if (messageRepo.existsById(id)) {
            messageRepo.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

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

}