package com.codesync.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    Optional<Room> findByAccessCode(String accessCode);
    boolean existsByAccessCode(String accessCode);
    List<Room> findByActiveTrue();
    long countByActiveTrue();
    List<Room> findByMembersUserId(UUID userId);
}
