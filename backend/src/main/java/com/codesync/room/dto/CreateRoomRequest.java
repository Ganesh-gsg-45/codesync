package com.codesync.room.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomRequest {

    @NotBlank(message = "Room name is required")
    @Size(min = 3, max = 100, message = "Room name must be between 3 and 100 characters")
    private String name;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;

    @Builder.Default
    private String language = "JAVASCRIPT";

    @Builder.Default
    private Boolean isPrivate = false;

    @Min(value = 2, message = "Room must accommodate at least 2 members")
    @Max(value = 50, message = "Room cannot exceed 50 members")
    @Builder.Default
    private Integer maxMembers = 10;

    private Integer maxParticipants;

    private UUID creatorUserId;

    public Integer getEffectiveMaxMembers() {
        if (maxParticipants != null && maxParticipants >= 2) {
            return maxParticipants;
        }
        return maxMembers != null ? maxMembers : 10;
    }
}
