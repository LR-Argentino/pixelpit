package org.pixelpit.backend.threads.web;

import jakarta.validation.constraints.*;

import java.util.Set;

/**
 * Ersetzt Titel, Kategorien und den Text des Eröffnungsposts vollständig; es gelten dieselben Regeln wie in
 * {@link CreateThreadRequest}.
 */
public record UpdateThreadRequest(
        @NotBlank @CodePointLength(min = 5, max = 200) String title,
        @NotBlank @CodePointLength(min = 1, max = 20000) String content,
        @NotNull @Size(min = 1, max = 2) Set<@NotNull @Positive Integer> categoryIds
) {
    public UpdateThreadRequest {
        title = title == null ? null : title.strip();
        content = content == null ? null : content.strip();
    }
}
