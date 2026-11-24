package com.codesync.file;

import com.codesync.exception.ConflictException;
import com.codesync.exception.ResourceNotFoundException;
import com.codesync.file.dto.CreateFileRequest;
import com.codesync.file.dto.RoomFileResponse;
import com.codesync.file.dto.UpdateFileRequest;
import com.codesync.room.Room;
import com.codesync.room.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    private final RoomFileRepository fileRepository;
    private final RoomRepository roomRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public List<RoomFileResponse> getFiles(UUID roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", roomId));

        List<RoomFile> files = fileRepository.findByRoomIdOrderByIsFolderDescPathAsc(roomId);
        if (files.isEmpty()) {
            files = initDefaultWorkspace(room);
        }

        return files.stream().map(RoomFileResponse::fromEntity).toList();
    }

    @Transactional
    public RoomFileResponse createFile(UUID roomId, CreateFileRequest req) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", roomId));

        String rawPath = req.getPath().trim().replace("\\", "/");
        // normalize path (no leading slash)
        if (rawPath.startsWith("/")) {
            rawPath = rawPath.substring(1);
        }

        if (fileRepository.existsByRoomIdAndPath(roomId, rawPath)) {
            throw new ConflictException("File or folder already exists at path: " + rawPath);
        }

        String name = req.getName();
        if (name == null || name.isBlank()) {
            int lastSlash = rawPath.lastIndexOf('/');
            name = lastSlash >= 0 ? rawPath.substring(lastSlash + 1) : rawPath;
        }

        String language = req.getLanguage();
        if (language == null || language.isBlank()) {
            language = detectLanguageFromExtension(name, room.getLanguage());
        }

        RoomFile file = RoomFile.builder()
                .room(room)
                .name(name)
                .path(rawPath)
                .isFolder(req.isFolder())
                .content(req.isFolder() ? "" : (req.getContent() != null ? req.getContent() : getDefaultContent(name, language)))
                .language(language.toUpperCase())
                .version(0L)
                .build();

        RoomFile saved = fileRepository.save(file);
        log.info("Created room file: {} in room: {}", saved.getPath(), roomId);

        broadcastFileEvent(roomId, "CREATE", RoomFileResponse.fromEntity(saved));
        return RoomFileResponse.fromEntity(saved);
    }

    @Transactional
    public RoomFileResponse updateFile(UUID roomId, UUID fileId, UpdateFileRequest req) {
        RoomFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("RoomFile", "id", fileId));

        if (!file.getRoom().getId().equals(roomId)) {
            throw new ResourceNotFoundException("RoomFile", "roomId", roomId);
        }

        if (req.getContent() != null) {
            file.setContent(req.getContent());
            file.setVersion(file.getVersion() + 1);
        }

        if (req.getLanguage() != null && !req.getLanguage().isBlank()) {
            file.setLanguage(req.getLanguage().toUpperCase());
        }

        if (req.getNewPath() != null && !req.getNewPath().isBlank()) {
            String newPath = req.getNewPath().trim().replace("\\", "/");
            if (newPath.startsWith("/")) newPath = newPath.substring(1);
            file.setPath(newPath);
            int lastSlash = newPath.lastIndexOf('/');
            file.setName(lastSlash >= 0 ? newPath.substring(lastSlash + 1) : newPath);
        }

        RoomFile saved = fileRepository.save(file);
        broadcastFileEvent(roomId, "UPDATE", RoomFileResponse.fromEntity(saved));
        return RoomFileResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteFile(UUID roomId, UUID fileId) {
        RoomFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("RoomFile", "id", fileId));

        if (!file.getRoom().getId().equals(roomId)) {
            throw new ResourceNotFoundException("RoomFile", "roomId", roomId);
        }

        String path = file.getPath();
        if (file.isFolder()) {
            fileRepository.deleteByRoomIdAndPathStartingWith(roomId, path + "/");
        }
        fileRepository.delete(file);
        log.info("Deleted room file: {} in room: {}", path, roomId);

        broadcastFileEvent(roomId, "DELETE", Map.of("id", fileId, "path", path));
    }

    private void broadcastFileEvent(UUID roomId, String action, Object payload) {
        try {
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/files", Map.of(
                    "action", action,
                    "payload", payload
            ));
        } catch (Exception e) {
            log.warn("Failed to broadcast file event over STOMP: {}", e.getMessage());
        }
    }

    private List<RoomFile> initDefaultWorkspace(Room room) {
        List<RoomFile> files = new ArrayList<>();
        String lang = room.getLanguage() != null ? room.getLanguage().toUpperCase() : "JAVASCRIPT";

        String mainName = switch (lang) {
            case "PYTHON" -> "main.py";
            case "JAVA" -> "Main.java";
            case "TYPESCRIPT" -> "main.ts";
            case "CPP" -> "main.cpp";
            case "GO" -> "main.go";
            case "RUST" -> "main.rs";
            case "HTML" -> "index.html";
            default -> "index.js";
        };

        String mainContent = room.getDocument() != null && room.getDocument().getContent() != null
                ? room.getDocument().getContent()
                : getDefaultContent(mainName, lang);

        files.add(RoomFile.builder()
                .room(room)
                .name(mainName)
                .path(mainName)
                .isFolder(false)
                .content(mainContent)
                .language(lang)
                .version(0L)
                .build());

        files.add(RoomFile.builder()
                .room(room)
                .name("README.md")
                .path("README.md")
                .isFolder(false)
                .content("# " + room.getName() + "\n\nReal-time collaborative workspace powered by CodeSync.\n\n- Language: " + lang + "\n- Access Code: " + room.getAccessCode() + "\n")
                .language("MARKDOWN")
                .version(0L)
                .build());

        files.add(RoomFile.builder()
                .room(room)
                .name("src")
                .path("src")
                .isFolder(true)
                .content("")
                .language(lang)
                .version(0L)
                .build());

        return fileRepository.saveAll(files);
    }

    private String detectLanguageFromExtension(String filename, String fallback) {
        if (filename == null) return fallback != null ? fallback : "JAVASCRIPT";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".js") || lower.endsWith(".jsx")) return "JAVASCRIPT";
        if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "TYPESCRIPT";
        if (lower.endsWith(".py")) return "PYTHON";
        if (lower.endsWith(".java")) return "JAVA";
        if (lower.endsWith(".cpp") || lower.endsWith(".c") || lower.endsWith(".h")) return "CPP";
        if (lower.endsWith(".go")) return "GO";
        if (lower.endsWith(".rs")) return "RUST";
        if (lower.endsWith(".html")) return "HTML";
        if (lower.endsWith(".css")) return "CSS";
        if (lower.endsWith(".json")) return "JSON";
        if (lower.endsWith(".md")) return "MARKDOWN";
        if (lower.endsWith(".sql")) return "SQL";
        return fallback != null ? fallback : "JAVASCRIPT";
    }

    private String getDefaultContent(String filename, String lang) {
        return switch (lang.toUpperCase()) {
            case "PYTHON" -> "# " + filename + "\n\ndef main():\n    print('Hello from CodeSync!')\n\nif __name__ == '__main__':\n    main()\n";
            case "JAVA" -> "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello from CodeSync!\");\n    }\n}\n";
            case "TYPESCRIPT" -> "// " + filename + "\nexport function hello(): string {\n    return 'Hello from CodeSync!';\n}\nconsole.log(hello());\n";
            case "HTML" -> "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <title>CodeSync Project</title>\n</head>\n<body>\n    <h1>Hello from CodeSync</h1>\n</body>\n</html>\n";
            default -> "// " + filename + "\nfunction main() {\n    console.log('Hello from CodeSync!');\n}\nmain();\n";
        };
    }
}
