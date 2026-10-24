package org.pixelpit.backend.threads;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.pixelpit.backend.TestcontainersConfiguration;
import org.pixelpit.backend.account.AccountDetails;
import org.pixelpit.backend.account.Role;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class EditPostIT {
    private static final String POST_URL = "/api/threads/{id}/posts/{postId}";
    private static final String POSTS_URL = "/api/threads/{id}/posts";
    private static final String REPLY = "Hast du den Cache geleert?";
    private static final String NEW_CONTENT = "Hast du den Cache geleert? Bei mir half das.";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /** Ersteller des Threads und damit Autor des Eröffnungsbeitrags */
    private int threadAuthorAccountId;
    private int threadAuthorProfileId;
    /** Autor der Antwort */
    private int replyAuthorAccountId;
    private int replyAuthorProfileId;
    /** Weder Ersteller noch Autor */
    private int strangerAccountId;
    private int threadId;
    private int openingPostId;
    private int replyId;

    @BeforeEach
    void setUp() {
        truncate();
        threadAuthorAccountId = createAccountWithProfile("vera");
        threadAuthorProfileId = profileIdOf(threadAuthorAccountId);
        replyAuthorAccountId = createAccountWithProfile("blackbird");
        replyAuthorProfileId = profileIdOf(replyAuthorAccountId);
        strangerAccountId = createAccountWithProfile("kim");
        threadId = createThread(threadAuthorProfileId, "Godot 4 Shader kompiliert nicht");
        openingPostId = openingPostOf(threadId);
        replyId = addPost(threadId, replyAuthorProfileId, REPLY, "30 minutes");
    }

    @AfterEach
    void truncate() {
        jdbcTemplate.update("""
                TRUNCATE attachments, files, threads_categories, posts, threads, categories, profiles, accounts
                RESTART IDENTITY CASCADE
                """);
    }

    // --- Nur der Autor bearbeitet oder löscht seinen Beitrag

    @Test
    void updatePost_returns204_whenAuthorEditsReply() {
        MvcTestResult result = updatePost(asReplyAuthor(Role.USER), threadId, replyId, body(NEW_CONTENT));

        assertThat(result).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(contentOf(replyId)).isEqualTo(NEW_CONTENT);
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"MODERATOR", "ADMIN"})
    void updateAndDeletePost_return204_whenAuthorIsModeratorOrAdmin(Role role) {
        setRole(replyAuthorAccountId, role);

        assertThat(updatePost(asReplyAuthor(role), threadId, replyId, body(NEW_CONTENT)))
                .hasStatus(HttpStatus.NO_CONTENT);
        assertThat(deletePost(asReplyAuthor(role), threadId, replyId)).hasStatus(HttpStatus.NO_CONTENT);
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void updateAndDeletePost_return403_whenOtherUserModeratorOrAdmin(Role role) {
        setRole(strangerAccountId, role);

        assertForbidden(updatePost(asAccount(strangerAccountId, role), threadId, replyId, body(NEW_CONTENT)));
        assertForbidden(deletePost(asAccount(strangerAccountId, role), threadId, replyId));
        assertThat(contentOf(replyId)).isEqualTo(REPLY);
        assertThat(isDeleted(replyId)).isFalse();
    }

    @Test
    void updateAndDeletePost_return401_whenGuest() {
        assertThat(updatePost(csrf(), threadId, replyId, body(NEW_CONTENT))).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(deletePost(csrf(), threadId, replyId)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(contentOf(replyId)).isEqualTo(REPLY);
        assertThat(isDeleted(replyId)).isFalse();
    }

    @Test
    void updateAndDeletePost_return403_whenCsrfTokenMissing() {
        RequestPostProcessor withoutCsrf = user(accountDetails(replyAuthorAccountId, Role.USER));

        assertThat(updatePost(withoutCsrf, threadId, replyId, body(NEW_CONTENT))).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(deletePost(withoutCsrf, threadId, replyId)).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(contentOf(replyId)).isEqualTo(REPLY);
        assertThat(isDeleted(replyId)).isFalse();
    }

    // --- Beitrag bearbeiten ersetzt seinen Text

    @Test
    void updatePost_replacesStrippedContentAndSetsEditedAt_whenValid() {
        addPost(threadId, threadAuthorProfileId, "Spätere Antwort", "10 minutes");

        assertThat(updatePost(asReplyAuthor(Role.USER), threadId, replyId, body("  " + NEW_CONTENT + "  ")))
                .hasStatus(HttpStatus.NO_CONTENT);

        MvcTestResult posts = mvc.get().uri(POSTS_URL, threadId).exchange();
        assertThat(posts).hasStatusOk();
        assertThat(posts).bodyJson().extractingPath("$.content[*].id")
                .isEqualTo(List.of(openingPostId, replyId, replyId + 1));
        assertThat(posts).bodyJson().extractingPath("$.content[1].content").isEqualTo(NEW_CONTENT);
        assertThat(posts).bodyJson().extractingPath("$.content[1].author").isEqualTo("blackbird");
        assertThat(posts).bodyJson().extractingPath("$.content[1].editedAt").isNotNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void updatePost_returns400AndKeepsEditedAtNull_whenContentInvalid(String content) {
        assertContentError(updatePost(asReplyAuthor(Role.USER), threadId, replyId, body(content)));
        assertThat(contentOf(replyId)).isEqualTo(REPLY);
        assertThat(updatedAtOf(replyId)).isNull();
    }

    @Test
    void updatePost_returns400AndKeepsEditedAtNull_whenContentTooLong() {
        assertContentError(updatePost(asReplyAuthor(Role.USER), threadId, replyId, body("a".repeat(20_001))));
        assertThat(updatedAtOf(replyId)).isNull();
    }

    @Test
    void updatePost_returns400_whenBodyNotJson() {
        MvcTestResult result = updatePost(asReplyAuthor(Role.USER), threadId, replyId, "{\"content\": ");

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Anfrage");
    }

    // --- Beitrag löschen blendet ihn für alle aus

    @Test
    void deletePost_hidesReplyAndReducesTotal_whenAuthorDeletesReply() {
        addPost(threadId, threadAuthorProfileId, "Dritter Beitrag", "10 minutes");

        assertThat(deletePost(asReplyAuthor(Role.USER), threadId, replyId)).hasStatus(HttpStatus.NO_CONTENT);

        MvcTestResult posts = mvc.get().uri(POSTS_URL, threadId).exchange();
        assertThat(posts).hasStatusOk();
        assertThat(posts).bodyJson().extractingPath("$.page.totalElements").isEqualTo(2);
        assertThat(posts).bodyJson().extractingPath("$.content[*].id").isEqualTo(List.of(openingPostId, replyId + 1));
        assertThat(jdbcTemplate.queryForObject("SELECT deleted_by FROM posts WHERE id = ?", Integer.class, replyId))
                .isEqualTo(replyAuthorProfileId);
    }

    @Test
    void getThread_hasNoSolution_whenSolutionPostDeleted() {
        jdbcTemplate.update("UPDATE threads SET solution_post_id = ? WHERE id = ?", replyId, threadId);

        assertThat(deletePost(asReplyAuthor(Role.USER), threadId, replyId)).hasStatus(HttpStatus.NO_CONTENT);

        MvcTestResult thread = mvc.get().uri("/api/threads/{id}", threadId).exchange();
        assertThat(thread).hasStatusOk();
        assertThat(thread).bodyJson().extractingPath("$.solutionPostId").isNull();
        assertThat(thread).bodyJson().extractingPath("$.solution").isNull();
    }

    @Test
    void updateAndDeletePost_return404_whenPostAlreadyDeleted() {
        assertThat(deletePost(asReplyAuthor(Role.USER), threadId, replyId)).hasStatus(HttpStatus.NO_CONTENT);

        assertPostNotFound(deletePost(asReplyAuthor(Role.USER), threadId, replyId));
        assertPostNotFound(updatePost(asReplyAuthor(Role.USER), threadId, replyId, body(NEW_CONTENT)));
    }

    // --- Eigene Antworten bleiben jederzeit änderbar

    @Test
    void updateAndDeletePost_return204_whenReplyHasLaterReplies() {
        addPost(threadId, threadAuthorProfileId, "Dritter Beitrag", "10 minutes");
        addPost(threadId, strangerProfileId(), "Vierter Beitrag", "5 minutes");

        assertThat(updatePost(asReplyAuthor(Role.USER), threadId, replyId, body(NEW_CONTENT)))
                .hasStatus(HttpStatus.NO_CONTENT);
        assertThat(deletePost(asReplyAuthor(Role.USER), threadId, replyId)).hasStatus(HttpStatus.NO_CONTENT);
    }

    @Test
    void updatePost_returns403_whenOtherUserEditsReply() {
        assertForbidden(updatePost(asThreadAuthor(Role.USER), threadId, replyId, body(NEW_CONTENT)));
    }

    // --- Eröffnungsbeitrag folgt der Sperre des Threads

    @Test
    void updatePost_returns204AndSetsEditedAt_whenOpeningPostWithoutReplies() {
        deleteReplyBySql();

        assertThat(updatePost(asThreadAuthor(Role.USER), threadId, openingPostId, body(NEW_CONTENT)))
                .hasStatus(HttpStatus.NO_CONTENT);

        MvcTestResult posts = mvc.get().uri(POSTS_URL, threadId).exchange();
        assertThat(posts).bodyJson().extractingPath("$.content[0].content").isEqualTo(NEW_CONTENT);
        assertThat(posts).bodyJson().extractingPath("$.content[0].editedAt").isNotNull();
    }

    @Test
    void updateAndDeletePost_return409_whenOpeningPostAndThreadHasReplies() {
        String before = contentOf(openingPostId);

        assertRepliesConflict(updatePost(asThreadAuthor(Role.USER), threadId, openingPostId, body(NEW_CONTENT)));
        assertRepliesConflict(deletePost(asThreadAuthor(Role.USER), threadId, openingPostId));

        assertThat(contentOf(openingPostId)).isEqualTo(before);
        assertThat(mvc.get().uri("/api/threads/{id}", threadId).exchange()).hasStatusOk();
    }

    @Test
    void deletePost_deletesThread_whenOpeningPostWithoutReplies() {
        deleteReplyBySql();

        assertThat(deletePost(asThreadAuthor(Role.USER), threadId, openingPostId)).hasStatus(HttpStatus.NO_CONTENT);

        assertThat(mvc.get().uri("/api/threads/{id}", threadId).exchange()).hasStatus(HttpStatus.NOT_FOUND);
    }

    // --- Unbekannte und ungültige Beiträge

    @Test
    void updatePost_returns404_whenPostBelongsToOtherThread() {
        int otherThreadId = createThread(threadAuthorProfileId, "Anderer Thread mit Titel");

        assertPostNotFound(updatePost(asReplyAuthor(Role.USER), otherThreadId, replyId, body(NEW_CONTENT)));
        assertThat(contentOf(replyId)).isEqualTo(REPLY);
    }

    @Test
    void updateAndDeletePost_return404_whenOtherUsersPostDeleted() {
        deleteReplyBySql();

        assertPostNotFound(updatePost(asAccount(strangerAccountId, Role.USER), threadId, replyId, body(NEW_CONTENT)));
        assertPostNotFound(deletePost(asAccount(strangerAccountId, Role.USER), threadId, replyId));
    }

    @Test
    void updatePost_returns404ThreadNotFound_whenThreadDeleted() {
        jdbcTemplate.update("UPDATE threads SET deleted_at = now(), deleted_by = ? WHERE id = ?",
                threadAuthorProfileId, threadId);

        MvcTestResult result = updatePost(asReplyAuthor(Role.USER), threadId, replyId, body(NEW_CONTENT));

        assertThat(result).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Thread nicht gefunden");
    }

    @ParameterizedTest
    @ValueSource(strings = {"abc", "0", "-1"})
    void updateAndDeletePost_return400_whenPostIdInvalid(String postId) {
        String url = "/api/threads/" + threadId + "/posts/" + postId;
        MvcTestResult update = mvc.put().uri(url).with(asReplyAuthor(Role.USER))
                .contentType(MediaType.APPLICATION_JSON).content(body(NEW_CONTENT)).exchange();
        MvcTestResult delete = mvc.delete().uri(url).with(asReplyAuthor(Role.USER)).exchange();

        assertThat(update).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(update).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Beitrags-ID");
        assertThat(delete).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(delete).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Beitrags-ID");
    }

    // --- Hilfsmethoden

    private void assertForbidden(MvcTestResult result) {
        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Keine Berechtigung");
    }

    private void assertPostNotFound(MvcTestResult result) {
        assertThat(result).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Beitrag nicht gefunden");
    }

    private void assertRepliesConflict(MvcTestResult result) {
        assertThat(result).hasStatus(HttpStatus.CONFLICT);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Thread hat bereits Antworten");
    }

    private void assertContentError(MvcTestResult result) {
        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Eingabe");
        assertThat(result).bodyJson().extractingPath("$.errors.content").asArray().isNotEmpty();
    }

    private MvcTestResult updatePost(RequestPostProcessor auth, int id, int postId, String body) {
        return mvc.put().uri(POST_URL, id, postId).with(auth)
                .contentType(MediaType.APPLICATION_JSON).content(body).exchange();
    }

    private MvcTestResult deletePost(RequestPostProcessor auth, int id, int postId) {
        return mvc.delete().uri(POST_URL, id, postId).with(auth).exchange();
    }

    private RequestPostProcessor asThreadAuthor(Role role) {
        return asAccount(threadAuthorAccountId, role);
    }

    private RequestPostProcessor asReplyAuthor(Role role) {
        return asAccount(replyAuthorAccountId, role);
    }

    /** Angemeldeter Nutzer mit gültigem CSRF-Token. */
    private RequestPostProcessor asAccount(int accountId, Role role) {
        return request -> csrf().postProcessRequest(user(accountDetails(accountId, role)).postProcessRequest(request));
    }

    private AccountDetails accountDetails(int accountId, Role role) {
        return new AccountDetails(accountId, accountId + "@mock.com", "hash", role);
    }

    private void setRole(int accountId, Role role) {
        jdbcTemplate.update("UPDATE accounts SET role = ? WHERE id = ?", role.name(), accountId);
    }

    private int createAccountWithProfile(String username) {
        Integer id = jdbcTemplate.queryForObject(
                "INSERT INTO accounts (email, password_hash) VALUES (?, 'hash') RETURNING id",
                Integer.class, username + "@mock.com");
        jdbcTemplate.update("INSERT INTO profiles (account_id, username) VALUES (?, ?)", id, username);
        return id;
    }

    private int profileIdOf(int accountId) {
        return jdbcTemplate.queryForObject("SELECT id FROM profiles WHERE account_id = ?", Integer.class, accountId);
    }

    private int strangerProfileId() {
        return profileIdOf(strangerAccountId);
    }

    /** Thread mit Eröffnungsbeitrag des angegebenen Profils. */
    private int createThread(int authorProfileId, String title) {
        int id = jdbcTemplate.queryForObject(
                "INSERT INTO threads (title, created_by) VALUES (?, ?) RETURNING id",
                Integer.class, title, authorProfileId);
        addPost(id, authorProfileId, "Seit dem Update bricht der Compiler ab.", "1 hour");
        return id;
    }

    private int addPost(int id, int profileId, String content, String age) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO posts (content, thread_id, created_by, created_at) VALUES (?, ?, ?, now() - ?::interval) RETURNING id",
                Integer.class, content, id, profileId, age);
    }

    private int openingPostOf(int id) {
        return jdbcTemplate.queryForObject("SELECT min(id) FROM posts WHERE thread_id = ?", Integer.class, id);
    }

    private void deleteReplyBySql() {
        jdbcTemplate.update("UPDATE posts SET deleted_at = now(), deleted_by = ? WHERE id = ?",
                replyAuthorProfileId, replyId);
    }

    private String contentOf(int postId) {
        return jdbcTemplate.queryForObject("SELECT content FROM posts WHERE id = ?", String.class, postId);
    }

    private Object updatedAtOf(int postId) {
        return jdbcTemplate.queryForObject("SELECT updated_at FROM posts WHERE id = ?", Object.class, postId);
    }

    private boolean isDeleted(int postId) {
        return jdbcTemplate.queryForObject("SELECT deleted_at IS NOT NULL FROM posts WHERE id = ?", Boolean.class, postId);
    }

    private static String body(String content) {
        return "{\"content\": \"" + content + "\"}";
    }
}
