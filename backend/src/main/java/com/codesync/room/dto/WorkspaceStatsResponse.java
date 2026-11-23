package com.codesync.room.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceStatsResponse {
    private long totalRooms;
    private long activeRooms;
    private long myRoomsCount;
    private long totalCollaborators;
    private Map<String, Long> languageDistribution;
    private List<RoomResponse> recentRooms;
}

