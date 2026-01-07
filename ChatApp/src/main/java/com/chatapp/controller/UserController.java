package com.chatapp.controller;

import com.chatapp.entity.User;
import com.chatapp.entity.Friendship;
import com.chatapp.repository.UserRepository;
import com.chatapp.repository.FriendshipRepository;
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
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

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
            // Encrypt password before saving
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
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
            // Authenticate using Spring Security
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword()));

            // Generate JWT Token
            String token = jwtUtil.generateToken(user.getEmail());
            User dbUser = userRepository.findByEmail(user.getEmail());

            // Prepare Response
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", Map.of(
                    "email", dbUser.getEmail(),
                    "name", dbUser.getName()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Return JSON even on failure to avoid "Unexpected end of JSON" error
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

        Friendship existing1 = friendshipRepository.findByUserEmailAndFriendEmail(targetEmail, myEmail);
        Friendship existing2 = friendshipRepository.findByUserEmailAndFriendEmail(myEmail, targetEmail);

        if (existing1 != null || existing2 != null) {
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

        List<User> friends = friendships.stream()
                .map(f -> userRepository.findByEmail(f.getFriendEmail()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

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
            // Delete BOTH directions of friendship
            Friendship f1 = friendshipRepository.findByUserEmailAndFriendEmail(myEmail, friendEmail);
            Friendship f2 = friendshipRepository.findByUserEmailAndFriendEmail(friendEmail, myEmail);

            if (f1 != null) {
                friendshipRepository.delete(f1);
                System.out.println("Deleted: " + myEmail + " -> " + friendEmail);
            }
            if (f2 != null) {
                friendshipRepository.delete(f2);
                System.out.println("Deleted: " + friendEmail + " -> " + myEmail);
            }

            return ResponseEntity.ok(Map.of("message", "Contact removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Error deleting contact", "error", e.getMessage()));
        }
    }

}