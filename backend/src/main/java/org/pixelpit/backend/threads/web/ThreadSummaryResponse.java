package org.pixelpit.backend.threads.web;

import org.pixelpit.backend.threads.ThreadSummary;

import java.time.Instant;

public record ThreadSummaryResponse(
        Integer id,
        String title,
        Instant createdAt,
        CategoryResponse category,
        String excerpt
) {
    public static ThreadSummaryResponse from(ThreadSummary summary) {
        CategoryResponse category = summary.categoryId() == null
                ? null
                : new CategoryResponse(summary.categoryId(), summary.categoryName());
        return new ThreadSummaryResponse(summary.id(), summary.title(), summary.createdAt(), category,
                summary.excerpt());
    }
}
