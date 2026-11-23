package com.codesync.document;

import com.codesync.document.dto.DocumentResponse;
import com.codesync.document.dto.UpdateDocumentRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping({"/api/rooms/{roomId}/document", "/api/editor/{roomId}"})
@RequiredArgsConstructor
public class CodeDocumentController {

    private final CodeDocumentService codeDocumentService;

    @GetMapping({"", "/content"})
    public ResponseEntity<DocumentResponse> getDocument(@PathVariable UUID roomId) {
        log.info("REST request to get document for room: {}", roomId);
        return ResponseEntity.ok(codeDocumentService.getDocumentByRoomId(roomId));
    }

    @PutMapping({"", "/content"})
    @PostMapping("/content")
    public ResponseEntity<DocumentResponse> updateDocument(
            @PathVariable UUID roomId,
            @Valid @RequestBody UpdateDocumentRequest request) {
        log.info("REST request to update document for room: {}", roomId);
        return ResponseEntity.ok(codeDocumentService.updateDocument(roomId, request));
    }
}
