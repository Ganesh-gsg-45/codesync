package com.codesync.room.dto;

import com.codesync.room.RoomMember;
import com.codesync.room.RoomRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomMemberResponse {
    private UUID id;
    private UUID userId;
    private String username;
    private String email;
    private String fullName;
    private RoomRole role;
    private LocalDateTime joinedAt;

    public static RoomMemberResponse fromEntity(RoomMember member) {
        if (member == null) {
            return null;
        }
        return RoomMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser() != null ? member.getUser().getId() : null)
                .username(member.getUser() != null ? member.getUser().getUsername() : null)
                .email(member.getUser() != null ? member.getUser().getEmail() : null)
                .fullName(member.getUser() != null ? member.getUser().getFullName() : null)
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}
