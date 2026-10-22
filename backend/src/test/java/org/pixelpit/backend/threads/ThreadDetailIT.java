package org.pixelpit.backend.threads;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.pixelpit.backend.TestcontainersConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ThreadDetailIT {
    private static final String THREAD_URL = "/api/threads/{id}";
    private static final String POSTS_URL = "/api/threads/{id}/posts";
    private static final Instant OPENED_AT = Instant.parse("2026-09-22T10:00:00Z");

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private int profileId;
    private int categoryId;

    @BeforeEach
    void setUp() {
        truncate();
        profileId = createProfile("blackbird");
        categoryId = createCategory("Engines");
    }

    @AfterEach
    void truncate() {
        jdbcTemplate.update("""
                TRUNCATE attachments, files, threads_categories, posts, threads, categories, profiles, accounts
                RESTART IDENTITY CASCADE
                """);
    }

    // --- Thread-Kopf: Zugriff -------------------------------------------------------------

    @Test
    void getThread_returnsOk_whenGuest() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);

        MvcTestResult result = getThread(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.id").isEqualTo(threadId);
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "MODERATOR", "ADMIN"})
    void getThread_returnsSameContent_whenLoggedInWithAnyRole(String role) throws Exception {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        String guestBody = getThread(threadId).getResponse().getContentAsString();

        MvcTestResult result = mvc.get().uri(THREAD_URL, threadId).with(user("blackbird").roles(role)).exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().isStrictlyEqualTo(guestBody);
    }

    // --- Thread-Kopf: Inhalt und Lösung ---------------------------------------------------

    @Test
    void getThread_returnsAllFieldsAndSolution_whenSolutionIsSet() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        int answerId = createPost(threadId, "Die Lösung", OPENED_AT.plusSeconds(3600));
        markSolution(threadId, answerId);

        MvcTestResult result = getThread(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.id").isEqualTo(threadId);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Navmesh backt nicht");
        assertThat(result).bodyJson().extractingPath("$.createdAt").isEqualTo("2026-09-22T10:00:00Z");
        assertThat(result).bodyJson().extractingPath("$.category.id").isEqualTo(categoryId);
        assertThat(result).bodyJson().extractingPath("$.category.name").isEqualTo("Engines");
        assertThat(result).bodyJson().extractingPath("$.solutionPostId").isEqualTo(answerId);
    }

    @Test
    void getThread_returnsNoSolution_whenNoneIsSet() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);

        MvcTestResult result = getThread(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.solutionPostId").isNull();
    }

    @Test
    void getThread_returnsNoSolution_whenSolutionPostIsDeleted() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        int answerId = createPost(threadId, "Die Lösung", OPENED_AT.plusSeconds(3600));
        markSolution(threadId, answerId);
        deletePost(answerId);

        MvcTestResult result = getThread(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.solutionPostId").isNull();
    }

    // --- Thread-Kopf: nicht gefunden ------------------------------------------------------

    @Test
    void getThread_returnsNotFound_whenThreadDoesNotExist() {
        assertNotFound(getThread(999));
    }

    @Test
    void getThread_returnsNotFound_whenThreadIsDeleted() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        deleteThread(threadId);

        assertNotFound(getThread(threadId));
    }

    @Test
    void getThread_returnsNotFound_whenOpeningPostIsDeleted() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        deletePost(openingPostId(threadId));

        assertNotFound(getThread(threadId));
    }

    @ParameterizedTest
    @ValueSource(strings = {"MODERATOR", "ADMIN"})
    void getThread_returnsNotFound_whenDeletedAndModeratorOrAdmin(String role) {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        deleteThread(threadId);

        assertNotFound(mvc.get().uri(THREAD_URL, threadId).with(user("moderator").roles(role)).exchange());
    }

    // --- Thread-Kopf: ungültige ID --------------------------------------------------------

    @ParameterizedTest
    @ValueSource(strings = {"abc", "0", "-1"})
    void getThread_returnsBadRequest_whenIdIsInvalid(String id) {
        MvcTestResult result = mvc.get().uri("/api/threads/" + id).exchange();

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Thread-ID");
    }

    // --- Beiträge: Zugriff ----------------------------------------------------------------

    @Test
    void listPosts_returnsOk_whenGuest() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);

        MvcTestResult result = listPosts(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content.length()").isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "MODERATOR", "ADMIN"})
    void listPosts_returnsSameContent_whenLoggedInWithAnyRole(String role) throws Exception {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        createPost(threadId, "Antwort", OPENED_AT.plusSeconds(3600));
        String guestBody = listPosts(threadId).getResponse().getContentAsString();

        MvcTestResult result = mvc.get().uri(POSTS_URL, threadId).with(user("blackbird").roles(role)).exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().isStrictlyEqualTo(guestBody);
    }

    // --- Beiträge: Reihenfolge, Autor, Inhalt ---------------------------------------------

    @Test
    void listPosts_returnsOpeningPostFirst_whenThreadHasReplies() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        createPost(threadId, "Erste Antwort", OPENED_AT.plusSeconds(3600));
        createPost(threadId, "Zweite Antwort", OPENED_AT.plusSeconds(7200));

        MvcTestResult result = listPosts(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[*].content").asArray()
                .containsExactly("Eröffnungspost", "Erste Antwort", "Zweite Antwort");
    }

    @Test
    void listPosts_returnsAuthorAndContent_whenGuest() {
        String longContent = "x".repeat(500);
        int threadId = createThread("Navmesh backt nicht", longContent, OPENED_AT);

        MvcTestResult result = listPosts(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[0].id").isEqualTo(openingPostId(threadId));
        assertThat(result).bodyJson().extractingPath("$.content[0].author").isEqualTo("blackbird");
        assertThat(result).bodyJson().extractingPath("$.content[0].createdAt").isEqualTo("2026-09-22T10:00:00Z");
        assertThat(result).bodyJson().extractingPath("$.content[0].content").isEqualTo(longContent);
    }

    @Test
    void listPosts_returnsAnonymizedAuthor_whenAccountIsDeleted() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        int replierId = createProfile("kiwi");
        createPost(threadId, "Antwort von kiwi", OPENED_AT.plusSeconds(3600), replierId);
        anonymizeAccount(replierId);

        MvcTestResult result = listPosts(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[1].author").isEqualTo("deleted-" + replierId);
        assertThat(result).bodyJson().extractingPath("$.content[1].content").isEqualTo("Antwort von kiwi");
    }

    // --- Beiträge: Bearbeitung ------------------------------------------------------------

    @Test
    void listPosts_returnsEditedAt_whenPostWasEdited() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        editPost(openingPostId(threadId), Instant.parse("2026-09-23T08:30:00Z"));

        MvcTestResult result = listPosts(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[0].editedAt").isEqualTo("2026-09-23T08:30:00Z");
    }

    @Test
    void listPosts_returnsNoEditedAt_whenPostWasNeverEdited() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);

        MvcTestResult result = listPosts(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[0].editedAt").isNull();
    }

    // --- Beiträge: Lösung -----------------------------------------------------------------

    @Test
    void listPosts_marksOnlySolution_whenSolutionIsSet() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        int solutionId = createPost(threadId, "Die Lösung", OPENED_AT.plusSeconds(3600));
        createPost(threadId, "Danke!", OPENED_AT.plusSeconds(7200));
        markSolution(threadId, solutionId);

        MvcTestResult result = listPosts(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[*].solution").asArray()
                .containsExactly(false, true, false);
    }

    @Test
    void listPosts_marksNoPost_whenNoSolutionIsSet() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        createPost(threadId, "Antwort", OPENED_AT.plusSeconds(3600));

        MvcTestResult result = listPosts(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[*].solution").asArray()
                .containsExactly(false, false);
    }

    // --- Beiträge: Anhänge ----------------------------------------------------------------

    @Test
    void listPosts_returnsAttachments_whenPostHasAttachments() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        int postId = openingPostId(threadId);
        int screenshotId = createAttachment(postId, "screenshot.png", "image/png", 2048);
        createAttachment(postId, "log.txt", "text/plain", 512);

        MvcTestResult result = listPosts(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[0].attachments.length()").isEqualTo(2);
        assertThat(result).bodyJson().extractingPath("$.content[0].attachments[0]").asMap()
                .containsOnlyKeys("id", "fileName", "mimeType", "fileSize");
        assertThat(result).bodyJson().extractingPath("$.content[0].attachments[0].id").isEqualTo(screenshotId);
        assertThat(result).bodyJson().extractingPath("$.content[0].attachments[0].fileName").isEqualTo("screenshot.png");
        assertThat(result).bodyJson().extractingPath("$.content[0].attachments[0].mimeType").isEqualTo("image/png");
        assertThat(result).bodyJson().extractingPath("$.content[0].attachments[0].fileSize").isEqualTo(2048);
        assertThat(result).bodyJson().extractingPath("$.content[0].attachments[1].fileName").isEqualTo("log.txt");
    }

    @Test
    void listPosts_returnsEmptyAttachments_whenPostHasNone() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);

        MvcTestResult result = listPosts(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[0].attachments").asArray().isEmpty();
    }

    // --- Beiträge: gelöschte Beiträge -----------------------------------------------------

    @Test
    void listPosts_excludesDeletedPost_whenGuest() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        deletePost(createPost(threadId, "Gelöschte Antwort", OPENED_AT.plusSeconds(3600)));
        createPost(threadId, "Sichtbare Antwort", OPENED_AT.plusSeconds(7200));

        MvcTestResult result = listPosts(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[*].content").asArray()
                .containsExactly("Eröffnungspost", "Sichtbare Antwort");
        assertThat(result).bodyJson().extractingPath("$.page.totalElements").isEqualTo(2);
    }

    @ParameterizedTest
    @ValueSource(strings = {"MODERATOR", "ADMIN"})
    void listPosts_excludesDeletedPost_whenModeratorOrAdmin(String role) {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        deletePost(createPost(threadId, "Gelöschte Antwort", OPENED_AT.plusSeconds(3600)));

        MvcTestResult result = mvc.get().uri(POSTS_URL, threadId).with(user("moderator").roles(role)).exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[*].content").asArray()
                .containsExactly("Eröffnungspost");
    }

    // --- Beiträge: nicht gefunden und ungültige ID ----------------------------------------

    @Test
    void listPosts_returnsNotFound_whenThreadDoesNotExist() {
        assertNotFound(listPosts(999));
    }

    @Test
    void listPosts_returnsNotFound_whenThreadIsDeleted() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        deleteThread(threadId);

        assertNotFound(listPosts(threadId));
    }

    @Test
    void listPosts_returnsNotFound_whenOpeningPostIsDeleted() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        createPost(threadId, "Antwort", OPENED_AT.plusSeconds(3600));
        deletePost(openingPostId(threadId));

        assertNotFound(listPosts(threadId));
    }

    @ParameterizedTest
    @ValueSource(strings = {"abc", "0", "-1"})
    void listPosts_returnsBadRequest_whenIdIsInvalid(String id) {
        MvcTestResult result = mvc.get().uri("/api/threads/" + id + "/posts").exchange();

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Thread-ID");
    }

    // --- Beiträge: Seiten -----------------------------------------------------------------

    @Test
    void listPosts_returnsFirst20_whenNoParamsGiven() {
        int threadId = createThreadWithReplies(24);

        MvcTestResult result = listPosts(threadId);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content.length()").isEqualTo(20);
        assertThat(result).bodyJson().extractingPath("$.content[0].content").isEqualTo("Eröffnungspost");
        assertThat(result).bodyJson().extractingPath("$.page.size").isEqualTo(20);
        assertThat(result).bodyJson().extractingPath("$.page.number").isEqualTo(0);
        assertThat(result).bodyJson().extractingPath("$.page.totalElements").isEqualTo(25);
        assertThat(result).bodyJson().extractingPath("$.page.totalPages").isEqualTo(2);
    }

    @Test
    void listPosts_returnsRemainingPosts_whenSecondPageRequested() {
        int threadId = createThreadWithReplies(24);

        MvcTestResult result = mvc.get().uri(POSTS_URL, threadId).param("page", "1").param("size", "20").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content.length()").isEqualTo(5);
        assertThat(result).bodyJson().extractingPath("$.content[0].content").isEqualTo("Antwort 20");
        assertThat(result).bodyJson().extractingPath("$.content[4].content").isEqualTo("Antwort 24");
        assertThat(result).bodyJson().extractingPath("$.page.number").isEqualTo(1);
    }

    @Test
    void listPosts_returnsEmptyContent_whenPageIsBeyondLast() {
        int threadId = createThreadWithReplies(2);

        MvcTestResult result = mvc.get().uri(POSTS_URL, threadId).param("page", "5").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content.length()").isEqualTo(0);
        assertThat(result).bodyJson().extractingPath("$.page.totalElements").isEqualTo(3);
    }

    @ParameterizedTest
    @CsvSource({"page, -1", "size, 0", "page, abc"})
    void listPosts_returnsBadRequest_whenPagingParamsAreInvalid(String param, String value) {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);

        MvcTestResult result = mvc.get().uri(POSTS_URL, threadId).param(param, value).exchange();

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Seitenangabe");
    }

    // --- Hilfsmethoden --------------------------------------------------------------------

    private MvcTestResult getThread(int threadId) {
        return mvc.get().uri(THREAD_URL, threadId).exchange();
    }

    private MvcTestResult listPosts(int threadId) {
        return mvc.get().uri(POSTS_URL, threadId).exchange();
    }

    /** Thread mit Eröffnungspost und "Antwort 01" bis "Antwort nn", jeweils eine Minute später. */
    private int createThreadWithReplies(int replies) {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", OPENED_AT);
        for (int i = 1; i <= replies; i++) {
            createPost(threadId, "Antwort %02d".formatted(i), OPENED_AT.plus(Duration.ofMinutes(i)));
        }
        return threadId;
    }

    private void assertNotFound(MvcTestResult result) {
        assertThat(result).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Thread nicht gefunden");
    }

    private int createProfile(String username) {
        Integer accountId = jdbcTemplate.queryForObject(
                "INSERT INTO accounts (email, password_hash) VALUES (?, 'hash') RETURNING id",
                Integer.class, username + "@mock.com");
        return jdbcTemplate.queryForObject(
                "INSERT INTO profiles (account_id, username) VALUES (?, ?) RETURNING id",
                Integer.class, accountId, username);
    }

    private int createCategory(String name) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO categories (name) VALUES (?) RETURNING id", Integer.class, name);
    }

    /** Legt einen Thread samt Kategorie-Zuordnung und Eröffnungspost an. */
    private int createThread(String title, String openingPost, Instant createdAt) {
        Integer threadId = jdbcTemplate.queryForObject(
                "INSERT INTO threads (title, created_at, created_by) VALUES (?, ?, ?) RETURNING id",
                Integer.class, title, Timestamp.from(createdAt), profileId);
        jdbcTemplate.update(
                "INSERT INTO threads_categories (thread_id, category_id) VALUES (?, ?)", threadId, categoryId);
        createPost(threadId, openingPost, createdAt);
        return threadId;
    }

    private int createPost(int threadId, String content, Instant createdAt) {
        return createPost(threadId, content, createdAt, profileId);
    }

    private int createPost(int threadId, String content, Instant createdAt, int authorProfileId) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO posts (content, created_at, thread_id, created_by) VALUES (?, ?, ?, ?) RETURNING id",
                Integer.class, content, Timestamp.from(createdAt), threadId, authorProfileId);
    }

    private int openingPostId(int threadId) {
        return jdbcTemplate.queryForObject(
                "SELECT min(id) FROM posts WHERE thread_id = ?", Integer.class, threadId);
    }

    private void markSolution(int threadId, int postId) {
        jdbcTemplate.update("UPDATE threads SET solution_post_id = ? WHERE id = ?", postId, threadId);
    }

    private void deleteThread(int threadId) {
        jdbcTemplate.update("UPDATE threads SET deleted_at = now(), deleted_by = ? WHERE id = ?", profileId, threadId);
    }

    private void deletePost(int postId) {
        jdbcTemplate.update("UPDATE posts SET deleted_at = now(), deleted_by = ? WHERE id = ?", profileId, postId);
    }

    private void editPost(int postId, Instant editedAt) {
        jdbcTemplate.update("UPDATE posts SET content = content || ' (bearbeitet)', updated_at = ? WHERE id = ?",
                Timestamp.from(editedAt), postId);
    }

    private int createAttachment(int postId, String fileName, String mimeType, long fileSize) {
        Integer fileId = jdbcTemplate.queryForObject("""
                        INSERT INTO files (file_name, storage_key, mime_type, file_size)
                        VALUES (?, gen_random_uuid()::text, ?, ?) RETURNING id
                        """,
                Integer.class, fileName, mimeType, fileSize);
        return jdbcTemplate.queryForObject(
                "INSERT INTO attachments (post_id, file_id) VALUES (?, ?) RETURNING id", Integer.class, postId, fileId);
    }

    /** Stellt das Löschen eines Kontos nach: Profil bleibt als "deleted-<id>" ohne Account bestehen. */
    private void anonymizeAccount(int anonymizedProfileId) {
        Integer accountId = jdbcTemplate.queryForObject(
                "SELECT account_id FROM profiles WHERE id = ?", Integer.class, anonymizedProfileId);
        jdbcTemplate.update(
                "UPDATE profiles SET account_id = NULL, username = 'deleted-' || id WHERE id = ?", anonymizedProfileId);
        jdbcTemplate.update("DELETE FROM accounts WHERE id = ?", accountId);
    }
}
