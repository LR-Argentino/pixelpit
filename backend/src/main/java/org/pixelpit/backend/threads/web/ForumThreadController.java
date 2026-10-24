package org.pixelpit.backend.threads.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.account.AccountDetails;
import org.pixelpit.backend.threads.ForumThreadManagement;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

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

    @PostMapping
    public ResponseEntity<CreatedThreadResponse> createThread(
            @Valid @RequestBody CreateThreadRequest request,
            @AuthenticationPrincipal AccountDetails me) {
        int id = forumThreadManagement.createThread(
                me.getAccountId(), request.title(), request.content(), request.categoryIds());
        return ResponseEntity.created(URI.create("/api/threads/" + id)).body(new CreatedThreadResponse(id));
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

    /** Kein Location-Header: Es gibt keine Ressource für einen einzelnen Post. */
    @PostMapping("/{id}/posts")
    public ResponseEntity<CreatedPostResponse> createPost(
            @PathVariable @Positive int id,
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal AccountDetails me) {
        int postId = forumThreadManagement.createPost(me.getAccountId(), id, request.content());
        return ResponseEntity.status(HttpStatus.CREATED).body(new CreatedPostResponse(postId));
    }
}
