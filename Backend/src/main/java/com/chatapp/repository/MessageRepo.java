package com.chatapp.repository;

import com.chatapp.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageRepo extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE " +
           "(LOWER(m.sender) = LOWER(:u1) AND LOWER(m.receiver) = LOWER(:u2)) OR " +
           "(LOWER(m.sender) = LOWER(:u2) AND LOWER(m.receiver) = LOWER(:u1)) " +
           "ORDER BY m.id ASC")
    List<Message> findConversation(@Param("u1") String u1, @Param("u2") String u2);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.status = 'READ' WHERE m.sender = :originalSender AND m.receiver = :reader")
    void markMessagesAsRead(@Param("originalSender") String originalSender, @Param("reader") String reader);
}