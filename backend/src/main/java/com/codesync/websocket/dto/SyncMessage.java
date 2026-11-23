package com.codesync.websocket.dto;

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
public class SyncMessage {
    @Builder.Default
    private String type = "SYNC";
    private UUID roomId;
    private String content;
    private String language;
    private long revision;
    private Instant timestamp;
    private List<ParticipantDto> participants;
}
