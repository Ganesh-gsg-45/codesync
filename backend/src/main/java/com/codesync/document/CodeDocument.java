package com.codesync.document;

import com.codesync.room.Room;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * CodeDocument entity representing the shared editor buffer and metadata for a Room.
 */
@Entity
@Table(name = "code_documents", indexes = {
        @Index(name = "idx_document_room_id", columnList = "room_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CodeDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false, unique = true)
    private Room room;

    @Column(name = "content", columnDefinition = "LONGTEXT")
    @Builder.Default
    private String content = "";

    @Column(name = "language", length = 50)
    @Builder.Default
    private String language = "JAVASCRIPT";

    @Column(name = "version", nullable = false)
    @Builder.Default
    private long version = 0L;

    @LastModifiedDate
    @Column(name = "last_modified_at")
    private LocalDateTime lastModifiedAt;

    @Column(name = "last_modified_by")
    private UUID lastModifiedBy;
}
