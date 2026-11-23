package com.codesync.room;

import com.codesync.document.CodeDocument;
import com.codesync.document.CodeDocumentRepository;
import com.codesync.exception.BadRequestException;
import com.codesync.exception.ConflictException;
import com.codesync.exception.ResourceNotFoundException;
import com.codesync.room.dto.*;
import com.codesync.user.User;
import com.codesync.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final CodeDocumentRepository codeDocumentRepository;

    private static final String ACCESS_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int ACCESS_CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request) {
        log.info("Creating room: {} by user: {}", request.getName(), request.getCreatorUserId());

        User creator;
        if (request.getCreatorUserId() != null) {
            creator = userRepository.findById(request.getCreatorUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getCreatorUserId()));
        } else {
            // Fallback to first available user or create a default host
            creator = userRepository.findAll().stream().findFirst()
                    .orElseGet(() -> userRepository.save(User.builder()
                            .username("codesync_host")
                            .email("host@codesync.dev")
                            .passwordHash("host123")
                            .fullName("CodeSync Host")
                            .active(true)
                            .build()));
        }

        String accessCode = generateUniqueAccessCode();

        Room room = Room.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .accessCode(accessCode)
                .language(request.getLanguage() != null ? request.getLanguage().toUpperCase() : "JAVASCRIPT")
                .isPrivate(request.getIsPrivate() != null && request.getIsPrivate())
                .maxMembers(request.getEffectiveMaxMembers())
                .active(true)
                .build();

        Room savedRoom = roomRepository.save(room);

        // Add creator as OWNER
        RoomMember ownerMember = RoomMember.builder()
                .room(savedRoom)
                .user(creator)
                .role(RoomRole.OWNER)
                .build();
        savedRoom.addMember(ownerMember);
        roomMemberRepository.save(ownerMember);

        // Initialize shared code document for the room with language-specific starter template
        String starterCode = getStarterTemplate(savedRoom.getLanguage(), savedRoom.getName());
        CodeDocument document = CodeDocument.builder()
                .room(savedRoom)
                .content(starterCode)
                .language(savedRoom.getLanguage())
                .version(0L)
                .lastModifiedBy(creator.getId())
                .build();
        codeDocumentRepository.save(document);
        savedRoom.setDocument(document);

        log.info("Created room id: {} with accessCode: {}", savedRoom.getId(), accessCode);
        return RoomResponse.fromEntity(savedRoom);
    }

    private String getStarterTemplate(String language, String roomName) {
        if (language == null) language = "JAVASCRIPT";
        return switch (language.toUpperCase()) {
            case "JAVASCRIPT", "JS" -> """
                /**
                 * CodeSync Collaborative Session
                 * Room: %s
                 * Language: JavaScript (ES6+ / Node.js)
                 */

                function solve(input) {
                    console.log("Processing input:", input);
                    return input;
                }

                // Sample run
                const data = [1, 2, 3, 4, 5];
                console.log("Result:", solve(data));
                """.formatted(roomName);
            case "TYPESCRIPT", "TS" -> """
                /**
                 * CodeSync Collaborative Session
                 * Room: %s
                 * Language: TypeScript
                 */

                interface Task {
                    id: string;
                    title: string;
                    completed: boolean;
                }

                function processTasks(tasks: Task[]): number {
                    return tasks.filter(t => t.completed).length;
                }

                const sampleTasks: Task[] = [
                    { id: "1", title: "Setup WebSockets", completed: true },
                    { id: "2", title: "OT Engine Verification", completed: false }
                ];

                console.log("Completed count:", processTasks(sampleTasks));
                """.formatted(roomName);
            case "PYTHON", "PY" -> """
                # CodeSync Collaborative Session
                # Room: %s
                # Language: Python 3

                def solve():
                    print("CodeSync Python collaboration session initialized.")
                    numbers = [x * 2 for x in range(10)]
                    print(f"Generated sequence: {numbers}")

                if __name__ == "__main__":
                    solve()
                """.formatted(roomName);
            case "JAVA" -> """
                /**
                 * CodeSync Collaborative Session
                 * Room: %s
                 * Language: Java
                 */
                public class Solution {
                    public static void main(String[] args) {
                        System.out.println("CodeSync Collaborative Session Active");
                    }
                }
                """.formatted(roomName);
            case "CPP", "C++", "C" -> """
                /**
                 * CodeSync Collaborative Session
                 * Room: %s
                 * Language: C++
                 */
                #include <iostream>
                #include <vector>

                int main() {
                    std::cout << "CodeSync Collaborative Session Active" << std::endl;
                    return 0;
                }
                """.formatted(roomName);
            case "GO", "GOLANG" -> """
                // CodeSync Collaborative Session
                // Room: %s
                // Language: Go
                package main

                import "fmt"

                func main() {
                    fmt.Println("CodeSync Collaborative Session Active")
                }
                """.formatted(roomName);
            case "RUST" -> """
                // CodeSync Collaborative Session
                // Room: %s
                // Language: Rust
                fn main() {
                    println!("CodeSync Collaborative Session Active");
                }
                """.formatted(roomName);
            case "HTML", "HTML/CSS" -> """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>%s</title>
                    <style>
                        body { font-family: system-ui, sans-serif; background: #0d1117; color: #fff; padding: 2rem; }
                    </style>
                </head>
                <body>
                    <h1>%s</h1>
                    <p>CodeSync Real-time Collaboration</p>
                </body>
                </html>
                """.formatted(roomName, roomName);
            default -> "// Room: " + roomName + "\n// Language: " + language + "\n";
        };
    }

    @Transactional
    public RoomResponse joinRoomByAccessCode(String accessCode, UUID userId) {
        String cleanCode = accessCode != null ? accessCode.trim().toUpperCase() : "";
        Room room = roomRepository.findByAccessCode(cleanCode)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "accessCode", accessCode));

        if (!room.isActive()) {
            throw new BadRequestException("This room is no longer active");
        }

        if (userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

            boolean alreadyMember = roomMemberRepository.existsByRoomIdAndUserId(room.getId(), userId);
            if (!alreadyMember) {
                long currentCount = roomMemberRepository.countByRoomId(room.getId());
                if (currentCount >= room.getMaxMembers()) {
                    throw new ConflictException("Room has reached maximum capacity of " + room.getMaxMembers() + " members");
                }

                RoomMember member = RoomMember.builder()
                        .room(room)
                        .user(user)
                        .role(RoomRole.EDITOR)
                        .build();
                roomMemberRepository.save(member);
                room.getMembers().add(member);
            }
        }

        return RoomResponse.fromEntity(room);
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomById(UUID id) {
        log.debug("Fetching room by id: {}", id);
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", id));
        return RoomResponse.fromEntity(room);
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomByAccessCode(String accessCode) {
        log.debug("Fetching room by accessCode: {}", accessCode);
        Room room = roomRepository.findByAccessCode(accessCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Room", "accessCode", accessCode));
        return RoomResponse.fromEntity(room);
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getAllActiveRooms() {
        log.debug("Fetching all active rooms");
        return roomRepository.findByActiveTrue().stream()
                .map(RoomResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getRoomsByUser(UUID userId) {
        log.debug("Fetching rooms for user id: {}", userId);
        return roomRepository.findByMembersUserId(userId).stream()
                .map(RoomResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public void verifyRoomOwner(UUID roomId, UUID userId) {
        if (userId == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required: Only the room OWNER can perform this action");
        }
        Optional<RoomMember> memberOpt = roomMemberRepository.findByRoomIdAndUserId(roomId, userId);
        if (memberOpt.isEmpty() || memberOpt.get().getRole() != RoomRole.OWNER) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden: Only the room OWNER is permitted to modify or delete this room");
        }
    }

    @Transactional
    public RoomResponse updateRoom(UUID id, UpdateRoomRequest request, UUID userId) {
        log.info("Updating room id: {} by user {}", id, userId);
        if (userId != null) {
            verifyRoomOwner(id, userId);
        }
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", id));

        if (request.getName() != null && !request.getName().isBlank()) {
            room.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            room.setDescription(request.getDescription().trim());
        }
        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            room.setLanguage(request.getLanguage().trim().toUpperCase());
        }
        if (request.getIsPrivate() != null) {
            room.setPrivate(request.getIsPrivate());
        }
        if (request.getMaxMembers() != null) {
            room.setMaxMembers(request.getMaxMembers());
        }
        if (request.getActive() != null) {
            room.setActive(request.getActive());
        }

        Room updated = roomRepository.save(room);
        return RoomResponse.fromEntity(updated);
    }

    @Transactional
    public RoomResponse updateRoom(UUID id, UpdateRoomRequest request) {
        return updateRoom(id, request, null);
    }

    @Transactional
    public void deleteRoom(UUID id, UUID userId) {
        log.info("Closing room id: {} by user {}", id, userId);
        if (userId != null) {
            verifyRoomOwner(id, userId);
        }
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", id));
        room.setActive(false);
        roomRepository.save(room);
    }

    @Transactional
    public void deleteRoom(UUID id) {
        deleteRoom(id, null);
    }

    @Transactional
    public RoomMemberResponse addMember(UUID roomId, AddMemberRequest request) {
        log.info("Adding user {} to room {}", request.getUserId(), roomId);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", roomId));

        if (!room.isActive()) {
            throw new BadRequestException("Cannot join an inactive room");
        }

        long currentCount = roomMemberRepository.countByRoomId(roomId);
        if (currentCount >= room.getMaxMembers()) {
            throw new ConflictException("Room has reached maximum capacity of " + room.getMaxMembers() + " members");
        }

        if (roomMemberRepository.existsByRoomIdAndUserId(roomId, request.getUserId())) {
            throw new ConflictException("User is already a member of this room");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        RoomMember member = RoomMember.builder()
                .room(room)
                .user(user)
                .role(request.getRole() != null ? request.getRole() : RoomRole.EDITOR)
                .build();

        RoomMember savedMember = roomMemberRepository.save(member);
        log.info("User {} joined room {} as {}", user.getUsername(), roomId, savedMember.getRole());
        return RoomMemberResponse.fromEntity(savedMember);
    }

    @Transactional
    public void removeMember(UUID roomId, UUID userId) {
        log.info("Removing user {} from room {}", userId, roomId);
        RoomMember member = roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("RoomMember", "userId", userId));
        roomMemberRepository.delete(member);
    }

    @Transactional
    public RoomMemberResponse updateMemberRole(UUID roomId, UUID userId, RoomRole newRole) {
        log.info("Updating role for user {} in room {} to {}", userId, roomId, newRole);
        RoomMember member = roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("RoomMember", "userId", userId));
        member.setRole(newRole);
        RoomMember updated = roomMemberRepository.save(member);
        return RoomMemberResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public WorkspaceStatsResponse getWorkspaceStats(UUID userId) {
        log.debug("Generating workspace stats for user: {}", userId);
        long totalRooms = roomRepository.count();
        long activeRooms = roomRepository.countByActiveTrue();
        long totalMembers = roomMemberRepository.count();
        long myRoomsCount = userId != null ? roomRepository.findByMembersUserId(userId).size() : 0;

        List<Room> activeList = roomRepository.findByActiveTrue();
        java.util.Map<String, Long> langDist = activeList.stream()
                .filter(r -> r.getLanguage() != null && !r.getLanguage().isBlank())
                .collect(java.util.stream.Collectors.groupingBy(
                        r -> r.getLanguage().toUpperCase(),
                        java.util.stream.Collectors.counting()
                ));

        List<RoomResponse> recent = activeList.stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .limit(5)
                .map(RoomResponse::fromEntity)
                .toList();

        return WorkspaceStatsResponse.builder()
                .totalRooms(totalRooms)
                .activeRooms(activeRooms)
                .myRoomsCount(myRoomsCount)
                .totalCollaborators(totalMembers)
                .languageDistribution(langDist)
                .recentRooms(recent)
                .build();
    }

    @Transactional(readOnly = true)
    public List<RoomMemberResponse> getRoomMembers(UUID roomId) {
        log.debug("Fetching members for room id: {}", roomId);
        if (!roomRepository.existsById(roomId)) {
            throw new ResourceNotFoundException("Room", "id", roomId);
        }
        return roomMemberRepository.findByRoomId(roomId).stream()
                .map(RoomMemberResponse::fromEntity)
                .toList();
    }

    private String generateUniqueAccessCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(ACCESS_CODE_LENGTH);
            for (int i = 0; i < ACCESS_CODE_LENGTH; i++) {
                sb.append(ACCESS_CODE_CHARS.charAt(random.nextInt(ACCESS_CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!roomRepository.existsByAccessCode(code)) {
                return code;
            }
        }
        throw new RuntimeException("Failed to generate unique room access code");
    }
}
