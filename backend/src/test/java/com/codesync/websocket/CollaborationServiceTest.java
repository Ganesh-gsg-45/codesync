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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CollaborationServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomMemberRepository roomMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CodeDocumentRepository codeDocumentRepository;

    @Mock
    private WebSocketSessionManager sessionManager;

    @InjectMocks
    private CollaborationService collaborationService;

    private UUID roomId;
    private UUID userId;
    private Room publicRoom;
    private Room privateRoom;
    private User testUser;
    private CodeDocument codeDoc;

    @BeforeEach
    void setUp() {
        roomId = UUID.randomUUID();
        userId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .username("alice")
                .email("alice@codesync.dev")
                .active(true)
                .build();

        publicRoom = Room.builder()
                .id(roomId)
                .name("Public Coding Room")
                .isPrivate(false)
                .active(true)
                .build();

        privateRoom = Room.builder()
                .id(roomId)
                .name("Private Team Room")
                .isPrivate(true)
                .active(true)
                .build();

        codeDoc = CodeDocument.builder()
                .id(UUID.randomUUID())
                .room(publicRoom)
                .content("// Initial Code")
                .language("JAVA")
                .version(1L)
                .build();
    }

    @Test
    @DisplayName("Authorized member access to private room succeeds")
    void testValidateUserRoomAccess_PrivateRoom_Authorized() {
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(privateRoom));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(roomMemberRepository.findByRoomIdAndUserId(roomId, userId))
                .thenReturn(Optional.of(RoomMember.builder().role(RoomRole.OWNER).build()));

        RoomRole role = collaborationService.validateUserRoomAccess(roomId, userId);

        assertThat(role).isEqualTo(RoomRole.OWNER);
    }

    @Test
    @DisplayName("Unauthorized user cannot access private room")
    void testValidateUserRoomAccess_PrivateRoom_UnauthorizedThrows() {
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(privateRoom));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(roomMemberRepository.findByRoomIdAndUserId(roomId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> collaborationService.validateUserRoomAccess(roomId, userId))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("Process operation increments document revision and saves updated content")
    void testProcessOperation_IncrementsRevision() {
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(publicRoom));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(roomMemberRepository.findByRoomIdAndUserId(roomId, userId))
                .thenReturn(Optional.of(RoomMember.builder().role(RoomRole.EDITOR).build()));
        when(codeDocumentRepository.findByRoomId(roomId)).thenReturn(Optional.of(codeDoc));
        when(codeDocumentRepository.save(any(CodeDocument.class))).thenAnswer(i -> i.getArgument(0));

        OperationMessage incoming = OperationMessage.builder()
                .roomId(roomId)
                .userId(userId)
                .username("alice")
                .revision(1L)
                .content("public class App { int a = 1; }")
                .build();

        OperationMessage result = collaborationService.processOperation(roomId, incoming);

        assertThat(result).isNotNull();
        assertThat(result.getRevision()).isEqualTo(2L); // incremented from 1 to 2
        assertThat(result.getContent()).isEqualTo("public class App { int a = 1; }");
        verify(codeDocumentRepository, times(1)).save(any(CodeDocument.class));
    }

    @Test
    @DisplayName("Get document sync returns current content and revision")
    void testGetDocumentSync_ReturnsDocument() {
        when(codeDocumentRepository.findByRoomId(roomId)).thenReturn(Optional.of(codeDoc));
        when(sessionManager.getParticipants(roomId)).thenReturn(Collections.emptyList());

        SyncMessage sync = collaborationService.getDocumentSync(roomId);

        assertThat(sync).isNotNull();
        assertThat(sync.getContent()).isEqualTo("// Initial Code");
        assertThat(sync.getRevision()).isEqualTo(1L);
    }
}
