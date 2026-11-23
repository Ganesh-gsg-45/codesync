package com.codesync.websocket;

import com.codesync.user.User;
import com.codesync.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Inbound channel interceptor enforcing authentication on CONNECT and
 * room authorization on SUBSCRIBE and SEND.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final UserRepository userRepository;
    private final CollaborationService collaborationService;
    private final com.codesync.auth.JwtTokenProvider jwtTokenProvider;

    private static final Pattern ROOM_TOPIC_PATTERN = Pattern.compile("^/topic/room/([a-f0-9\\-]+)");

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticateConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            authorizeSubscribe(accessor);
        } else if (StompCommand.SEND.equals(accessor.getCommand())) {
            authorizeSend(accessor);
        }

        return message;
    }

    private void authenticateConnect(StompHeaderAccessor accessor) {
        String tokenStr = accessor.getFirstNativeHeader("Authorization");
        if (tokenStr == null || tokenStr.isBlank()) {
            tokenStr = accessor.getFirstNativeHeader("token");
        }
        if (tokenStr == null || tokenStr.isBlank()) {
            tokenStr = accessor.getFirstNativeHeader("userId");
        }
        String username = accessor.getFirstNativeHeader("username");

        if (tokenStr != null && !tokenStr.isBlank()) {
            String token = tokenStr.startsWith("Bearer ") ? tokenStr.substring(7).trim() : tokenStr.trim();
            if (jwtTokenProvider.validateToken(token)) {
                try {
                    UUID userId = jwtTokenProvider.getUserIdFromToken(token);
                    String tokenUsername = jwtTokenProvider.getUsernameFromToken(token);
                    accessor.setUser(new StompPrincipal(userId, tokenUsername != null ? tokenUsername : "user"));
                    log.info("Authenticated WS CONNECT via JWT for user: {} ({})", tokenUsername, userId);
                    return;
                } catch (Exception e) {
                    log.warn("Failed to parse JWT in WS CONNECT: {}", e.getMessage());
                }
            } else {
                try {
                    UUID userId = UUID.fromString(token);
                    Optional<User> userOpt = userRepository.findById(userId);
                    if (userOpt.isPresent() && userOpt.get().isActive()) {
                        User user = userOpt.get();
                        StompPrincipal principal = new StompPrincipal(user.getId(), user.getUsername());
                        accessor.setUser(principal);
                        log.info("Authenticated WS CONNECT for user: {} ({})", user.getUsername(), user.getId());
                        return;
                    }
                } catch (IllegalArgumentException ignored) {
                }
            }
        }

        // Allow guest / fallback with anonymous identification or user lookup by username
        if (username != null && !username.isBlank()) {
            Optional<User> userOpt = userRepository.findByUsername(username.trim());
            if (userOpt.isPresent() && userOpt.get().isActive()) {
                User user = userOpt.get();
                accessor.setUser(new StompPrincipal(user.getId(), user.getUsername()));
                log.info("Authenticated WS CONNECT by username: {} ({})", user.getUsername(), user.getId());
                return;
            }
        }

        log.debug("Unauthenticated WS CONNECT attempt");
    }

    private void authorizeSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) {
            return;
        }

        if (destination.startsWith("/topic/room/")) {
            // Require authenticated session for all room topics
            if (!(accessor.getUser() instanceof StompPrincipal principal)) {
                log.warn("Rejected unauthenticated SUBSCRIBE attempt to {}", destination);
                throw new org.springframework.security.access.AccessDeniedException(
                        "Authentication required: Unauthenticated users cannot subscribe to " + destination);
            }

            Matcher matcher = ROOM_TOPIC_PATTERN.matcher(destination);
            if (!matcher.find()) {
                log.warn("Malformed room subscription destination: {}", destination);
                throw new IllegalArgumentException("Invalid room destination format: " + destination);
            }

            String roomIdStr = matcher.group(1);
            UUID roomId;
            try {
                roomId = UUID.fromString(roomIdStr);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid UUID in destination {}: {}", destination, roomIdStr);
                throw new IllegalArgumentException("Invalid room ID: " + roomIdStr);
            }

            try {
                collaborationService.validateUserRoomAccess(roomId, principal.getUserId());
                log.debug("Authorized subscription to {} for user {}", destination, principal.getUserId());
            } catch (Exception e) {
                log.warn("Unauthorized subscription to {} for user {}: {}", destination, principal.getUserId(), e.getMessage());
                throw new org.springframework.security.access.AccessDeniedException(
                        "Access denied for room " + roomId + ": " + e.getMessage());
            }
        }
    }

    private void authorizeSend(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) {
            return;
        }

        if (destination.startsWith("/app/editor.")) {
            if (!(accessor.getUser() instanceof StompPrincipal)) {
                log.warn("Rejected unauthenticated SEND to {}", destination);
                throw new org.springframework.security.access.AccessDeniedException(
                        "Authentication required: Unauthenticated users cannot send to " + destination);
            }
        }
    }
}
