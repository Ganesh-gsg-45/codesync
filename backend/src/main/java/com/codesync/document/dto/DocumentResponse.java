package com.codesync.document.dto;

import com.codesync.document.CodeDocument;
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
public class DocumentResponse {
    private UUID id;
    private UUID roomId;
    private String content;
    private String language;
    private long version;
    private LocalDateTime lastModifiedAt;
    private UUID lastModifiedBy;

    public static DocumentResponse fromEntity(CodeDocument doc) {
        if (doc == null) {
            return null;
        }
        return DocumentResponse.builder()
                .id(doc.getId())
                .roomId(doc.getRoom() != null ? doc.getRoom().getId() : null)
                .content(doc.getContent())
                .language(doc.getLanguage())
                .version(doc.getVersion())
                .lastModifiedAt(doc.getLastModifiedAt())
                .lastModifiedBy(doc.getLastModifiedBy())
                .build();
    }
}
