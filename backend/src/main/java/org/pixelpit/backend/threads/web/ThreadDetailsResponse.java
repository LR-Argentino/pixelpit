package org.pixelpit.backend.threads.web;

import org.pixelpit.backend.threads.ThreadDetails;

import java.time.Instant;

public record ThreadDetailsResponse(
        Integer id,
        String title,
        Instant createdAt,
        CategoryResponse category,
        Integer solutionPostId
) {
    public static ThreadDetailsResponse from(ThreadDetails details) {
        CategoryResponse category = details.categoryId() == null
                ? null
                : new CategoryResponse(details.categoryId(), details.categoryName());
        return new ThreadDetailsResponse(details.id(), details.title(), details.createdAt(), category,
                details.solutionPostId());
    }
}
