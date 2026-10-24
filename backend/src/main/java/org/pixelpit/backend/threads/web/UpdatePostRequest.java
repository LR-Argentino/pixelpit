package org.pixelpit.backend.threads.web;

import jakarta.validation.constraints.NotBlank;

/** Ersetzt den Text eines Posts; es gelten dieselben Regeln wie in {@link CreatePostRequest}. */
public record UpdatePostRequest(
        @NotBlank @CodePointLength(min = 1, max = 20000) String content
) {
    public UpdatePostRequest {
        content = content == null ? null : content.strip();
    }
}
