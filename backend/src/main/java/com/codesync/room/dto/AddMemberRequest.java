package com.codesync.room.dto;

import com.codesync.room.RoomRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddMemberRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @Builder.Default
    private RoomRole role = RoomRole.EDITOR;
}
