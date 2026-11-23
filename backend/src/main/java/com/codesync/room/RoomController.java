package com.codesync.room;

import com.codesync.auth.JwtTokenProvider;
import com.codesync.room.dto.*;
import com.codesync.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            HttpServletRequest httpRequest) {
        log.info("REST request to create room: {}", request.getName());

        if (request.getCreatorUserId() == null) {
            UUID resolvedUser = resolveUserIdFromHeader(httpRequest);
            request.setCreatorUserId(resolvedUser);
        }

        RoomResponse createdRoom = roomService.createRoom(request);
        return new ResponseEntity<>(createdRoom, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getAllActiveRooms() {
        log.info("REST request to list active rooms");
        return ResponseEntity.ok(roomService.getAllActiveRooms());
    }

    @GetMapping("/stats")
    public ResponseEntity<WorkspaceStatsResponse> getWorkspaceStats(HttpServletRequest httpRequest) {
        UUID userId = resolveUserIdFromHeader(httpRequest);
        log.info("REST request for workspace stats for user: {}", userId);
        return ResponseEntity.ok(roomService.getWorkspaceStats(userId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<RoomResponse>> getMyRooms(HttpServletRequest httpRequest) {
        UUID userId = resolveUserIdFromHeader(httpRequest);
        if (userId != null) {
            log.info("REST request to get rooms for current user: {}", userId);
            List<RoomResponse> userRooms = roomService.getRoomsByUser(userId);
            return ResponseEntity.ok(userRooms);
        }
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoomByCode(
            @RequestBody Map<String, String> body,
            HttpServletRequest httpRequest) {
        String accessCode = body.get("accessCode");
        UUID userId = resolveUserIdFromHeader(httpRequest);
        log.info("REST request to join room with code {} by user {}", accessCode, userId);
        RoomResponse room = roomService.joinRoomByAccessCode(accessCode, userId);
        return ResponseEntity.ok(room);
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        UUID userId = resolveUserIdFromHeader(httpRequest);
        if (userId != null) {
            log.info("REST request to leave room {} by user {}", id, userId);
            try {
                roomService.removeMember(id, userId);
            } catch (Exception ignored) {}
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> getRoomById(@PathVariable UUID id) {
        log.info("REST request to get room: {}", id);
        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    @GetMapping("/code/{accessCode}")
    public ResponseEntity<RoomResponse> getRoomByAccessCode(@PathVariable String accessCode) {
        log.info("REST request to get room by access code: {}", accessCode);
        return ResponseEntity.ok(roomService.getRoomByAccessCode(accessCode));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RoomResponse>> getRoomsByUser(@PathVariable UUID userId) {
        log.info("REST request to get rooms for user: {}", userId);
        return ResponseEntity.ok(roomService.getRoomsByUser(userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoomResponse> updateRoom(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoomRequest request,
            HttpServletRequest httpRequest) {
        UUID userId = resolveUserIdFromHeader(httpRequest);
        log.info("REST request to update room: {} by user {}", id, userId);
        return ResponseEntity.ok(roomService.updateRoom(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        UUID userId = resolveUserIdFromHeader(httpRequest);
        log.info("REST request to delete room: {} by user {}", id, userId);
        roomService.deleteRoom(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{roomId}/members")
    public ResponseEntity<RoomMemberResponse> addMember(
            @PathVariable UUID roomId,
            @Valid @RequestBody AddMemberRequest request) {
        log.info("REST request to add user {} to room {}", request.getUserId(), roomId);
        RoomMemberResponse member = roomService.addMember(roomId, request);
        return new ResponseEntity<>(member, HttpStatus.CREATED);
    }

    @GetMapping("/{roomId}/members")
    public ResponseEntity<List<RoomMemberResponse>> getRoomMembers(@PathVariable UUID roomId) {
        log.info("REST request to get members for room: {}", roomId);
        return ResponseEntity.ok(roomService.getRoomMembers(roomId));
    }

    @PutMapping("/{roomId}/members/{userId}/role")
    public ResponseEntity<RoomMemberResponse> updateMemberRole(
            @PathVariable UUID roomId,
            @PathVariable UUID userId,
            @RequestBody Map<String, String> body) {
        String roleStr = body.get("role");
        RoomRole role = roleStr != null ? RoomRole.valueOf(roleStr.toUpperCase()) : RoomRole.EDITOR;
        log.info("REST request to update user {} role to {} in room {}", userId, role, roomId);
        return ResponseEntity.ok(roomService.updateMemberRole(roomId, userId, role));
    }

    @DeleteMapping("/{roomId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID roomId,
            @PathVariable UUID userId) {
        log.info("REST request to remove user {} from room {}", userId, roomId);
        roomService.removeMember(roomId, userId);
        return ResponseEntity.noContent().build();
    }

    private UUID resolveUserIdFromHeader(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return user.getId();
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (jwtTokenProvider.validateToken(token)) {
                return jwtTokenProvider.getUserIdFromToken(token);
            }
            try {
                return UUID.fromString(token);
            } catch (IllegalArgumentException ignored) {}
        }

        String userHeader = request.getHeader("X-User-Id");
        if (userHeader != null && !userHeader.isBlank()) {
            try {
                return UUID.fromString(userHeader.trim());
            } catch (IllegalArgumentException ignored) {}
        }

        return null;
    }
}
