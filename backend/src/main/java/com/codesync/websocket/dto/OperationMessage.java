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
public class OperationMessage {
    @Builder.Default
    private String type = "OPERATION";
    private UUID roomId;
    private UUID userId;
    private String username;
    private long revision;
    private String content;
    private Instant timestamp;
}
