package com.chatapp.repository;

import com.chatapp.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    List<Contact> findByUserEmailAndStatus(String userEmail, String status);

    List<Contact> findByUserEmailAndFriendEmail(String userEmail, String friendEmail);
}
