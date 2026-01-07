package com.chatapp.service;

import com.chatapp.entity.User; 
import com.chatapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepo;

    public User createUser(User user) {
        // Fix: Check for null, not isPresent()
        if (userRepo.findByEmail(user.getEmail()) != null) {
            throw new RuntimeException("User already exists");
        }
        return userRepo.save(user);
    }

    public User findByEmail(String email) {
        // Fix: No .orElse(null) needed
        return userRepo.findByEmail(email);
    }
}