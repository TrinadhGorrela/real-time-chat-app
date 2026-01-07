package com.chatapp.service;

import com.chatapp.entity.Message;
import com.chatapp.repository.MessageRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MessageService {
    
    @Autowired
    private MessageRepo messageRepo;
      
    public List<Message> getAllMessages() {
        return messageRepo.findAll();
    }
    
    public Message saveMessage(Message message) {
        return messageRepo.save(message);
    }
}
