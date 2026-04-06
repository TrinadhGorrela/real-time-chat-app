package com.chatapp.config;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.messaging.SessionConnectEvent;
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
                .setAllowedOriginPatterns("http://localhost:3000", "http://localhost:8081", "https://localhost:3000",
                        "https://localhost:8081", "http://localhost:5173", "https://localhost:5173")
                        .setHandshakeHandler(new DefaultHandshakeHandler())
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic", "/queue", "/user");
    }

    @Component
    public static class WebSocketEventListener {

        @Autowired
        private SimpMessagingTemplate template;

        @Autowired
        private UserRepository userRepo;

        private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();

        @EventListener
        public void handleWebSocketConnectListener(SessionConnectEvent event) {
            StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
            String sessionId = headerAccessor.getSessionId();

            Object nativeHeaders = headerAccessor.getMessageHeaders().get(SimpMessageHeaderAccessor.NATIVE_HEADERS);
            if (nativeHeaders instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, java.util.List<String>> headers = (Map<String, java.util.List<String>>) nativeHeaders;
                if (headers.containsKey("email")) {
                    String email = headers.get("email").get(0);
                    sessionUserMap.put(sessionId, email);

                    User user = userRepo.findByEmail(email);
                    if (user != null) {
                        user.setOnline(true);
                        userRepo.save(user);
                    }

                    template.convertAndSend("/topic/status", Map.of(
                            "email", email,
                            "isOnline", true));
                }
            }
        }

        @EventListener
        public void handleDisconnect(SessionDisconnectEvent event) {
            String sessionId = event.getSessionId();
            String email = sessionUserMap.remove(sessionId);

            if (email != null) {
                User user = userRepo.findByEmail(email);
                if (user != null) {
                    user.setOnline(false);
                    user.setLastSeen(LocalDateTime.now());
                    userRepo.save(user);
                    template.convertAndSend("/topic/status", Map.of(
                            "email", email,
                            "isOnline", false,
                            "lastSeen", user.getLastSeen().toString()));
                }
            }
        }
    }
}