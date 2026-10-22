package org.pixelpit.backend.threads;

import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.profile.ProfileLookUp;
import org.pixelpit.backend.threads.exceptions.ThreadNotFoundException;
import org.pixelpit.backend.threads.internal.AttachmentRepository;
import org.pixelpit.backend.threads.internal.ForumThreadRepository;
import org.pixelpit.backend.threads.internal.Post;
import org.pixelpit.backend.threads.internal.PostRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.mapping;
import static java.util.stream.Collectors.toList;

@Service
@RequiredArgsConstructor
public class ForumThreadManagement {
    private final ForumThreadRepository forumThreadRepository;
    private final PostRepository postRepository;
    private final AttachmentRepository attachmentRepository;
    private final ProfileLookUp profileLookUp;

    @Transactional(readOnly = true)
    public Page<ThreadSummary> listThreads(Pageable pageable) {
        return forumThreadRepository.findSummaries(pageable);
    }

    /** Wirft {@link ThreadNotFoundException}, wenn es den Thread nicht gibt oder er gelöscht ist. */
    @Transactional(readOnly = true)
    public ThreadDetails getThread(int threadId) {
        return forumThreadRepository.findVisibleDetails(threadId)
                .orElseThrow(() -> new ThreadNotFoundException(threadId));
    }

    /**
     * Sichtbare Posts eines Threads, ältester zuerst. Feste Zahl von Abfragen pro Seite (kein N+1):
     * Thread-Kopf, Posts mit Zählung, Anhänge aller Posts, Autoren aller Posts.
     * Wirft {@link ThreadNotFoundException}, wenn es den Thread nicht gibt oder er gelöscht ist.
     */
    @Transactional(readOnly = true)
    public Page<PostView> listPosts(int threadId, Pageable pageable) {
        ThreadDetails thread = getThread(threadId);
        Page<Post> posts = postRepository.findVisibleByThreadId(threadId, pageable);
        if (posts.isEmpty()) {
            return posts.map(post -> null);
        }

        List<Integer> postIds = posts.map(Post::getId).toList();
        Map<Integer, List<AttachmentView>> attachmentsByPost = attachmentRepository.findViewsByPostIdIn(postIds)
                .stream()
                .collect(groupingBy(AttachmentRepository.AttachmentRow::getPostId,
                        mapping(row -> new AttachmentView(row.getId(), row.getFileName(), row.getMimeType(),
                                row.getFileSize()), toList())));
        Map<Integer, String> authors = profileLookUp.findUsernamesByProfileIds(
                posts.map(Post::getCreatedBy).toSet());

        return posts.map(post -> new PostView(
                post.getId(),
                authors.get(post.getCreatedBy()),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                post.getContent(),
                Objects.equals(post.getId(), thread.solutionPostId()),
                attachmentsByPost.getOrDefault(post.getId(), List.of())));
    }
}
