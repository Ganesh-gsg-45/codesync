package com.codesync.file;

import com.codesync.room.Room;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * RoomFile entity representing hierarchical files and folders within a collaborative Room workspace.
 */
@Entity
@Table(name = "room_files", indexes = {
        @Index(name = "idx_file_room_id", columnList = "room_id"),
        @Index(name = "idx_file_room_path", columnList = "room_id, path")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RoomFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "path", nullable = false, length = 255)
    private String path; // e.g. "src/index.js", "src", "README.md"

    @Column(name = "is_folder", nullable = false)
    @Builder.Default
    private boolean isFolder = false;

    @Column(name = "content", columnDefinition = "LONGTEXT")
    @Builder.Default
    private String content = "";

    @Column(name = "language", length = 50)
    @Builder.Default
    private String language = "JAVASCRIPT";

    @Column(name = "version", nullable = false)
    @Builder.Default
    private long version = 0L;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "last_modified_at")
    private LocalDateTime lastModifiedAt;

    @Column(name = "last_modified_by")
    private UUID lastModifiedBy;
}
