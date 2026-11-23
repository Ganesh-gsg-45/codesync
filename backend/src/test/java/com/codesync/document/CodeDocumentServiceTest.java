package com.codesync.document;

import com.codesync.document.dto.DocumentResponse;
import com.codesync.document.dto.UpdateDocumentRequest;
import com.codesync.exception.ResourceNotFoundException;
import com.codesync.room.Room;
import com.codesync.room.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodeDocumentServiceTest {

    @Mock
    private CodeDocumentRepository codeDocumentRepository;

    @Mock
    private RoomRepository roomRepository;

    @InjectMocks
    private CodeDocumentService codeDocumentService;

    private UUID roomId;
    private CodeDocument document;

    @BeforeEach
    void setUp() {
        roomId = UUID.randomUUID();
        Room room = Room.builder().id(roomId).name("Test Room").build();
        document = CodeDocument.builder()
                .id(UUID.randomUUID())
                .room(room)
                .content("public class Main {}")
                .language("JAVA")
                .version(1L)
                .lastModifiedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Get document by room ID returns document response")
    void testGetDocumentByRoomId_Success() {
        when(codeDocumentRepository.findByRoomId(roomId)).thenReturn(Optional.of(document));

        DocumentResponse response = codeDocumentService.getDocumentByRoomId(roomId);

        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEqualTo("public class Main {}");
        assertThat(response.getLanguage()).isEqualTo("JAVA");
        assertThat(response.getVersion()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Get document by room ID throws exception when not found")
    void testGetDocumentByRoomId_NotFound() {
        UUID nonExistentRoomId = UUID.randomUUID();
        when(codeDocumentRepository.findByRoomId(nonExistentRoomId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> codeDocumentService.getDocumentByRoomId(nonExistentRoomId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Update document increments version and updates content")
    void testUpdateDocument_Success() {
        UpdateDocumentRequest request = UpdateDocumentRequest.builder()
                .content("public class Main { int x = 10; }")
                .language("JAVA")
                .userId(UUID.randomUUID())
                .build();

        when(codeDocumentRepository.findByRoomId(roomId)).thenReturn(Optional.of(document));
        when(codeDocumentRepository.save(any(CodeDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DocumentResponse response = codeDocumentService.updateDocument(roomId, request);

        assertThat(response).isNotNull();
        assertThat(response.getContent()).contains("int x = 10;");
        assertThat(response.getVersion()).isEqualTo(2L);
    }
}
