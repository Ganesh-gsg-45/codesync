package com.codesync.file.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFileRequest {

    @NotBlank(message = "Path is required")
    private String path;

    private String name;

    private boolean isFolder;

    private String content;

    private String language;
}
