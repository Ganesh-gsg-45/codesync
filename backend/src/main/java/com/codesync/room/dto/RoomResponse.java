package com.codesync.room.dto;

import com.codesync.room.Room;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private UUID id;
    private String name;
    private String description;
    private String accessCode;
    private String language;

    @JsonProperty("isPrivate")
    private boolean isPrivate;

    private int maxMembers;
    private Integer maxParticipants;
    private boolean active;
    private int memberCount;
    private int participantCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RoomMemberResponse> members;

    public static RoomResponse fromEntity(Room room) {
        if (room == null) {
            return null;
        }

        List<RoomMemberResponse> memberResponses = room.getMembers() != null
                ? room.getMembers().stream().map(RoomMemberResponse::fromEntity).toList()
                : Collections.emptyList();

        int count = memberResponses.size();

        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .description(room.getDescription())
                .accessCode(room.getAccessCode())
                .language(room.getLanguage())
                .isPrivate(room.isPrivate())
                .maxMembers(room.getMaxMembers())
                .maxParticipants(room.getMaxMembers())
                .active(room.isActive())
                .memberCount(count)
                .participantCount(count)
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .members(memberResponses)
                .build();
    }
}
