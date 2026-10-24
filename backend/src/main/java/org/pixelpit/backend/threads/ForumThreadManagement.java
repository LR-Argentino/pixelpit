package org.pixelpit.backend.threads;

import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.profile.ProfileLookUp;
import org.pixelpit.backend.threads.exceptions.NotContentOwnerException;
import org.pixelpit.backend.threads.exceptions.PostNotFoundException;
import org.pixelpit.backend.threads.exceptions.ThreadHasRepliesException;
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
        List<Category> categories = findCategories(categoryIds);
        ForumThread thread = forumThreadRepository.save(ForumThread.open(title, profileId, categories));
        postRepository.save(Post.opening(thread, content, profileId));
        return thread.getId();
    }

    /**
     * Ersetzt Titel, Kategorien und den Text des Eröffnungsposts eines eigenen Threads, solange niemand geantwortet
     * hat. Der Eröffnungspost gilt nur dann als bearbeitet, wenn sich sein Text wirklich ändert.
     */
    @Transactional
    public void updateThread(int accountId, int threadId, String title, String content, Set<Integer> categoryIds) {
        ForumThread thread = lockVisibleThread(threadId);
        requireOwner(thread.getCreatedBy(), profileIdOf(accountId));
        requireNoReplies(threadId);
        thread.edit(title, findCategories(categoryIds));
        // Ein sichtbarer Thread hat immer einen sichtbaren Eröffnungspost (VISIBLE)
        Post opening = findVisiblePost(threadId, postRepository.findOpeningPostId(threadId));
        if (!opening.getContent().equals(content)) {
            opening.edit(content);
        }
    }

    /** Löscht einen eigenen Thread (Soft Delete), solange niemand geantwortet hat. */
    @Transactional
    public void deleteThread(int accountId, int threadId) {
        ForumThread thread = lockVisibleThread(threadId);
        int profileId = profileIdOf(accountId);
        requireOwner(thread.getCreatedBy(), profileId);
        requireNoReplies(threadId);
        thread.delete(profileId);
    }

    /** Ersetzt den Text eines eigenen Posts; für den Eröffnungspost gilt die Sperre des Threads. */
    @Transactional
    public void updatePost(int accountId, int threadId, int postId, String content) {
        lockVisibleThread(threadId);
        Post post = findVisiblePost(threadId, postId);
        requireOwner(post.getCreatedBy(), profileIdOf(accountId));
        if (isOpeningPost(threadId, postId)) {
            requireNoReplies(threadId);
        }
        post.edit(content);
    }

    /** Löscht einen eigenen Post (Soft Delete); den Eröffnungspost zu löschen löscht den ganzen Thread. */
    @Transactional
    public void deletePost(int accountId, int threadId, int postId) {
        ForumThread thread = lockVisibleThread(threadId);
        Post post = findVisiblePost(threadId, postId);
        int profileId = profileIdOf(accountId);
        requireOwner(post.getCreatedBy(), profileId);
        if (isOpeningPost(threadId, postId)) {
            requireNoReplies(threadId);
            // Nur der Thread wird markiert: ein Löschkennzeichen pro Thread, VISIBLE deckt beide Fälle ab
            thread.delete(profileId);
        } else {
            post.delete(profileId);
        }
    }

    /** Hängt einen Post an einen sichtbaren Thread an und liefert die ID des Posts. */
    @Transactional
    public int createPost(int accountId, int threadId, String content) {
        // Sperre statt nur prüfen: Sonst kann der Thread zwischen Prüfung und INSERT gelöscht werden
        ForumThread thread = lockVisibleThread(threadId);
        return postRepository.save(Post.reply(thread, content, profileIdOf(accountId))).getId();
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

    @Transactional(readOnly = true)
    public ForumActivity countActivity(int accountId) {
        Integer profileId = profileLookUp.findProfileIdByAccountId(accountId)
                .orElseThrow(() -> new IllegalStateException("Kein Profil für Account " + accountId));
        return new ForumActivity(
                forumThreadRepository.countVisibleByCreatedBy(profileId),
                postRepository.countVisibleByCreatedBy(profileId));
    }

    private ThreadDetails findVisibleThread(int threadId) {
        return forumThreadRepository.findVisibleDetails(threadId)
                .orElseThrow(() -> new ThreadNotFoundException(threadId));
    }

    /**
     * Erster Schritt jedes Schreibpfads eines Threads: erst sperren, dann die Sichtbarkeit prüfen. Nach dem Warten
     * auf die Sperre liest die Prüfung den Stand, den der vorherige Schreiber committet hat.
     */
    private ForumThread lockVisibleThread(int threadId) {
        ForumThread thread = forumThreadRepository.findByIdForUpdate(threadId)
                .orElseThrow(() -> new ThreadNotFoundException(threadId));
        findVisibleThread(threadId);
        return thread;
    }

    /** Ein Post eines anderen Threads ergibt dasselbe wie ein unbekannter oder gelöschter Post. */
    private Post findVisiblePost(int threadId, int postId) {
        return postRepository.findById(postId)
                .filter(post -> post.getThread().getId() == threadId && post.getDeletedAt() == null)
                .orElseThrow(() -> new PostNotFoundException(postId));
    }

    private boolean isOpeningPost(int threadId, int postId) {
        return Objects.equals(postRepository.findOpeningPostId(threadId), postId);
    }

    private int profileIdOf(int accountId) {
        return profileLookUp.findProfileIdByAccountId(accountId)
                .orElseThrow(() -> new IllegalStateException("Kein Profil für Account " + accountId));
    }

    private static void requireOwner(Integer createdBy, int profileId) {
        if (!Objects.equals(createdBy, profileId)) {
            throw new NotContentOwnerException();
        }
    }

    /** Jede sichtbare Antwort sperrt Thread und Eröffnungspost, auch eine des Erstellers selbst. */
    private void requireNoReplies(int threadId) {
        if (postRepository.existsVisibleReply(threadId)) {
            throw new ThreadHasRepliesException(threadId);
        }
    }

    private List<Category> findCategories(Set<Integer> categoryIds) {
        List<Category> categories = categoryRepository.findAllById(categoryIds);
        if (categories.size() != categoryIds.size()) {
            Set<Integer> unknown = new TreeSet<>(categoryIds);
            categories.forEach(category -> unknown.remove(category.getId()));
            throw new UnknownCategoryException(unknown);
        }
        return categories;
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
