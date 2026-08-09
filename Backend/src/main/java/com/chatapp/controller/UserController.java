package com.chatapp.controller;

import com.chatapp.entity.User;
import com.chatapp.entity.Contact;
import com.chatapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/chatapp")
public class UserController {

    @Autowired
    private UserService userService;

    // ============================================
    // 1. REGISTRATION (New User)
    // ============================================
    @PostMapping("/adduser")
    public ResponseEntity<?> addUser(@RequestBody User user) {
        try {
            User savedUser = userService.registerUser(user);
            return ResponseEntity.ok(savedUser);
        } catch (UserService.UserAlreadyExistsException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Registration failed"));
        }
    }

    // ============================================
    // 2. LOGIN (Validate User & Generate Token)
    // ============================================
    @PostMapping("/validateuser")
    public ResponseEntity<?> login(@RequestBody User user) {
        try {
            Map<String, Object> response = userService.authenticateUser(user);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }
    }

    // ============================================
    // 3. SEND FRIEND REQUEST (Requires Approval)
    // ============================================
    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody Map<String, String> request, Principal principal) {
        String myEmail = principal.getName();
        String targetEmail = request.get("approver");

        try {
            userService.sendFriendRequest(myEmail, targetEmail);
            return ResponseEntity.ok(Map.of("message", "Friend request sent successfully!"));
        } catch (UserService.UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (UserService.InvalidOperationException e) {
            if (e.getMessage().equals("You cannot add yourself")) {
                return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ============================================
    // 4. GET PENDING REQUESTS
    // ============================================
    @GetMapping("/requests")
    public ResponseEntity<List<Contact>> getMyRequests(Principal principal) {
        String myEmail = principal.getName();
        List<Contact> requests = userService.getPendingRequests(myEmail);
        return ResponseEntity.ok(requests);
    }

    // ============================================
    // 5. ACCEPT REQUEST
    // ============================================
    @PostMapping("/accept")
    public ResponseEntity<?> acceptRequest(@RequestBody Map<String, Long> request, Principal principal) {
        String myEmail = principal.getName();
        Long requestId = request.get("id");

        boolean accepted = userService.acceptRequest(myEmail, requestId);
        if (accepted) {
            return ResponseEntity.ok(Map.of("message", "Friend request accepted!"));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid request"));
    }

    // ============================================
    // 6. GET CONTACT LIST
    // ============================================
    @GetMapping("/mycontacts")
    public ResponseEntity<List<User>> getContacts(Principal principal) {
        String myEmail = principal.getName();
        List<User> friends = userService.getContacts(myEmail);
        return ResponseEntity.ok(friends);
    }

    // ============================================
    // 7. DELETE/UNFRIEND
    // ============================================
    @PostMapping("/delete-contact")
    public ResponseEntity<?> deleteContact(@RequestBody Map<String, String> request, Principal principal) {
        String myEmail = principal.getName();
        String friendEmail = request.get("friend");

        if (friendEmail == null || friendEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Friend email required"));
        }

        try {
            userService.deleteContact(myEmail, friendEmail);
            return ResponseEntity.ok(Map.of("message", "Contact removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Error deleting contact", "error", e.getMessage()));
        }
    }

    // ============================================
    // 8. DECLINE REQUEST
    // ============================================
    @PostMapping("/decline")
    public ResponseEntity<?> declineRequest(@RequestBody Map<String, Long> request, Principal principal) {
        String myEmail = principal.getName();
        Long requestId = request.get("id");

        boolean declined = userService.declineRequest(myEmail, requestId);
        if (declined) {
            return ResponseEntity.ok(Map.of("message", "Request declined"));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Invalid request"));
    }

    // ============================================
    // 9. CHECK STATUS
    // ============================================
    @GetMapping("/status/check/{email}")
    public ResponseEntity<?> checkStatus(@PathVariable String email) {
        Map<String, Object> status = userService.checkStatus(email);
        if (status != null) {
            return ResponseEntity.ok(status);
        }
        return ResponseEntity.notFound().build();
    }

    // ============================================
    // 10. UPDATE PASSWORD
    // ============================================
    @PostMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> request, Principal principal) {
        String myEmail = principal.getName();
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (currentPassword == null || newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Both current and new passwords are required"));
        }

        try {
            userService.updatePassword(myEmail, currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (UserService.UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (UserService.UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ============================================
    // 11. UPDATE NAME
    // ============================================
    @PostMapping("/update-name")
    public ResponseEntity<?> updateName(@RequestBody Map<String, String> request, Principal principal) {
        String myEmail = principal.getName();
        String newName = request.get("newName");

        if (newName == null || newName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "New name is required"));
        }

        try {
            User updatedUser = userService.updateName(myEmail, newName);
            return ResponseEntity.ok(Map.of("message", "Name updated successfully", "newName", updatedUser.getName()));
        } catch (UserService.UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
