package org.pixelpit.backend.threads.web;

import jakarta.validation.constraints.NotBlank;

public record CreatePostRequest(
        @NotBlank @CodePointLength(min = 1, max = 20000) String content
) {
    public CreatePostRequest {
        content = content == null ? null : content.strip();
    }
}
