package com.chatapp.service;

import com.chatapp.entity.User;
import com.chatapp.entity.Contact;
import com.chatapp.entity.Message;
import com.chatapp.repository.UserRepository;
import com.chatapp.repository.ContactRepository;
import com.chatapp.repository.MessageRepository;
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
    private ContactRepository contactRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    public User registerUser(User user) {
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new UserAlreadyExistsException("Email already exists");
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

    public void sendFriendRequest(String myEmail, String targetEmail) {
        if (myEmail.equalsIgnoreCase(targetEmail)) {
            throw new InvalidOperationException("You cannot add yourself");
        }

        User targetUser = userRepository.findByEmail(targetEmail);
        if (targetUser == null) {
            throw new UserNotFoundException("User not found");
        }

        List<Contact> existing1 = contactRepository.findByUserEmailAndFriendEmail(targetEmail, myEmail);
        List<Contact> existing2 = contactRepository.findByUserEmailAndFriendEmail(myEmail, targetEmail);

        if (!existing1.isEmpty() || !existing2.isEmpty()) {
            throw new InvalidOperationException("Request already pending or you are already friends");
        }

        Contact pending = new Contact();
        pending.setUserEmail(targetEmail);
        pending.setFriendEmail(myEmail);
        pending.setStatus("PENDING");
        contactRepository.save(pending);
    }

    public List<Contact> getPendingRequests(String email) {
        return contactRepository.findByUserEmailAndStatus(email, "PENDING");
    }

    public boolean acceptRequest(String myEmail, Long requestId) {
        Contact f = contactRepository.findById(requestId).orElse(null);

        if (f != null && f.getUserEmail().equalsIgnoreCase(myEmail)) {
            f.setStatus("ACCEPTED");
            contactRepository.save(f);

            Contact reverse = new Contact();
            reverse.setUserEmail(f.getFriendEmail());
            reverse.setFriendEmail(myEmail);
            reverse.setStatus("ACCEPTED");
            contactRepository.save(reverse);

            return true;
        }
        return false;
    }

    public List<User> getContacts(String myEmail) {
        List<Contact> contacts = contactRepository.findByUserEmailAndStatus(myEmail, "ACCEPTED");

        List<String> friendEmails = contacts.stream()
                .map(Contact::getFriendEmail)
                .collect(Collectors.toList());

        if (friendEmails.isEmpty()) {
            return Collections.emptyList();
        }

        List<User> friends = userRepository.findByEmailIn(friendEmails);

        friends.forEach(friend -> {
            Message lastMsg = messageRepository.findLatestMessage(myEmail, friend.getEmail()).orElse(null);
            if (lastMsg != null) {
                friend.setLastMessageTime(lastMsg.getTimestamp());
            }
            long unread = messageRepository.countUnreadMessages(friend.getEmail(), myEmail);
            friend.setUnreadCount((int) unread);
        });

        return friends;
    }

    public void deleteContact(String myEmail, String friendEmail) {
        List<Contact> f1 = contactRepository.findByUserEmailAndFriendEmail(myEmail, friendEmail);
        List<Contact> f2 = contactRepository.findByUserEmailAndFriendEmail(friendEmail, myEmail);

        if (!f1.isEmpty()) {
            contactRepository.deleteAll(f1);
            System.out.println("Deleted: " + myEmail + " -> " + friendEmail);
        }
        if (!f2.isEmpty()) {
            contactRepository.deleteAll(f2);
            System.out.println("Deleted: " + friendEmail + " -> " + myEmail);
        }
    }

    public boolean declineRequest(String myEmail, Long requestId) {
        Contact f = contactRepository.findById(requestId).orElse(null);

        if (f != null && f.getUserEmail().equalsIgnoreCase(myEmail)) {
            contactRepository.delete(f);
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

    public void updatePassword(String myEmail, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(myEmail);
        if (user == null) {
            throw new UserNotFoundException("User not found");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new UnauthorizedException("Incorrect current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User updateName(String myEmail, String newName) {
        User user = userRepository.findByEmail(myEmail);
        if (user == null) {
            throw new UserNotFoundException("User not found");
        }

        user.setName(newName.trim());
        return userRepository.save(user);
    }

    public static class UserAlreadyExistsException extends RuntimeException {
        public UserAlreadyExistsException(String message) {
            super(message);
        }
    }

    public static class UserNotFoundException extends RuntimeException {
        public UserNotFoundException(String message) {
            super(message);
        }
    }

    public static class InvalidOperationException extends RuntimeException {
        public InvalidOperationException(String message) {
            super(message);
        }
    }

    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException(String message) {
            super(message);
        }
    }
}
