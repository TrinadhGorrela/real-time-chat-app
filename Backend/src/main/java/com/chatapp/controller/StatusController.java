package com.chatapp.controller;

import com.chatapp.entity.User;
import com.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/chatapp/status")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"}, allowCredentials = "true")
public class StatusController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/online")
    public ResponseEntity<?> setOnline() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthenticated");
        }

        String email = auth.getName(); 
        User user = userRepository.findByEmail(email);

        if (user != null) {
            user.setOnline(true);
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("status", "online"));
        }
        return ResponseEntity.badRequest().body("User not found");
    }

    @PostMapping("/offline")
    public ResponseEntity<?> setOffline() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthenticated");
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email);

        if (user != null) {
            user.setOnline(false);
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                    "status", "offline",
                    "lastSeen", user.getLastSeen()));
        }
        return ResponseEntity.badRequest().body("User not found");
    }

    @GetMapping("/check/{email}")
    public ResponseEntity<?> checkStatus(@PathVariable String email) {
        User user = userRepository.findByEmail(email);

        if (user != null) {
            return ResponseEntity.ok(Map.of(
                    "email", user.getEmail(),
                    "isOnline", user.isOnline(),
                    "lastSeen", user.getLastSeen()));
        }
        return ResponseEntity.notFound().build();
    }

    @MessageMapping("/status.update")
    @SendTo("/topic/status")
    public Map<String, Object> updateStatus(@Payload Map<String, String> statusUpdate) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (auth != null) ? auth.getName() : null;
        String status = statusUpdate.get("status");

        if (email != null) {
            User user = userRepository.findByEmail(email);
            if (user != null) {
                user.setOnline("online".equals(status));
                user.setLastSeen(LocalDateTime.now());
                userRepository.save(user);
            }
        }

        return Map.of(
                "email", email,
                "status", status,
                "timestamp", LocalDateTime.now());
    }
}
