package org.pixelpit.backend.threads.web;

import jakarta.validation.constraints.*;

import java.util.Set;

public record CreateThreadRequest(
        @NotBlank @CodePointLength(min = 5, max = 200) String title,
        @NotBlank @CodePointLength(min = 1, max = 20000) String content,
        // Set: doppelte IDs fasst Jackson beim Einlesen zusammen, @Size prüft danach nur noch eindeutige IDs
        @NotNull @Size(min = 1, max = 2) Set<@NotNull @Positive Integer> categoryIds
) {
    public CreateThreadRequest {
        title = title == null ? null : title.strip();
        content = content == null ? null : content.strip();
    }
}
