package org.pixelpit.backend.threads;

import java.time.Instant;

/** Kopf eines sichtbaren Threads; solutionPostId ist null, wenn keine sichtbare Lösung markiert ist. */
public record ThreadDetails(
        Integer id,
        String title,
        Instant createdAt,
        Integer categoryId,
        String categoryName,
        Integer solutionPostId
) {
}
