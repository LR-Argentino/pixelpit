package org.pixelpit.backend.threads;

import java.time.Instant;

public record ThreadSummary(
        Integer id,
        String title,
        Instant createdAt,
        Integer categoryId,
        String categoryName,
        String excerpt
) {
}
