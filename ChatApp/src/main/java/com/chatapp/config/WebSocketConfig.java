package com.chatapp.config;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import com.chatapp.entity.User;
import com.chatapp.repository.UserRepository;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:8081")
                .setHandshakeHandler(new DefaultHandshakeHandler())
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic");
    }

    @Component
    public static class WebSocketEventListener {

        @Autowired
        private SimpMessagingTemplate template;

        @Autowired
        private UserRepository userRepo;

        @EventListener
        public void handleDisconnect(SessionDisconnectEvent event) {
            Principal principal = event.getUser();
            if (principal != null) {
                String email = principal.getName();
                User user = userRepo.findByEmail(email);
                if (user != null) {
                    user.setOnline(false);
                    user.setLastSeen(LocalDateTime.now());
                    userRepo.save(user);
                    template.convertAndSend("/topic/status", Map.of(
                            "email", email,
                            "isOnline", false,
                            "lastSeen", user.getLastSeen()));
                }
            }
        }
    }

}