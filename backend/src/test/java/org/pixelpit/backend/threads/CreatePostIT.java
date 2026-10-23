package org.pixelpit.backend.threads;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.pixelpit.backend.TestcontainersConfiguration;
import org.pixelpit.backend.account.Role;
import org.pixelpit.backend.auth.AccountDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class CreatePostIT {
    private static final String POSTS_URL = "/api/threads/{id}/posts";
    private static final String CONTENT = "Hast du den Cache geleert?";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private int accountId;
    private int profileId;
    private int threadId;

    @BeforeEach
    void setUp() {
        truncate();
        accountId = createAccountWithProfile("blackbird");
        profileId = jdbcTemplate.queryForObject(
                "SELECT id FROM profiles WHERE account_id = ?", Integer.class, accountId);
        int authorProfileId = jdbcTemplate.queryForObject("SELECT id FROM profiles WHERE account_id = ?",
                Integer.class, createAccountWithProfile("vera"));
        threadId = createThread(authorProfileId, "Godot 4 Shader kompiliert nicht");
    }

    @AfterEach
    void truncate() {
        jdbcTemplate.update("""
                TRUNCATE attachments, files, threads_categories, posts, threads, categories, profiles, accounts
                RESTART IDENTITY CASCADE
                """);
    }

    // --- Berechtigung

    @Test
    void createPost_returnsCreated_whenLoggedInAsUser() {
        MvcTestResult result = createPost(asUser(Role.USER), threadId, body(CONTENT));

        assertThat(result).hasStatus(HttpStatus.CREATED);
        assertThat(countPosts(threadId)).isEqualTo(2);
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"MODERATOR", "ADMIN"})
    void createPost_returnsCreated_whenLoggedInAsModeratorOrAdmin(Role role) {
        MvcTestResult result = createPost(asUser(role), threadId, body(CONTENT));

        assertThat(result).hasStatus(HttpStatus.CREATED);
        assertThat(countPosts(threadId)).isEqualTo(2);
    }

    @Test
    void createPost_returnsUnauthorized_whenGuest() {
        MvcTestResult result = createPost(csrf(), threadId, body(CONTENT));

        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(countPosts(threadId)).isEqualTo(1);
    }

    @Test
    void createPost_returnsForbidden_whenCsrfTokenMissing() {
        MvcTestResult result = createPost(user(accountDetails(Role.USER)), threadId, body(CONTENT));

        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(countPosts(threadId)).isEqualTo(1);
    }

    // --- Inhalt und Antwort

    @Test
    void createPost_appearsAsLastPost_whenCreated() {
        addPost(threadId, "Zweiter Beitrag");
        addPost(threadId, "Dritter Beitrag");

        assertThat(createPost(asUser(Role.USER), threadId, body(CONTENT))).hasStatus(HttpStatus.CREATED);

        MvcTestResult posts = mvc.get().uri(POSTS_URL, threadId).exchange();
        assertThat(posts).hasStatusOk();
        assertThat(posts).bodyJson().extractingPath("$.content.length()").isEqualTo(4);
        assertThat(posts).bodyJson().extractingPath("$.content[3].content").isEqualTo(CONTENT);
        assertThat(posts).bodyJson().extractingPath("$.content[3].author").isEqualTo("blackbird");
        assertThat(posts).bodyJson().extractingPath("$.content[3].editedAt").isNull();
        assertThat(posts).bodyJson().extractingPath("$.content[3].solution").isEqualTo(false);
    }

    @Test
    void createPost_leavesThreadUnchanged_whenCreated() {
        MvcTestResult before = mvc.get().uri("/api/threads/{id}", threadId).exchange();

        createPost(asUser(Role.USER), threadId, body(CONTENT));

        MvcTestResult after = mvc.get().uri("/api/threads/{id}", threadId).exchange();
        assertThat(after).hasStatusOk();
        assertThat(after.getResponse().getContentAsByteArray())
                .isEqualTo(before.getResponse().getContentAsByteArray());
    }

    @Test
    void createPost_leavesNoPost_whenContentIsBlank() {
        MvcTestResult result = createPost(asUser(Role.USER), threadId, body(""));

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(countPosts(threadId)).isEqualTo(1);
    }

    @Test
    void createPost_returnsIdOfNewPost_whenCreated() {
        MvcTestResult result = createPost(asUser(Role.USER), threadId, body(CONTENT));

        assertThat(result).hasStatus(HttpStatus.CREATED);
        int newestId = jdbcTemplate.queryForObject("SELECT max(id) FROM posts", Integer.class);
        assertThat(result).bodyJson().extractingPath("$.id").isEqualTo(newestId);
        assertThat(result).headers().doesNotContainHeader("Location");
        assertThat(mvc.get().uri(POSTS_URL, threadId).exchange())
                .bodyJson().extractingPath("$.content[1].id").isEqualTo(newestId);
    }

    @Test
    void createPost_returnsNoId_whenContentTooLong() {
        MvcTestResult result = createPost(asUser(Role.USER), threadId, body("a".repeat(20_001)));

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().doesNotHavePath("$.id");
    }

    // --- Sichtbarkeit des Threads

    @Test
    void createPost_returnsCreated_whenThreadVisible() {
        assertThat(createPost(asUser(Role.USER), threadId, body(CONTENT))).hasStatus(HttpStatus.CREATED);
    }

    @Test
    void createPost_returnsNotFound_whenThreadUnknown() {
        MvcTestResult result = createPost(asUser(Role.USER), 999, body(CONTENT));

        assertThat(result).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Thread nicht gefunden");
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"MODERATOR", "ADMIN"})
    void createPost_returnsNotFound_whenThreadDeleted(Role role) {
        jdbcTemplate.update("UPDATE threads SET deleted_at = now(), deleted_by = ? WHERE id = ?", profileId, threadId);

        MvcTestResult result = createPost(asUser(role), threadId, body(CONTENT));

        assertThat(result).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Thread nicht gefunden");
        assertThat(countPosts(threadId)).isEqualTo(1);
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"MODERATOR", "ADMIN"})
    void createPost_returnsNotFound_whenOpeningPostDeleted(Role role) {
        jdbcTemplate.update("UPDATE posts SET deleted_at = now(), deleted_by = ? WHERE thread_id = ?",
                profileId, threadId);

        MvcTestResult result = createPost(asUser(role), threadId, body(CONTENT));

        assertThat(result).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(countPosts(threadId)).isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"abc", "0", "-1"})
    void createPost_returnsBadRequest_whenThreadIdInvalid(String id) {
        MvcTestResult result = mvc.post().uri("/api/threads/" + id + "/posts").with(asUser(Role.USER))
                .contentType(MediaType.APPLICATION_JSON).content(body(CONTENT)).exchange();

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Thread-ID");
    }

    // --- Text und Eingabefehler

    @Test
    void createPost_returnsCreated_whenContentHasMaxLength() {
        assertThat(createPost(asUser(Role.USER), threadId, body("a".repeat(20_000)))).hasStatus(HttpStatus.CREATED);
    }

    @Test
    void createPost_storesStrippedContent_whenContentHasSurroundingSpaces() {
        assertThat(createPost(asUser(Role.USER), threadId, body("  Danke!  "))).hasStatus(HttpStatus.CREATED);

        assertThat(jdbcTemplate.queryForObject("SELECT content FROM posts WHERE id = (SELECT max(id) FROM posts)",
                String.class)).isEqualTo("Danke!");
    }

    @Test
    void createPost_returnsBadRequest_whenContentTooLong() {
        assertContentError(createPost(asUser(Role.USER), threadId, body("a".repeat(20_001))));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"content\": \"\"}", "{\"content\": \"   \"}"})
    void createPost_returnsBadRequest_whenContentMissingOrBlank(String body) {
        assertContentError(createPost(asUser(Role.USER), threadId, body));
        assertThat(countPosts(threadId)).isEqualTo(1);
    }

    @Test
    void createPost_returnsCreated_whenBodyValid() {
        assertThat(createPost(asUser(Role.USER), threadId, body(CONTENT))).hasStatus(HttpStatus.CREATED);
    }

    @Test
    void createPost_returnsGermanTitleAndContentError_whenContentBlank() {
        assertContentError(createPost(asUser(Role.USER), threadId, body("")));
    }

    @Test
    void createPost_returnsBadRequest_whenBodyIsNotJson() {
        MvcTestResult result = createPost(asUser(Role.USER), threadId, "{\"content\": ");

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Anfrage");
    }

    private void assertContentError(MvcTestResult result) {
        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Eingabe");
        assertThat(result).bodyJson().extractingPath("$.errors.content").asArray().isNotEmpty();
    }

    private MvcTestResult createPost(RequestPostProcessor auth, int id, String body) {
        return mvc.post().uri(POSTS_URL, id).with(auth)
                .contentType(MediaType.APPLICATION_JSON).content(body).exchange();
    }

    /** Angemeldeter Nutzer mit gültigem CSRF-Token. */
    private RequestPostProcessor asUser(Role role) {
        return request -> csrf().postProcessRequest(user(accountDetails(role)).postProcessRequest(request));
    }

    private AccountDetails accountDetails(Role role) {
        return new AccountDetails(accountId, "blackbird@mock.com", "hash", role);
    }

    private int createAccountWithProfile(String username) {
        Integer id = jdbcTemplate.queryForObject(
                "INSERT INTO accounts (email, password_hash) VALUES (?, 'hash') RETURNING id",
                Integer.class, username + "@mock.com");
        jdbcTemplate.update("INSERT INTO profiles (account_id, username) VALUES (?, ?)", id, username);
        return id;
    }

    /** Thread mit Eröffnungsbeitrag des angegebenen Profils. */
    private int createThread(int authorProfileId, String title) {
        int id = jdbcTemplate.queryForObject(
                "INSERT INTO threads (title, created_by) VALUES (?, ?) RETURNING id",
                Integer.class, title, authorProfileId);
        jdbcTemplate.update("INSERT INTO posts (content, thread_id, created_by, created_at) VALUES (?, ?, ?, now() - interval '1 hour')",
                "Seit dem Update bricht der Compiler ab.", id, authorProfileId);
        return id;
    }

    private void addPost(int id, String content) {
        jdbcTemplate.update("INSERT INTO posts (content, thread_id, created_by, created_at) VALUES (?, ?, ?, now() - interval '30 minutes')",
                content, id, profileId);
    }

    private static String body(String content) {
        return "{\"content\": \"" + content + "\"}";
    }

    private int countPosts(int id) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM posts WHERE thread_id = ?", Integer.class, id);
    }
}
