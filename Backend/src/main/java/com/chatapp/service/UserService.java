package com.chatapp.service;

import com.chatapp.entity.User;
import com.chatapp.entity.Friendship;
import com.chatapp.entity.Message;
import com.chatapp.repository.UserRepository;
import com.chatapp.repository.FriendshipRepository;
import com.chatapp.repository.MessageRepo;
import com.chatapp.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {

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

    public User registerUser(User user) throws Exception {
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new Exception("Email already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public Map<String, Object> authenticateUser(User user) throws Exception {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword()));

        String token = jwtUtil.generateToken(user.getEmail());
        User dbUser = userRepository.findByEmail(user.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", Map.of(
                "email", dbUser.getEmail(),
                "name", dbUser.getName()));

        return response;
    }

    public void sendFriendRequest(String myEmail, String targetEmail) throws Exception {
        if (myEmail.equalsIgnoreCase(targetEmail)) {
            throw new Exception("You cannot add yourself");
        }

        User targetUser = userRepository.findByEmail(targetEmail);
        if (targetUser == null) {
            throw new Exception("User not found");
        }

        List<Friendship> existing1 = friendshipRepository.findByUserEmailAndFriendEmail(targetEmail, myEmail);
        List<Friendship> existing2 = friendshipRepository.findByUserEmailAndFriendEmail(myEmail, targetEmail);

        if (!existing1.isEmpty() || !existing2.isEmpty()) {
            throw new Exception("Request already pending or you are already friends");
        }

        Friendship pending = new Friendship();
        pending.setUserEmail(targetEmail);
        pending.setFriendEmail(myEmail);
        pending.setStatus("PENDING");
        friendshipRepository.save(pending);
    }

    public List<Friendship> getPendingRequests(String email) {
        return friendshipRepository.findByUserEmailAndStatus(email, "PENDING");
    }

    public boolean acceptRequest(String myEmail, Long requestId) {
        Friendship f = friendshipRepository.findById(requestId).orElse(null);

        if (f != null && f.getUserEmail().equalsIgnoreCase(myEmail)) {
            f.setStatus("ACCEPTED");
            friendshipRepository.save(f);

            Friendship reverse = new Friendship();
            reverse.setUserEmail(f.getFriendEmail());
            reverse.setFriendEmail(myEmail);
            reverse.setStatus("ACCEPTED");
            friendshipRepository.save(reverse);

            return true;
        }
        return false;
    }

    public List<User> getContacts(String myEmail) {
        List<Friendship> friendships = friendshipRepository.findByUserEmailAndStatus(myEmail, "ACCEPTED");

        // Batch fetch all friends at once
        List<String> friendEmails = friendships.stream()
                .map(Friendship::getFriendEmail)
                .collect(Collectors.toList());

        if (friendEmails.isEmpty()) {
            return Collections.emptyList();
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

        return friends;
    }

    public void deleteContact(String myEmail, String friendEmail) throws Exception {
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
    }

    public boolean declineRequest(String myEmail, Long requestId) {
        Friendship f = friendshipRepository.findById(requestId).orElse(null);

        if (f != null && f.getUserEmail().equalsIgnoreCase(myEmail)) {
            friendshipRepository.delete(f);
            return true;
        }

        return false;
    }

    public Map<String, Object> checkStatus(String email) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("email", user.getEmail());
            response.put("isOnline", user.isOnline());
            response.put("lastSeen", user.getLastSeen() != null ? user.getLastSeen().toString() : null);
            return response;
        }
        return null;
    }

    public void updatePassword(String myEmail, String currentPassword, String newPassword) throws Exception {
        User user = userRepository.findByEmail(myEmail);
        if (user == null) {
            throw new Exception("User not found");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new Exception("Incorrect current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User updateName(String myEmail, String newName) throws Exception {
        User user = userRepository.findByEmail(myEmail);
        if (user == null) {
            throw new Exception("User not found");
        }

        user.setName(newName.trim());
        return userRepository.save(user);
    }

}
