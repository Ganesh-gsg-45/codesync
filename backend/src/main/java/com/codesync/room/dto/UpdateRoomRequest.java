package com.codesync.room.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoomRequest {

    @Size(min = 3, max = 100, message = "Room name must be between 3 and 100 characters")
    private String name;

    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;

    private String language;

    private Boolean isPrivate;

    @Min(value = 2, message = "Room must accommodate at least 2 members")
    @Max(value = 50, message = "Room cannot exceed 50 members")
    private Integer maxMembers;

    private Boolean active;
}
