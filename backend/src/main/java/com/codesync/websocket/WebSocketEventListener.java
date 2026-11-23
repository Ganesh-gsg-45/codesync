package com.codesync.websocket;

import com.codesync.websocket.dto.PresenceMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Instant;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final WebSocketSessionManager sessionManager;
    private final SimpMessageSendingOperations messagingTemplate;

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();

        Optional<WebSocketSessionManager.UserSession> sessionOpt = sessionManager.removeSession(sessionId);
        sessionOpt.ifPresent(session -> {
            log.info("WebSocket disconnected: user {} from room {}", session.getUsername(), session.getRoomId());

            PresenceMessage leaveMessage = PresenceMessage.builder()
                    .type("LEAVE")
                    .roomId(session.getRoomId())
                    .userId(session.getUserId())
                    .username(session.getUsername())
                    .role(session.getRole())
                    .timestamp(Instant.now())
                    .participants(sessionManager.getParticipants(session.getRoomId()))
                    .build();

            messagingTemplate.convertAndSend(
                    "/topic/room/" + session.getRoomId() + "/presence",
                    leaveMessage
            );
        });
    }
}
