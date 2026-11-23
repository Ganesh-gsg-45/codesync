package com.codesync.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CursorMessage {
    @Builder.Default
    private String type = "CURSOR";
    private UUID roomId;
    private UUID userId;
    private String username;
    private int line;
    private int column;
    private Instant timestamp;
}
