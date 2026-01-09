package com.chatapp.controller;

import com.chatapp.entity.Friendship;
import com.chatapp.entity.Message;
import com.chatapp.entity.User;
import com.chatapp.repository.FriendshipRepository;
import com.chatapp.repository.MessageRepo;
import com.chatapp.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "http://localhost:8081")
public class AdminController {

    @Autowired
    private UserRepository userRepo;
    @Autowired
    private MessageRepo messageRepo;
    @Autowired
    private FriendshipRepository friendRepo;

    private static final String ADMIN_SECRET = "Trinadh462";

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestHeader(value = "admin-password", required = false) String password) {
        if (!ADMIN_SECRET.equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Access Denied");
        }
        return ResponseEntity.ok(userRepo.findAll());
    }

    @GetMapping("/messages")
    public ResponseEntity<?> getAllMessages(
            @RequestHeader(value = "admin-password", required = false) String password) {
        if (!ADMIN_SECRET.equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Access Denied");
        }
        return ResponseEntity.ok(messageRepo.findAll());
    }

    @GetMapping("/contacts")
    public ResponseEntity<?> getAllContacts(
            @RequestHeader(value = "admin-password", required = false) String password) {
        if (!ADMIN_SECRET.equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Access Denied");
        }
        return ResponseEntity.ok(friendRepo.findAll());
    }
}