package com.chatapp.controller;

import com.chatapp.entity.User;
import com.chatapp.entity.Friendship;
import com.chatapp.entity.Message;
import com.chatapp.repository.UserRepository;
import com.chatapp.repository.FriendshipRepository;
import com.chatapp.repository.MessageRepo;
import com.chatapp.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/chatapp")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private MessageRepo messageRepo;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    // ============================================
    // 1. REGISTRATION (Add User)
    // ============================================
    @PostMapping("/adduser")
    public ResponseEntity<?> addUser(@RequestBody User user) {
        try {
            if (userRepository.findByEmail(user.getEmail()) != null) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Email already exists"));
            }
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(savedUser);
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
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword()));

            String token = jwtUtil.generateToken(user.getEmail());
            User dbUser = userRepository.findByEmail(user.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", Map.of(
                    "email", dbUser.getEmail(),
                    "name", dbUser.getName()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }
    }

    // ============================================
    // 3. SEND REQUEST (Requires Approval)
    // ============================================
    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody Map<String, String> request, Principal principal) {
        String myEmail = principal.getName();
        String targetEmail = request.get("approver");

        if (myEmail.equalsIgnoreCase(targetEmail)) {
            return ResponseEntity.badRequest().body(Map.of("message", "You cannot add yourself"));
        }

        User targetUser = userRepository.findByEmail(targetEmail);
        if (targetUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        List<Friendship> existing1 = friendshipRepository.findByUserEmailAndFriendEmail(targetEmail, myEmail);
        List<Friendship> existing2 = friendshipRepository.findByUserEmailAndFriendEmail(myEmail, targetEmail);

        if (!existing1.isEmpty() || !existing2.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Request already pending or you are already friends"));
        }

        Friendship pending = new Friendship();
        pending.setUserEmail(targetEmail);
        pending.setFriendEmail(myEmail);
        pending.setStatus("PENDING");
        friendshipRepository.save(pending);

        return ResponseEntity.ok(Map.of("message", "Friend request sent successfully!"));
    }

    // ============================================
    // 4. GET PENDING REQUESTS
    // ============================================
    @GetMapping("/requests")
    public ResponseEntity<List<Friendship>> getMyRequests(Principal principal) {
        String myEmail = principal.getName();
        List<Friendship> requests = friendshipRepository.findByUserEmailAndStatus(myEmail, "PENDING");
        return ResponseEntity.ok(requests);
    }

    // ============================================
    // 5. ACCEPT REQUEST
    // ============================================
    @PostMapping("/accept")
    public ResponseEntity<?> acceptRequest(@RequestBody Map<String, Long> request, Principal principal) {
        String myEmail = principal.getName();
        Long requestId = request.get("id");

        Friendship f = friendshipRepository.findById(requestId).orElse(null);

        if (f != null && f.getUserEmail().equalsIgnoreCase(myEmail)) {
            f.setStatus("ACCEPTED");
            friendshipRepository.save(f);

            Friendship reverse = new Friendship();
            reverse.setUserEmail(f.getFriendEmail());
            reverse.setFriendEmail(myEmail);
            reverse.setStatus("ACCEPTED");
            friendshipRepository.save(reverse);

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
        List<Friendship> friendships = friendshipRepository.findByUserEmailAndStatus(myEmail, "ACCEPTED");

        // Batch fetch all friends at once
        List<String> friendEmails = friendships.stream()
                .map(Friendship::getFriendEmail)
                .collect(Collectors.toList());
        
        if (friendEmails.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<User> friends = userRepository.findByEmailIn(friendEmails);

        friends.forEach(friend -> {
            Message lastMsg = messageRepo.findLatestMessage(myEmail, friend.getEmail()).orElse(null);
            if (lastMsg != null) {
                friend.setLastMessageTime(lastMsg.getTimestamp());
            }
            long unread = messageRepo.countUnreadMessages(friend.getEmail(), myEmail);
            friend.setUnreadCount((int) unread);
        });

        return ResponseEntity.ok(friends);
    }

    // ============================================
    // 7. DELETE/UNFRIEND
    // ============================================
    @PostMapping("/delete-contact")
    public ResponseEntity<?> deleteContact(@RequestBody Map<String, String> request,
            Principal principal) {
        String myEmail = principal.getName();
        String friendEmail = request.get("friend");

        if (friendEmail == null || friendEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Friend email required"));
        }

        try {
            List<Friendship> f1 = friendshipRepository.findByUserEmailAndFriendEmail(myEmail, friendEmail);
            List<Friendship> f2 = friendshipRepository.findByUserEmailAndFriendEmail(friendEmail, myEmail);

            if (!f1.isEmpty()) {
                friendshipRepository.deleteAll(f1);
                System.out.println("Deleted: " + myEmail + " -> " + friendEmail);
            }
            if (!f2.isEmpty()) {
                friendshipRepository.deleteAll(f2);
                System.out.println("Deleted: " + friendEmail + " -> " + myEmail);
            }

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

        Friendship f = friendshipRepository.findById(requestId).orElse(null);

        if (f != null && f.getUserEmail().equalsIgnoreCase(myEmail)) {
            friendshipRepository.delete(f);
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
        User user = userRepository.findByEmail(email);
        if (user != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("email", user.getEmail());
            response.put("isOnline", user.isOnline());
            response.put("lastSeen", user.getLastSeen() != null ? user.getLastSeen().toString() : null);
            return ResponseEntity.ok(response);
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

        User user = userRepository.findByEmail(myEmail);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Incorrect current password"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
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

        User user = userRepository.findByEmail(myEmail);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        user.setName(newName.trim());
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Name updated successfully", "newName", user.getName()));
    }

}
