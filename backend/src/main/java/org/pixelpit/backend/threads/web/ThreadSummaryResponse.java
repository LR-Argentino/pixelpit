package org.pixelpit.backend.threads.web;

import org.pixelpit.backend.threads.ThreadSummary;

import java.time.Instant;
import java.util.List;

public record ThreadSummaryResponse(
        Integer id,
        String title,
        Instant createdAt,
        List<CategoryResponse> categories,
        String excerpt
) {
    public static ThreadSummaryResponse from(ThreadSummary summary) {
        return new ThreadSummaryResponse(summary.id(), summary.title(), summary.createdAt(),
                CategoryResponse.from(summary.categories()), summary.excerpt());
    }
}
