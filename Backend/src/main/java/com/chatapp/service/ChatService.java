package com.chatapp.service;

import com.chatapp.entity.Message;
import com.chatapp.repository.MessageRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @Autowired
    private MessageRepo messageRepo;

    @Autowired
    private FilesStorageService filesStorageService;

    @Transactional
    public Message processAndSendMessage(Message chatMessage) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String senderEmail = auth != null ? auth.getName() : null;

        if (senderEmail == null) {
            senderEmail = chatMessage.getSender();
        }

        senderEmail = senderEmail.trim().toLowerCase();
        String receiverEmail = chatMessage.getReceiver().trim().toLowerCase();

        if (chatMessage.getContent() == null)
            chatMessage.setContent("");
        if (chatMessage.getFileUrl() == null)
            chatMessage.setFileUrl("");
        if (chatMessage.getFileName() == null)
            chatMessage.setFileName("");

        chatMessage.setSender(senderEmail);
        chatMessage.setReceiver(receiverEmail);
        chatMessage.setStatus("SENT");
        chatMessage.setTimestamp(LocalDateTime.now());

        Message saved = messageRepo.save(chatMessage);
        simpMessagingTemplate.convertAndSend("/topic/private/" + saved.getReceiver(), saved);
        simpMessagingTemplate.convertAndSend("/topic/private/" + saved.getSender(), saved);
        return saved;
    }

    public void processReadReceipt(Message receipt) {
        if (receipt.getReceiver() != null) {
            String originalSender = receipt.getReceiver();
            String reader = receipt.getSender();
            messageRepo.markMessagesAsRead(originalSender, reader);
            Map<String, Object> readEvent = Map.of(
                    "type", "READ_RECEIPT",
                    "reader", reader);

            simpMessagingTemplate.convertAndSend("/topic/private/" + originalSender, readEvent);
        }
    }

    public List<Message> getChatHistory(String user1, String user2) {
        return messageRepo.findConversation(
                user1.trim().toLowerCase(),
                user2.trim().toLowerCase());
    }

    public boolean deleteMessage(Long id) {
        return messageRepo.findById(id).map(message -> {
            if (message.getFileUrl() != null && !message.getFileUrl().isEmpty()) {
                String fileUrl = message.getFileUrl();
                String storedFilename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
                filesStorageService.delete(storedFilename);
            }

            messageRepo.delete(message);
            return true;
        }).orElse(false);
    }

    public void processTypingStatus(Map<String, String> typingStatus) {
        String receiver = typingStatus.get("receiver");
        String sender = typingStatus.get("sender");
        String isTyping = typingStatus.get("isTyping");

        simpMessagingTemplate.convertAndSend(
                "/topic/typing/" + receiver.toLowerCase(),
                Map.of(
                        "sender", sender.toLowerCase(),
                        "isTyping", "true".equals(isTyping)));
    }

    public void clearChat(String myEmail, String friendEmail) throws Exception {
        messageRepo.deleteConversation(myEmail, friendEmail);
        System.out.println("Purged conversation history between: " + myEmail + " and " + friendEmail);
    }
}
