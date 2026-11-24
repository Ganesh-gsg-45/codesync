package com.codesync.file;

import com.codesync.file.dto.CreateFileRequest;
import com.codesync.file.dto.RoomFileResponse;
import com.codesync.file.dto.UpdateFileRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/rooms/{roomId}/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @GetMapping
    public ResponseEntity<List<RoomFileResponse>> getFiles(@PathVariable UUID roomId) {
        return ResponseEntity.ok(fileService.getFiles(roomId));
    }

    @PostMapping
    public ResponseEntity<RoomFileResponse> createFile(
            @PathVariable UUID roomId,
            @Valid @RequestBody CreateFileRequest request) {
        RoomFileResponse response = fileService.createFile(roomId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{fileId}")
    public ResponseEntity<RoomFileResponse> updateFile(
            @PathVariable UUID roomId,
            @PathVariable UUID fileId,
            @RequestBody UpdateFileRequest request) {
        RoomFileResponse response = fileService.updateFile(roomId, fileId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable UUID roomId,
            @PathVariable UUID fileId) {
        fileService.deleteFile(roomId, fileId);
        return ResponseEntity.noContent().build();
    }
}
