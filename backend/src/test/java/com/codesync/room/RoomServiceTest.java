package com.codesync.room;

import com.codesync.document.CodeDocument;
import com.codesync.document.CodeDocumentRepository;
import com.codesync.exception.ConflictException;
import com.codesync.exception.ResourceNotFoundException;
import com.codesync.room.dto.AddMemberRequest;
import com.codesync.room.dto.CreateRoomRequest;
import com.codesync.room.dto.RoomMemberResponse;
import com.codesync.room.dto.RoomResponse;
import com.codesync.room.dto.UpdateRoomRequest;
import com.codesync.user.User;
import com.codesync.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomMemberRepository roomMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CodeDocumentRepository codeDocumentRepository;

    @InjectMocks
    private RoomService roomService;

    private User creator;
    private UUID creatorId;
    private Room room;
    private UUID roomId;

    @BeforeEach
    void setUp() {
        creatorId = UUID.randomUUID();
        creator = User.builder()
                .id(creatorId)
                .username("creator")
                .email("creator@codesync.dev")
                .passwordHash("pass123")
                .active(true)
                .build();

        roomId = UUID.randomUUID();
        room = Room.builder()
                .id(roomId)
                .name("Collaborative Room")
                .accessCode("CS1001")
                .language("JAVA")
                .maxMembers(5)
                .active(true)
                .members(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Create room assigns owner and creates code document")
    void testCreateRoom_Success() {
        CreateRoomRequest request = CreateRoomRequest.builder()
                .name("Collaborative Room")
                .language("JAVA")
                .maxMembers(5)
                .creatorUserId(creatorId)
                .build();

        when(userRepository.findById(creatorId)).thenReturn(Optional.of(creator));
        when(roomRepository.existsByAccessCode(any())).thenReturn(false);
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> {
            Room r = invocation.getArgument(0);
            r.setId(roomId);
            return r;
        });
        when(roomMemberRepository.save(any(RoomMember.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(codeDocumentRepository.save(any(CodeDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RoomResponse response = roomService.createRoom(request);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Collaborative Room");
        assertThat(response.getLanguage()).isEqualTo("JAVA");
        assertThat(response.getAccessCode()).hasSize(6);

        verify(roomMemberRepository, times(1)).save(any(RoomMember.class));
        verify(codeDocumentRepository, times(1)).save(any(CodeDocument.class));
    }

    @Test
    @DisplayName("Add member successfully to active room")
    void testAddMember_Success() {
        UUID newUserId = UUID.randomUUID();
        User newUser = User.builder()
                .id(newUserId)
                .username("collaborator")
                .email("collab@codesync.dev")
                .build();

        AddMemberRequest addReq = AddMemberRequest.builder()
                .userId(newUserId)
                .role(RoomRole.EDITOR)
                .build();

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(roomMemberRepository.countByRoomId(roomId)).thenReturn(1L);
        when(roomMemberRepository.existsByRoomIdAndUserId(roomId, newUserId)).thenReturn(false);
        when(userRepository.findById(newUserId)).thenReturn(Optional.of(newUser));
        when(roomMemberRepository.save(any(RoomMember.class))).thenAnswer(invocation -> {
            RoomMember rm = invocation.getArgument(0);
            rm.setId(UUID.randomUUID());
            return rm;
        });

        RoomMemberResponse response = roomService.addMember(roomId, addReq);

        assertThat(response).isNotNull();
        assertThat(response.getUsername()).isEqualTo("collaborator");
        assertThat(response.getRole()).isEqualTo(RoomRole.EDITOR);
    }

    @Test
    @DisplayName("Add member throws ConflictException when room is full")
    void testAddMember_RoomFull() {
        UUID newUserId = UUID.randomUUID();
        AddMemberRequest addReq = AddMemberRequest.builder()
                .userId(newUserId)
                .build();

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(roomMemberRepository.countByRoomId(roomId)).thenReturn(5L); // max is 5

        assertThatThrownBy(() -> roomService.addMember(roomId, addReq))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("maximum capacity");
    }

    @Test
    @DisplayName("Update room succeeds when performed by OWNER")
    void testUpdateRoom_AsOwner_Success() {
        RoomMember ownerMember = RoomMember.builder()
                .room(room)
                .user(creator)
                .role(RoomRole.OWNER)
                .build();
        when(roomMemberRepository.findByRoomIdAndUserId(roomId, creatorId)).thenReturn(Optional.of(ownerMember));
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateRoomRequest updateReq = UpdateRoomRequest.builder()
                .name("Updated Room Name")
                .description("New Description")
                .language("PYTHON")
                .build();

        RoomResponse response = roomService.updateRoom(roomId, updateReq, creatorId);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Updated Room Name");
        assertThat(response.getLanguage()).isEqualTo("PYTHON");
    }

    @Test
    @DisplayName("Update room throws AccessDeniedException when performed by non-owner")
    void testUpdateRoom_AsNonOwner_ThrowsAccessDenied() {
        UUID editorId = UUID.randomUUID();
        User editorUser = User.builder().id(editorId).username("editor").build();
        RoomMember editorMember = RoomMember.builder()
                .room(room)
                .user(editorUser)
                .role(RoomRole.EDITOR)
                .build();

        when(roomMemberRepository.findByRoomIdAndUserId(roomId, editorId)).thenReturn(Optional.of(editorMember));

        UpdateRoomRequest updateReq = UpdateRoomRequest.builder()
                .name("Hacked Name")
                .build();

        assertThatThrownBy(() -> roomService.updateRoom(roomId, updateReq, editorId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only the room OWNER is permitted");
    }

    @Test
    @DisplayName("Delete room succeeds when performed by OWNER")
    void testDeleteRoom_AsOwner_Success() {
        RoomMember ownerMember = RoomMember.builder()
                .room(room)
                .user(creator)
                .role(RoomRole.OWNER)
                .build();
        when(roomMemberRepository.findByRoomIdAndUserId(roomId, creatorId)).thenReturn(Optional.of(ownerMember));
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));

        roomService.deleteRoom(roomId, creatorId);

        assertThat(room.isActive()).isFalse();
        verify(roomRepository, times(1)).save(room);
    }

    @Test
    @DisplayName("Delete room throws AccessDeniedException when performed by non-owner")
    void testDeleteRoom_AsNonOwner_ThrowsAccessDenied() {
        UUID strangerId = UUID.randomUUID();
        when(roomMemberRepository.findByRoomIdAndUserId(roomId, strangerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roomService.deleteRoom(roomId, strangerId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only the room OWNER is permitted");
    }
}
