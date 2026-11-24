package com.codesync.file;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomFileRepository extends JpaRepository<RoomFile, UUID> {

    List<RoomFile> findByRoomIdOrderByIsFolderDescPathAsc(UUID roomId);

    Optional<RoomFile> findByRoomIdAndPath(UUID roomId, String path);

    boolean existsByRoomIdAndPath(UUID roomId, String path);

    void deleteByRoomIdAndPath(UUID roomId, String path);

    void deleteByRoomIdAndPathStartingWith(UUID roomId, String pathPrefix);
}
