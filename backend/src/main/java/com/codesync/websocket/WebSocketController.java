package com.codesync.websocket;

import com.codesync.room.RoomRole;
import com.codesync.user.User;
import com.codesync.user.UserRepository;
import com.codesync.websocket.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Controller handling real-time WebSocket STOMP messaging.
 * Separate from the OT algorithm engine as required by architectural guidelines.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessageSendingOperations messagingTemplate;
    private final CollaborationService collaborationService;
    private final WebSocketSessionManager sessionManager;
    private final UserRepository userRepository;

    /**
     * User joins a collaborative room.
     */
    @MessageMapping("/editor.join")
    public void joinRoom(@Payload Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        UUID roomId = UUID.fromString(payload.get("roomId").toString());
        UUID userId = UUID.fromString(payload.get("userId").toString());

        log.info("STOMP join request from user {} for room {}", userId, roomId);

        // 1. Verify room access
        RoomRole role = collaborationService.validateUserRoomAccess(roomId, userId);

        // 2. Fetch user details
        User user = userRepository.findById(userId).orElse(null);
        String username = user != null ? user.getUsername() : "User-" + userId.toString().substring(0, 4);

        // 3. Register session
        sessionManager.addSession(sessionId, userId, username, roomId, role);

        // 4. Broadcast JOIN presence to the room
        PresenceMessage presence = PresenceMessage.builder()
                .type("JOIN")
                .roomId(roomId)
                .userId(userId)
                .username(username)
                .role(role)
                .timestamp(Instant.now())
                .participants(sessionManager.getParticipants(roomId))
                .build();

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/presence", presence);

        // 5. Send current document sync state
        SyncMessage sync = collaborationService.getDocumentSync(roomId);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, sync);
    }

    /**
     * User leaves a collaborative room explicitly.
     */
    @MessageMapping("/editor.leave")
    public void leaveRoom(@Payload Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        UUID roomId = UUID.fromString(payload.get("roomId").toString());
        UUID userId = UUID.fromString(payload.get("userId").toString());

        log.info("STOMP leave request from user {} for room {}", userId, roomId);

        sessionManager.removeSession(sessionId);

        User user = userRepository.findById(userId).orElse(null);
        String username = user != null ? user.getUsername() : "User";

        PresenceMessage leave = PresenceMessage.builder()
                .type("LEAVE")
                .roomId(roomId)
                .userId(userId)
                .username(username)
                .timestamp(Instant.now())
                .participants(sessionManager.getParticipants(roomId))
                .build();

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/presence", leave);
    }

    /**
     * Receive and broadcast code editing operations.
     */
    @MessageMapping("/editor.operation")
    public void handleOperation(@Payload OperationMessage operation) {
        UUID roomId = operation.getRoomId();
        log.debug("STOMP operation received on room {} by user {}", roomId, operation.getUserId());

        // Process operation revision through CollaborationService (decoupled from controller)
        OperationMessage processedOp = collaborationService.processOperation(roomId, operation);

        // Broadcast revision-stamped operation to all subscribers in the room
        messagingTemplate.convertAndSend("/topic/room/" + roomId, processedOp);
    }

    /**
     * Broadcast live cursor position.
     */
    @MessageMapping("/editor.cursor")
    public void handleCursor(@Payload CursorMessage cursor) {
        UUID roomId = cursor.getRoomId();
        cursor.setTimestamp(Instant.now());
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/cursors", cursor);
    }

    /**
     * Request full document synchronization and participants list.
     */
    @MessageMapping("/editor.sync")
    public void handleSync(@Payload Map<String, Object> payload, Principal principal) {
        UUID roomId = UUID.fromString(payload.get("roomId").toString());
        SyncMessage sync = collaborationService.getDocumentSync(roomId);

        // Broadcast to the room topic so the client receives the authoritative state
        messagingTemplate.convertAndSend("/topic/room/" + roomId, sync);
    }
}
