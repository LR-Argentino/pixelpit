package org.pixelpit.backend.threads.web;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.threads.ForumThreadManagement;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/threads")
@RequiredArgsConstructor
public class ForumThreadController {
    private final ForumThreadManagement forumThreadManagement;

    @GetMapping
    public PagedModel<ThreadSummaryResponse> listThreads(
            @RequestParam(defaultValue = "0") @PositiveOrZero int page,
            @RequestParam(defaultValue = "20") @Positive int size) {
        return new PagedModel<>(forumThreadManagement.listThreads(PageRequest.of(page, size))
                .map(ThreadSummaryResponse::from));
    }

    @GetMapping("/{id}")
    public ThreadDetailsResponse getThread(@PathVariable @Positive int id) {
        return ThreadDetailsResponse.from(forumThreadManagement.getThread(id));
    }

    @GetMapping("/{id}/posts")
    public PagedModel<PostResponse> listPosts(
            @PathVariable @Positive int id,
            @RequestParam(defaultValue = "0") @PositiveOrZero int page,
            @RequestParam(defaultValue = "20") @Positive int size) {
        return new PagedModel<>(forumThreadManagement.listPosts(id, PageRequest.of(page, size))
                .map(PostResponse::from));
    }
}
