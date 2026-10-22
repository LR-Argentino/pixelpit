package org.pixelpit.backend.threads.web;

import jakarta.validation.constraints.*;

public record CreateThreadRequest(
        @NotBlank @Size(min = 5, max = 200) String title,
        @NotBlank @Size(max = 20000) String content,
        @NotNull @Positive Integer categoryId
) {
    public CreateThreadRequest {
        title = title == null ? null : title.strip();
        content = content == null ? null : content.strip();
    }
}
