package com.codesync.file.dto;

import com.codesync.file.RoomFile;
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
public class RoomFileResponse {

    private UUID id;
    private UUID roomId;
    private String name;
    private String path;
    private boolean isFolder;
    private String content;
    private String language;
    private long version;
    private LocalDateTime createdAt;
    private LocalDateTime lastModifiedAt;

    public static RoomFileResponse fromEntity(RoomFile file) {
        return RoomFileResponse.builder()
                .id(file.getId())
                .roomId(file.getRoom().getId())
                .name(file.getName())
                .path(file.getPath())
                .isFolder(file.isFolder())
                .content(file.getContent())
                .language(file.getLanguage())
                .version(file.getVersion())
                .createdAt(file.getCreatedAt())
                .lastModifiedAt(file.getLastModifiedAt())
                .build();
    }
}
