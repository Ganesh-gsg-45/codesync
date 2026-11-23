package com.codesync.websocket.dto;

import com.codesync.room.RoomRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceMessage {
    private String type; // "JOIN", "LEAVE", "PARTICIPANTS"
    private UUID roomId;
    private UUID userId;
    private String username;
    private RoomRole role;
    private Instant timestamp;
    private List<ParticipantDto> participants;
}
