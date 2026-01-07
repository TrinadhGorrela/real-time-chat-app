package com.chatapp.repository;

import com.chatapp.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ContactRepo extends JpaRepository<Contact, Long> {
    // Check if a relationship already exists
    Contact findByRequesterAndApprover(String requester, String approver);
    
    // Find requests waiting for ME to approve
    List<Contact> findByApproverAndStatus(String approver, String status);

    // Find all my accepted friends (complicated query simplified)
    // We will handle the logic in the Controller to keep it simple for you
    List<Contact> findByRequesterOrApprover(String user1, String user2);
}