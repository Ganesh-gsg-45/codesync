package com.codesync.document;

import com.codesync.document.dto.DocumentResponse;
import com.codesync.document.dto.UpdateDocumentRequest;
import com.codesync.exception.ResourceNotFoundException;
import com.codesync.room.Room;
import com.codesync.room.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeDocumentService {

    private final CodeDocumentRepository codeDocumentRepository;
    private final RoomRepository roomRepository;

    @Transactional(readOnly = true)
    public DocumentResponse getDocumentByRoomId(UUID roomId) {
        log.debug("Fetching code document for room id: {}", roomId);
        CodeDocument doc = codeDocumentRepository.findByRoomId(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("CodeDocument", "roomId", roomId));
        return DocumentResponse.fromEntity(doc);
    }

    @Transactional
    public DocumentResponse updateDocument(UUID roomId, UpdateDocumentRequest request) {
        log.info("Updating code document for room id: {}", roomId);

        CodeDocument doc = codeDocumentRepository.findByRoomId(roomId)
                .orElseGet(() -> {
                    Room room = roomRepository.findById(roomId)
                            .orElseThrow(() -> new ResourceNotFoundException("Room", "id", roomId));
                    return CodeDocument.builder()
                            .room(room)
                            .version(0L)
                            .build();
                });

        doc.setContent(request.getContent());
        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            doc.setLanguage(request.getLanguage().trim().toUpperCase());
        }
        if (request.getVersion() != null) {
            doc.setVersion(request.getVersion());
        } else {
            doc.setVersion(doc.getVersion() + 1);
        }
        doc.setLastModifiedAt(LocalDateTime.now());
        if (request.getUserId() != null) {
            doc.setLastModifiedBy(request.getUserId());
        }

        CodeDocument updated = codeDocumentRepository.save(doc);
        log.info("Successfully updated code document for room id: {}, new version: {}", roomId, updated.getVersion());
        return DocumentResponse.fromEntity(updated);
    }
}
