package com.chatapp.controller;

import com.chatapp.entity.Message;
import com.chatapp.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
public class ChatController {

    @Autowired
    private ChatService chatService;

    // ============================================
    // 1. SENDING MESSAGES (WebSocket)
    // ============================================
    @MessageMapping("/chat")
    @SendToUser("/queue/private-chat")
    public Message sendMessage(@Payload Message chatMessage) {
        return chatService.processAndSendMessage(chatMessage);
    }

    // ============================================
    // 2. READ RECEIPT (WebSocket)
    // ============================================
    @MessageMapping("/chat.readMessage")
    public void sendReadReceipt(@Payload Message receipt) {
        chatService.processReadReceipt(receipt);
    }

    // ============================================
    // 3. GET HISTORY (REST API)
    // ============================================
    @GetMapping("/chatapp/messages/{user1}/{user2}")
    public List<Message> getChatHistory(@PathVariable String user1, @PathVariable String user2) {
        return chatService.getChatHistory(user1, user2);
    }

    // ============================================
    // 4. DELETE MESSAGE (REST API)
    // ============================================
    @DeleteMapping("/chatapp/message/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        boolean deleted = chatService.deleteMessage(id);
        if (deleted) {
            return ResponseEntity.ok().<Void>build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // ============================================
    // 5. Typing Indicator (WebSocket)
    // ============================================
    @MessageMapping("/chat.typing")
    public void sendTypingStatus(@Payload Map<String, String> typingStatus) {
        chatService.processTypingStatus(typingStatus);
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
            chatService.clearChat(myEmail, friendEmail);
            return ResponseEntity.ok(Map.of("message", "Chat cleared successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Error clearing chat", "error", e.getMessage()));
        }
    }

}