package org.pixelpit.backend.threads;

import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.profile.ProfileLookUp;
import org.pixelpit.backend.threads.exceptions.ThreadNotFoundException;
import org.pixelpit.backend.threads.exceptions.UnknownCategoryException;
import org.pixelpit.backend.threads.internal.AttachmentRepository;
import org.pixelpit.backend.threads.internal.Category;
import org.pixelpit.backend.threads.internal.CategoryRepository;
import org.pixelpit.backend.threads.internal.ForumThread;
import org.pixelpit.backend.threads.internal.ForumThreadRepository;
import org.pixelpit.backend.threads.internal.Post;
import org.pixelpit.backend.threads.internal.PostRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.mapping;
import static java.util.stream.Collectors.toList;
import static java.util.stream.Collectors.toSet;

@Service
@RequiredArgsConstructor
public class ForumThreadManagement {
    private final ForumThreadRepository forumThreadRepository;
    private final PostRepository postRepository;
    private final AttachmentRepository attachmentRepository;
    private final CategoryRepository categoryRepository;
    private final ProfileLookUp profileLookUp;

    /** Legt Thread, Eröffnungspost und Kategoriezuordnung gemeinsam an und liefert die ID des Threads. */
    @Transactional
    public int createThread(int accountId, String title, String content, Set<Integer> categoryIds) {
        // Jeder Account hat ein Profil: Es entsteht synchron in derselben Transaktion wie der Account
        Integer profileId = profileLookUp.findProfileIdByAccountId(accountId)
                .orElseThrow(() -> new IllegalStateException("Kein Profil für Account " + accountId));
        List<Category> categories = categoryRepository.findAllById(categoryIds);
        if (categories.size() != categoryIds.size()) {
            Set<Integer> unknown = new TreeSet<>(categoryIds);
            categories.forEach(category -> unknown.remove(category.getId()));
            throw new UnknownCategoryException(unknown);
        }
        ForumThread thread = forumThreadRepository.save(ForumThread.open(title, profileId, categories));
        postRepository.save(Post.opening(thread, content, profileId));
        return thread.getId();
    }

    /** Hängt einen Post an einen sichtbaren Thread an und liefert die ID des Posts. */
    @Transactional
    public int createPost(int accountId, int threadId, String content) {
        findVisibleThread(threadId);
        Integer profileId = profileLookUp.findProfileIdByAccountId(accountId)
                .orElseThrow(() -> new IllegalStateException("Kein Profil für Account " + accountId));
        ForumThread thread = forumThreadRepository.getReferenceById(threadId);
        return postRepository.save(Post.reply(thread, content, profileId)).getId();
    }

    @Transactional(readOnly = true)
    public List<CategoryView> listCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(category -> new CategoryView(category.getId(), category.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ThreadSummary> listThreads(Pageable pageable) {
        Page<ThreadSummary> summaries = forumThreadRepository.findSummaries(pageable);
        if (summaries.isEmpty()) {
            return summaries;
        }
        Map<Integer, List<CategoryView>> categories = categoriesByThread(summaries.map(ThreadSummary::id).toList());
        return summaries.map(summary -> summary.withCategories(categories.getOrDefault(summary.id(), List.of())));
    }


    @Transactional(readOnly = true)
    public ThreadDetails getThread(int threadId) {
        ThreadDetails visible = findVisibleThread(threadId);
        ThreadDetails thread = visible
                .withAuthor(profileLookUp.findUsernamesByProfileIds(Set.of(visible.authorId())).get(visible.authorId()))
                .withCategories(categoriesByThread(List.of(threadId)).getOrDefault(threadId, List.of()));
        if (thread.solutionPostId() == null) {
            return thread;
        }
        // Die Projektion setzt solutionPostId nur für einen sichtbaren Lösungspost
        return postRepository.findById(thread.solutionPostId())
                .map(post -> thread.withSolution(toViews(List.of(post), thread.solutionPostId()).getFirst()))
                .orElse(thread);
    }
    
    @Transactional(readOnly = true)
    public Page<PostView> listPosts(int threadId, Pageable pageable) {
        ThreadDetails thread = findVisibleThread(threadId);
        Page<Post> posts = postRepository.findVisibleByThreadId(threadId, pageable);
        if (posts.isEmpty()) {
            return posts.map(post -> null);
        }
        return new PageImpl<>(toViews(posts.getContent(), thread.solutionPostId()), pageable, posts.getTotalElements());
    }

    private ThreadDetails findVisibleThread(int threadId) {
        return forumThreadRepository.findVisibleDetails(threadId)
                .orElseThrow(() -> new ThreadNotFoundException(threadId));
    }

    /** Kategorien aller übergebenen Threads mit einer Abfrage; die Reihenfolge der Abfrage (nach Name) bleibt erhalten. */
    private Map<Integer, List<CategoryView>> categoriesByThread(List<Integer> threadIds) {
        return forumThreadRepository.findCategoriesByThreadIdIn(threadIds).stream()
                .collect(groupingBy(ForumThreadRepository.CategoryRow::getThreadId,
                        mapping(row -> new CategoryView(row.getId(), row.getName()), toList())));
    }

    /** Lädt Anhänge und Autoren aller übergebenen Posts mit je einer Abfrage. */
    private List<PostView> toViews(List<Post> posts, Integer solutionPostId) {
        List<Integer> postIds = posts.stream().map(Post::getId).toList();
        Map<Integer, List<AttachmentView>> attachmentsByPost = attachmentRepository.findViewsByPostIdIn(postIds)
                .stream()
                .collect(groupingBy(AttachmentRepository.AttachmentRow::getPostId,
                        mapping(row -> new AttachmentView(row.getId(), row.getFileName(), row.getMimeType(),
                                row.getFileSize()), toList())));
        Set<Integer> authorIds = posts.stream().map(Post::getCreatedBy).collect(toSet());
        Map<Integer, String> authors = profileLookUp.findUsernamesByProfileIds(authorIds);

        return posts.stream()
                .map(post -> new PostView(
                        post.getId(),
                        authors.get(post.getCreatedBy()),
                        post.getCreatedAt(),
                        post.getUpdatedAt(),
                        post.getContent(),
                        Objects.equals(post.getId(), solutionPostId),
                        attachmentsByPost.getOrDefault(post.getId(), List.of())))
                .toList();
    }
}
