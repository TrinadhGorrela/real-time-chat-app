package com.chatapp.repository;

import com.chatapp.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    List<Friendship> findByUserEmailAndStatus(String userEmail, String status);
    
    Friendship findByUserEmailAndFriendEmail(String userEmail, String friendEmail);
}