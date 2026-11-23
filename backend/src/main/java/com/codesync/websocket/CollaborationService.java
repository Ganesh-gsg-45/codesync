package com.codesync.websocket;

import com.codesync.document.CodeDocument;
import com.codesync.document.CodeDocumentRepository;
import com.codesync.exception.BadRequestException;
import com.codesync.exception.ResourceNotFoundException;
import com.codesync.room.Room;
import com.codesync.room.RoomMember;
import com.codesync.room.RoomMemberRepository;
import com.codesync.room.RoomRepository;
import com.codesync.room.RoomRole;
import com.codesync.user.User;
import com.codesync.user.UserRepository;
import com.codesync.websocket.dto.OperationMessage;
import com.codesync.websocket.dto.SyncMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service orchestrating real-time document synchronization and room access checks,
 * intentionally decoupled from the WebSocket controllers.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CollaborationService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final CodeDocumentRepository codeDocumentRepository;
    private final WebSocketSessionManager sessionManager;

    @Transactional(readOnly = true)
    public RoomRole validateUserRoomAccess(UUID roomId, UUID userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", roomId));

        if (!room.isActive()) {
            throw new BadRequestException("Room is inactive or closed");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Optional<RoomMember> memberOpt = roomMemberRepository.findByRoomIdAndUserId(roomId, userId);
        if (memberOpt.isPresent()) {
            return memberOpt.get().getRole();
        }

        if (room.isPrivate()) {
            throw new BadRequestException("Access denied: User is not an authorized member of private room: " + roomId);
        }

        // Public room: grant EDITOR permission by default for authorized authenticated peers
        return RoomRole.EDITOR;
    }

    @Transactional
    public OperationMessage processOperation(UUID roomId, OperationMessage message) {
        log.debug("Processing operation on room {} from user {}", roomId, message.getUserId());

        // Validate user access
        RoomRole role = validateUserRoomAccess(roomId, message.getUserId());
        if (role == RoomRole.VIEWER) {
            throw new BadRequestException("Viewers are not permitted to edit this document");
        }

        CodeDocument document = codeDocumentRepository.findByRoomId(roomId)
                .orElseGet(() -> {
                    Room room = roomRepository.findById(roomId)
                            .orElseThrow(() -> new ResourceNotFoundException("Room", "id", roomId));
                    return CodeDocument.builder()
                            .room(room)
                            .content("")
                            .version(0L)
                            .build();
                });

        // Revision-aware update: increment version
        long newVersion = document.getVersion() + 1;
        document.setContent(message.getContent());
        document.setVersion(newVersion);
        document.setLastModifiedAt(LocalDateTime.now());
        document.setLastModifiedBy(message.getUserId());

        codeDocumentRepository.save(document);

        return OperationMessage.builder()
                .type("OPERATION")
                .roomId(roomId)
                .userId(message.getUserId())
                .username(message.getUsername())
                .revision(newVersion)
                .content(message.getContent())
                .timestamp(Instant.now())
                .build();
    }

    @Transactional(readOnly = true)
    public SyncMessage getDocumentSync(UUID roomId) {
        CodeDocument document = codeDocumentRepository.findByRoomId(roomId)
                .orElseGet(() -> {
                    Room room = roomRepository.findById(roomId)
                            .orElseThrow(() -> new ResourceNotFoundException("Room", "id", roomId));
                    return CodeDocument.builder()
                            .room(room)
                            .content("// Welcome to " + room.getName() + "\n")
                            .language(room.getLanguage())
                            .version(0L)
                            .build();
                });

        return SyncMessage.builder()
                .type("SYNC")
                .roomId(roomId)
                .content(document.getContent())
                .language(document.getLanguage())
                .revision(document.getVersion())
                .timestamp(Instant.now())
                .participants(sessionManager.getParticipants(roomId))
                .build();
    }
}
