package org.pixelpit.backend.threads.web;

import org.pixelpit.backend.threads.ThreadDetails;

import java.time.Instant;
import java.util.List;

public record ThreadDetailsResponse(
        Integer id,
        String title,
        Instant createdAt,
        List<CategoryResponse> categories,
        String author,
        Integer solutionPostId,
        PostResponse solution
) {
    public static ThreadDetailsResponse from(ThreadDetails details) {
        PostResponse solution = details.solution() == null ? null : PostResponse.from(details.solution());
        return new ThreadDetailsResponse(details.id(), details.title(), details.createdAt(),
                CategoryResponse.from(details.categories()),
                details.author(), details.solutionPostId(), solution);
    }
}
