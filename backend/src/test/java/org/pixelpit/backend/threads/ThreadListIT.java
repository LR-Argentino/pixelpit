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
class ThreadListIT {
    private static final String THREADS_URL = "/api/threads";

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
                TRUNCATE threads_categories, posts, threads, categories, profiles, accounts
                RESTART IDENTITY CASCADE
                """);
    }

    @Test
    void listThreads_returnsOk_whenGuest() {
        createThread("Navmesh backt nicht", "Ich generiere das Mesh zur Laufzeit.", Instant.parse("2026-09-22T10:00:00Z"));

        MvcTestResult result = listThreads();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content.length()").isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "MODERATOR", "ADMIN"})
    void listThreads_returnsOk_whenLoggedInWithAnyRole(String role) {
        createThread("Navmesh backt nicht", "Ich generiere das Mesh zur Laufzeit.", Instant.parse("2026-09-22T10:00:00Z"));

        MvcTestResult result = mvc.get().uri(THREADS_URL).with(user("blackbird").roles(role)).exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content.length()").isEqualTo(1);
    }

    @Test
    void listThreads_returnsFirst200Chars_whenOpeningPostIsLonger() {
        String openingPost = "a".repeat(200) + "b".repeat(50);
        createThread("Navmesh backt nicht", openingPost, Instant.parse("2026-09-22T10:00:00Z"));

        assertThat(listThreads()).bodyJson().extractingPath("$.content[0].excerpt").isEqualTo("a".repeat(200));
    }

    @Test
    void listThreads_returnsFullText_whenOpeningPostIsShort() {
        createThread("Navmesh backt nicht", "Ich generiere das Mesh zur Laufzeit.", Instant.parse("2026-09-22T10:00:00Z"));

        assertThat(listThreads()).bodyJson().extractingPath("$.content[0].excerpt")
                .isEqualTo("Ich generiere das Mesh zur Laufzeit.");
    }

    @Test
    void listThreads_returnsOnlyOpeningPost_whenThreadHasReplies() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", Instant.parse("2026-09-22T10:00:00Z"));
        createPost(threadId, "Erste Antwort", Instant.parse("2026-09-22T11:00:00Z"));
        createPost(threadId, "Zweite Antwort", Instant.parse("2026-09-22T12:00:00Z"));

        MvcTestResult result = listThreads();

        assertThat(result).bodyJson().extractingPath("$.content.length()").isEqualTo(1);
        assertThat(result).bodyJson().extractingPath("$.content[0].excerpt").isEqualTo("Eröffnungspost");
    }

    @Test
    void listThreads_returnsAllFields_whenGuest() {
        int threadId = createThread("Navmesh backt nicht", "Eröffnungspost", Instant.parse("2026-09-22T10:00:00Z"));

        MvcTestResult result = listThreads();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[0].id").isEqualTo(threadId);
        assertThat(result).bodyJson().extractingPath("$.content[0].title").isEqualTo("Navmesh backt nicht");
        assertThat(result).bodyJson().extractingPath("$.content[0].createdAt").isEqualTo("2026-09-22T10:00:00Z");
        assertThat(result).bodyJson().extractingPath("$.content[0].category.id").isEqualTo(categoryId);
        assertThat(result).bodyJson().extractingPath("$.content[0].category.name").isEqualTo("Engines");
        assertThat(result).bodyJson().extractingPath("$.content[0].excerpt").isEqualTo("Eröffnungspost");
    }

    @Test
    void listThreads_returnsNewestFirst_whenMultipleThreadsExist() {
        createThread("Älterer Thread", "Text", Instant.parse("2026-09-20T10:00:00Z"));
        createThread("Neuerer Thread", "Text", Instant.parse("2026-09-22T10:00:00Z"));

        MvcTestResult result = listThreads();

        assertThat(result).bodyJson().extractingPath("$.content[0].title").isEqualTo("Neuerer Thread");
        assertThat(result).bodyJson().extractingPath("$.content[1].title").isEqualTo("Älterer Thread");
    }

    @Test
    void listThreads_keepsOrder_whenOlderThreadGetsReply() {
        int olderThreadId = createThread("Älterer Thread", "Text", Instant.parse("2026-09-20T10:00:00Z"));
        createThread("Neuerer Thread", "Text", Instant.parse("2026-09-22T10:00:00Z"));
        createPost(olderThreadId, "Neue Antwort", Instant.parse("2026-09-23T10:00:00Z"));

        MvcTestResult result = listThreads();

        assertThat(result).bodyJson().extractingPath("$.content[0].title").isEqualTo("Neuerer Thread");
        assertThat(result).bodyJson().extractingPath("$.content[1].title").isEqualTo("Älterer Thread");
    }

    @Test
    void listThreads_excludesThread_whenThreadIsDeleted() {
        createThread("Sichtbarer Thread", "Text", Instant.parse("2026-09-20T10:00:00Z"));
        deleteThread(createThread("Gelöschter Thread", "Text", Instant.parse("2026-09-22T10:00:00Z")));

        MvcTestResult result = listThreads();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content.length()").isEqualTo(1);
        assertThat(result).bodyJson().extractingPath("$.content[0].title").isEqualTo("Sichtbarer Thread");
    }

    @ParameterizedTest
    @ValueSource(strings = {"MODERATOR", "ADMIN"})
    void listThreads_excludesDeletedThread_whenModeratorOrAdmin(String role) {
        createThread("Sichtbarer Thread", "Text", Instant.parse("2026-09-20T10:00:00Z"));
        deleteThread(createThread("Gelöschter Thread", "Text", Instant.parse("2026-09-22T10:00:00Z")));

        MvcTestResult result = mvc.get().uri(THREADS_URL).with(user("moderator").roles(role)).exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content.length()").isEqualTo(1);
        assertThat(result).bodyJson().extractingPath("$.content[0].title").isEqualTo("Sichtbarer Thread");
    }

    @Test
    void listThreads_countsOnlyVisibleThreads_whenOneIsDeleted() {
        createThread("Erster Thread", "Text", Instant.parse("2026-09-20T10:00:00Z"));
        createThread("Zweiter Thread", "Text", Instant.parse("2026-09-21T10:00:00Z"));
        deleteThread(createThread("Gelöschter Thread", "Text", Instant.parse("2026-09-22T10:00:00Z")));

        assertThat(listThreads()).bodyJson().extractingPath("$.page.totalElements").isEqualTo(2);
    }

    @Test
    void listThreads_includesThread_whenCreatorAccountIsDeleted() {
        createThread("Navmesh backt nicht", "Eröffnungspost", Instant.parse("2026-09-22T10:00:00Z"));
        anonymizeCreatorAccount();

        MvcTestResult result = listThreads();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[0].title").isEqualTo("Navmesh backt nicht");
        assertThat(result).bodyJson().extractingPath("$.content[0].excerpt").isEqualTo("Eröffnungspost");
    }

    @Test
    void listThreads_returnsFirst20_whenNoParamsGiven() {
        createThreads(25);

        MvcTestResult result = listThreads();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content.length()").isEqualTo(20);
        assertThat(result).bodyJson().extractingPath("$.content[0].title").isEqualTo("Thread 25");
        assertThat(result).bodyJson().extractingPath("$.page.size").isEqualTo(20);
        assertThat(result).bodyJson().extractingPath("$.page.number").isEqualTo(0);
        assertThat(result).bodyJson().extractingPath("$.page.totalElements").isEqualTo(25);
        assertThat(result).bodyJson().extractingPath("$.page.totalPages").isEqualTo(2);
    }

    @Test
    void listThreads_returnsRemainingThreads_whenSecondPageRequested() {
        createThreads(25);

        MvcTestResult result = mvc.get().uri(THREADS_URL).param("page", "1").param("size", "20").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content.length()").isEqualTo(5);
        assertThat(result).bodyJson().extractingPath("$.content[0].title").isEqualTo("Thread 05");
        assertThat(result).bodyJson().extractingPath("$.content[4].title").isEqualTo("Thread 01");
        assertThat(result).bodyJson().extractingPath("$.page.number").isEqualTo(1);
    }

    @Test
    void listThreads_returnsEmptyContent_whenPageIsBeyondLast() {
        createThreads(3);

        MvcTestResult result = mvc.get().uri(THREADS_URL).param("page", "5").exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content.length()").isEqualTo(0);
        assertThat(result).bodyJson().extractingPath("$.page.totalElements").isEqualTo(3);
    }

    @ParameterizedTest
    @CsvSource({"page, -1", "size, 0", "page, abc"})
    void listThreads_returnsBadRequest_whenPagingParamsAreInvalid(String param, String value) {
        MvcTestResult result = mvc.get().uri(THREADS_URL).param(param, value).exchange();

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Seitenangabe");
    }

    private MvcTestResult listThreads() {
        return mvc.get().uri(THREADS_URL).exchange();
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

    /** Legt "Thread 01" bis "Thread nn" an, jeweils einen Tag später als der vorige. */
    private void createThreads(int count) {
        Instant start = Instant.parse("2026-09-01T10:00:00Z");
        for (int i = 1; i <= count; i++) {
            createThread("Thread %02d".formatted(i), "Text", start.plus(Duration.ofDays(i)));
        }
    }

    /** Stellt das Löschen eines Kontos nach: Profil bleibt als "deleted-<id>" ohne Account bestehen. */
    private void anonymizeCreatorAccount() {
        Integer accountId = jdbcTemplate.queryForObject(
                "SELECT account_id FROM profiles WHERE id = ?", Integer.class, profileId);
        jdbcTemplate.update(
                "UPDATE profiles SET account_id = NULL, username = 'deleted-' || id WHERE id = ?", profileId);
        jdbcTemplate.update("DELETE FROM accounts WHERE id = ?", accountId);
    }

    private void deleteThread(int threadId) {
        jdbcTemplate.update("UPDATE threads SET deleted_at = now(), deleted_by = ? WHERE id = ?", profileId, threadId);
    }

    private void createPost(int threadId, String content, Instant createdAt) {
        jdbcTemplate.update(
                "INSERT INTO posts (content, created_at, thread_id, created_by) VALUES (?, ?, ?, ?)",
                content, Timestamp.from(createdAt), threadId, profileId);
    }
}
