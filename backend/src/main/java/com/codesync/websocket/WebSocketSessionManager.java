package com.codesync.websocket;

import com.codesync.room.RoomRole;
import com.codesync.websocket.dto.ParticipantDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe manager for tracking active WebSocket sessions and room participant presence.
 */
@Slf4j
@Component
public class WebSocketSessionManager {

    @Data
    @Builder
    @AllArgsConstructor
    public static class UserSession {
        private String sessionId;
        private UUID userId;
        private String username;
        private UUID roomId;
        private RoomRole role;
        private String color;
    }

    // sessionId -> UserSession
    private final Map<String, UserSession> sessions = new ConcurrentHashMap<>();

    // roomId -> Map<sessionId, UserSession>
    private final Map<UUID, Map<String, UserSession>> roomSessions = new ConcurrentHashMap<>();

    private static final String[] COLORS = {
            "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
            "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"
    };

    public void addSession(String sessionId, UUID userId, String username, UUID roomId, RoomRole role) {
        String color = COLORS[Math.abs(userId.hashCode()) % COLORS.length];
        UserSession session = UserSession.builder()
                .sessionId(sessionId)
                .userId(userId)
                .username(username)
                .roomId(roomId)
                .role(role != null ? role : RoomRole.EDITOR)
                .color(color)
                .build();

        sessions.put(sessionId, session);
        roomSessions.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>()).put(sessionId, session);

        log.info("Registered WS session: {} for user: {} ({}) in room: {}", sessionId, username, userId, roomId);
    }

    public Optional<UserSession> removeSession(String sessionId) {
        UserSession removed = sessions.remove(sessionId);
        if (removed != null && removed.getRoomId() != null) {
            Map<String, UserSession> roomMap = roomSessions.get(removed.getRoomId());
            if (roomMap != null) {
                roomMap.remove(sessionId);
                if (roomMap.isEmpty()) {
                    roomSessions.remove(removed.getRoomId());
                }
            }
            log.info("Removed WS session: {} for user: {} from room: {}", sessionId, removed.getUsername(), removed.getRoomId());
        }
        return Optional.ofNullable(removed);
    }

    public Optional<UserSession> getSession(String sessionId) {
        return Optional.ofNullable(sessions.get(sessionId));
    }

    public List<ParticipantDto> getParticipants(UUID roomId) {
        Map<String, UserSession> roomMap = roomSessions.get(roomId);
        if (roomMap == null || roomMap.isEmpty()) {
            return Collections.emptyList();
        }

        // Deduplicate by userId (a user might have multiple tabs/sessions)
        Map<UUID, ParticipantDto> uniqueParticipants = new LinkedHashMap<>();
        for (UserSession s : roomMap.values()) {
            uniqueParticipants.putIfAbsent(s.getUserId(), ParticipantDto.builder()
                    .userId(s.getUserId())
                    .username(s.getUsername())
                    .role(s.getRole())
                    .color(s.getColor())
                    .build());
        }

        return new ArrayList<>(uniqueParticipants.values());
    }

    public int getRoomParticipantCount(UUID roomId) {
        Map<String, UserSession> roomMap = roomSessions.get(roomId);
        return roomMap != null ? roomMap.size() : 0;
    }
}
