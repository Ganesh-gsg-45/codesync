package com.codesync.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CodeDocumentRepository extends JpaRepository<CodeDocument, UUID> {
    Optional<CodeDocument> findByRoomId(UUID roomId);
    boolean existsByRoomId(UUID roomId);
}
