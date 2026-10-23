package org.pixelpit.backend.threads.web;

import jakarta.validation.constraints.*;

public record CreateThreadRequest(
        @NotBlank @Size(min = 5, max = 200) String title,
        @NotBlank @Size(max = 20000) String content,
        // TODO: Mit „Thread erstellen“ auf List<Integer> categoryIds umstellen (ein Thread kann mehrere Kategorien haben).
        //  Offen: mindestens eine Pflicht? Höchstzahl? Doppelte IDs zusammenfassen oder 400? Unbekannte ID 400 oder 404?
        @NotNull @Positive Integer categoryId
) {
    public CreateThreadRequest {
        title = title == null ? null : title.strip();
        content = content == null ? null : content.strip();
    }
}
