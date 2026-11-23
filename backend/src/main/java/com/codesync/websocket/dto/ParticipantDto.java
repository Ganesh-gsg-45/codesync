package com.codesync.websocket.dto;

import com.codesync.room.RoomRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantDto {
    private UUID userId;
    private String username;
    private String fullName;
    private RoomRole role;
    private String color;
}
