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

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class EditThreadIT {
    private static final String THREAD_URL = "/api/threads/{id}";
    private static final String TITLE = "Shader rukelt";
    private static final String NEW_TITLE = "Shader ruckelt auf Android";
    private static final String OPENING_CONTENT = "Seit dem Update ruckelt der Shader.";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private int authorAccountId;
    private int authorProfileId;
    private int otherAccountId;
    private int otherProfileId;
    private int showcaseId;
    private int gameDesignId;
    private int enginesId;
    private int threadId;

    @BeforeEach
    void setUp() {
        truncate();
        authorAccountId = createAccountWithProfile("vera");
        authorProfileId = profileIdOf(authorAccountId);
        otherAccountId = createAccountWithProfile("blackbird");
        otherProfileId = profileIdOf(otherAccountId);
        showcaseId = createCategory("Showcase");
        gameDesignId = createCategory("Game Design");
        enginesId = createCategory("Engines");
        threadId = createThread(authorProfileId, TITLE, showcaseId);
    }

    @AfterEach
    void truncate() {
        jdbcTemplate.update("""
                TRUNCATE attachments, files, threads_categories, posts, threads, categories, profiles, accounts
                RESTART IDENTITY CASCADE
                """);
    }

    // --- Nur der Ersteller bearbeitet oder löscht seinen Thread

    @Test
    void updateThread_returns204_whenAuthorWithoutReplies() {
        MvcTestResult result = updateThread(asAuthor(Role.USER), threadId, body(NEW_TITLE, gameDesignId));

        assertThat(result).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(titleOf(threadId)).isEqualTo(NEW_TITLE);
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"MODERATOR", "ADMIN"})
    void updateAndDeleteThread_return204_whenAuthorIsModeratorOrAdmin(Role role) {
        setRole(authorAccountId, role);

        assertThat(updateThread(asAuthor(role), threadId, body(NEW_TITLE, gameDesignId)))
                .hasStatus(HttpStatus.NO_CONTENT);
        assertThat(deleteThread(asAuthor(role), threadId)).hasStatus(HttpStatus.NO_CONTENT);
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void updateAndDeleteThread_return403_whenOtherUserModeratorOrAdmin(Role role) {
        setRole(otherAccountId, role);

        MvcTestResult update = updateThread(asOther(role), threadId, body(NEW_TITLE, gameDesignId));
        MvcTestResult delete = deleteThread(asOther(role), threadId);

        assertForbidden(update);
        assertForbidden(delete);
        assertThat(titleOf(threadId)).isEqualTo(TITLE);
        assertThat(categoryNamesOf(threadId)).containsExactly("Showcase");
        assertThat(mvc.get().uri(THREAD_URL, threadId).exchange()).hasStatusOk();
    }

    @Test
    void updateAndDeleteThread_return401_whenGuest() {
        assertThat(updateThread(csrf(), threadId, body(NEW_TITLE, gameDesignId)))
                .hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(deleteThread(csrf(), threadId)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(titleOf(threadId)).isEqualTo(TITLE);
        assertThat(mvc.get().uri(THREAD_URL, threadId).exchange()).hasStatusOk();
    }

    @Test
    void updateAndDeleteThread_return403_whenCsrfTokenMissing() {
        RequestPostProcessor withoutCsrf = user(accountDetails(authorAccountId, Role.USER));

        assertThat(updateThread(withoutCsrf, threadId, body(NEW_TITLE, gameDesignId)))
                .hasStatus(HttpStatus.FORBIDDEN);
        assertThat(deleteThread(withoutCsrf, threadId)).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(titleOf(threadId)).isEqualTo(TITLE);
        assertThat(mvc.get().uri(THREAD_URL, threadId).exchange()).hasStatusOk();
    }

    // --- Thread bearbeiten ändert Titel und Kategorien

    @Test
    void updateThread_replacesTitleAndCategories_whenValid() {
        Object createdAtBefore = createdAtOf(threadId);

        assertThat(updateThread(asAuthor(Role.USER), threadId, body("  " + NEW_TITLE + "  ", gameDesignId)))
                .hasStatus(HttpStatus.NO_CONTENT);

        MvcTestResult after = mvc.get().uri(THREAD_URL, threadId).exchange();
        assertThat(after).hasStatusOk();
        assertThat(after).bodyJson().extractingPath("$.title").isEqualTo(NEW_TITLE);
        assertThat(after).bodyJson().extractingPath("$.categories[*].name").isEqualTo(List.of("Game Design"));
        assertThat(after).bodyJson().extractingPath("$.author").isEqualTo("vera");
        assertThat(createdAtOf(threadId)).isEqualTo(createdAtBefore);
    }

    @Test
    void listThreads_showsNewTitleAtSamePosition_whenThreadUpdated() {
        int newer = createThread(otherProfileId, "Neuerer Thread", enginesId);
        jdbcTemplate.update("UPDATE threads SET created_at = now() - interval '1 day' WHERE id = ?", threadId);

        assertThat(updateThread(asAuthor(Role.USER), threadId, body(NEW_TITLE, gameDesignId)))
                .hasStatus(HttpStatus.NO_CONTENT);

        MvcTestResult list = mvc.get().uri("/api/threads").exchange();
        assertThat(list).hasStatusOk();
        assertThat(list).bodyJson().extractingPath("$.content[*].id").isEqualTo(List.of(newer, threadId));
        assertThat(list).bodyJson().extractingPath("$.content[1].title").isEqualTo(NEW_TITLE);
    }

    @ParameterizedTest
    @ValueSource(strings = {"Hi", "     ", ""})
    void updateThread_returns400_whenTitleInvalid(String title) {
        assertFieldError(updateThread(asAuthor(Role.USER), threadId, body(title, gameDesignId)), "title");
        assertThat(titleOf(threadId)).isEqualTo(TITLE);
    }

    @Test
    void updateThread_returns400_whenTitleTooLong() {
        assertFieldError(updateThread(asAuthor(Role.USER), threadId, body("a".repeat(201), gameDesignId)), "title");
        assertThat(titleOf(threadId)).isEqualTo(TITLE);
    }

    @Test
    void updateThread_returns400_whenCategoriesInvalid() {
        assertFieldError(updateThread(asAuthor(Role.USER), threadId, body(NEW_TITLE)), "categoryIds");
        assertFieldError(updateThread(asAuthor(Role.USER), threadId,
                body(NEW_TITLE, showcaseId, gameDesignId, enginesId)), "categoryIds");
        assertFieldError(updateThread(asAuthor(Role.USER), threadId, body(NEW_TITLE, 999)), "categoryIds");

        assertThat(titleOf(threadId)).isEqualTo(TITLE);
        assertThat(categoryNamesOf(threadId)).containsExactly("Showcase");
    }

    @Test
    void updateThread_replacesOpeningPostContent_whenContentChanged() {
        assertThat(updateThread(asAuthor(Role.USER), threadId,
                body(NEW_TITLE, "  Seit dem Update ruckelt der Shader auf Android.  ", gameDesignId)))
                .hasStatus(HttpStatus.NO_CONTENT);

        MvcTestResult posts = mvc.get().uri(THREAD_URL + "/posts", threadId).exchange();
        assertThat(posts).bodyJson().extractingPath("$.content[0].content")
                .isEqualTo("Seit dem Update ruckelt der Shader auf Android.");
        assertThat(posts).bodyJson().extractingPath("$.content[0].editedAt").isNotNull();
    }

    @Test
    void updateThread_keepsOpeningPostUnedited_whenContentUnchanged() {
        assertThat(updateThread(asAuthor(Role.USER), threadId, body(NEW_TITLE, gameDesignId)))
                .hasStatus(HttpStatus.NO_CONTENT);

        MvcTestResult posts = mvc.get().uri(THREAD_URL + "/posts", threadId).exchange();
        assertThat(posts).bodyJson().extractingPath("$.content[0].editedAt").isNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void updateThread_returns400_whenContentInvalid(String content) {
        assertFieldError(updateThread(asAuthor(Role.USER), threadId, body(NEW_TITLE, content, gameDesignId)), "content");
        assertThat(titleOf(threadId)).isEqualTo(TITLE);
    }

    @Test
    void updateThread_returns400_whenContentTooLong() {
        assertFieldError(updateThread(asAuthor(Role.USER), threadId,
                body(NEW_TITLE, "a".repeat(20_001), gameDesignId)), "content");
    }

    @Test
    void updateThread_returns400_whenBodyNotJson() {
        MvcTestResult result = updateThread(asAuthor(Role.USER), threadId, "{\"title\": ");

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Anfrage");
    }

    // --- Thread löschen blendet ihn für alle aus

    @Test
    void deleteThread_hidesThreadAndPosts_whenAuthorWithoutReplies() {
        assertThat(deleteThread(asAuthor(Role.USER), threadId)).hasStatus(HttpStatus.NO_CONTENT);

        assertThat(mvc.get().uri(THREAD_URL, threadId).exchange()).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(mvc.get().uri(THREAD_URL + "/posts", threadId).exchange()).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(jdbcTemplate.queryForObject("SELECT deleted_by FROM threads WHERE id = ?", Integer.class, threadId))
                .isEqualTo(authorProfileId);
    }

    @Test
    void listThreads_omitsThread_whenThreadDeleted() {
        int other = createThread(otherProfileId, "Anderer Thread", enginesId);

        assertThat(deleteThread(asAuthor(Role.USER), threadId)).hasStatus(HttpStatus.NO_CONTENT);

        MvcTestResult list = mvc.get().uri("/api/threads").exchange();
        assertThat(list).hasStatusOk();
        assertThat(list).bodyJson().extractingPath("$.content[*].id").isEqualTo(List.of(other));
        assertThat(list).bodyJson().extractingPath("$.page.totalElements").isEqualTo(1);
    }

    @Test
    void me_countsNoThreadsAndPosts_whenOnlyThreadDeleted() {
        assertThat(deleteThread(asAuthor(Role.USER), threadId)).hasStatus(HttpStatus.NO_CONTENT);

        MvcTestResult me = mvc.get().uri("/api/auth/me").with(asAuthor(Role.USER)).exchange();
        assertThat(me).hasStatusOk();
        assertThat(me).bodyJson().extractingPath("$.threadCount").isEqualTo(0);
        assertThat(me).bodyJson().extractingPath("$.postCount").isEqualTo(0);
    }

    @Test
    void updateAndDeleteThread_return404_whenThreadAlreadyDeleted() {
        assertThat(deleteThread(asAuthor(Role.USER), threadId)).hasStatus(HttpStatus.NO_CONTENT);

        assertThreadNotFound(deleteThread(asAuthor(Role.USER), threadId));
        assertThreadNotFound(updateThread(asAuthor(Role.USER), threadId, body(NEW_TITLE, gameDesignId)));
    }

    // --- Unbekannte und ungültige Threads

    @Test
    void updateAndDeleteThread_return404_whenThreadUnknown() {
        assertThreadNotFound(updateThread(asAuthor(Role.USER), 999, body(NEW_TITLE, gameDesignId)));
        assertThreadNotFound(deleteThread(asAuthor(Role.USER), 999));
    }

    @Test
    void updateAndDeleteThread_return404_whenOtherUsersThreadDeleted() {
        jdbcTemplate.update("UPDATE threads SET deleted_at = now(), deleted_by = ? WHERE id = ?",
                authorProfileId, threadId);

        assertThreadNotFound(updateThread(asOther(Role.USER), threadId, body(NEW_TITLE, gameDesignId)));
        assertThreadNotFound(deleteThread(asOther(Role.USER), threadId));
    }

    @ParameterizedTest
    @ValueSource(strings = {"abc", "0", "-1"})
    void updateAndDeleteThread_return400_whenIdInvalid(String id) {
        MvcTestResult update = mvc.put().uri("/api/threads/" + id).with(asAuthor(Role.USER))
                .contentType(MediaType.APPLICATION_JSON).content(body(NEW_TITLE, gameDesignId)).exchange();
        MvcTestResult delete = mvc.delete().uri("/api/threads/" + id).with(asAuthor(Role.USER)).exchange();

        assertThat(update).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(update).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Thread-ID");
        assertThat(delete).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(delete).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Thread-ID");
    }

    // --- Antworten sperren Bearbeiten und Löschen des Threads

    @Test
    void updateAndDeleteThread_return409_whenOtherUserReplied() {
        addReply(threadId, otherProfileId);

        assertRepliesConflict(updateThread(asAuthor(Role.USER), threadId, body(NEW_TITLE, gameDesignId)));
        assertRepliesConflict(deleteThread(asAuthor(Role.USER), threadId));
        assertThat(titleOf(threadId)).isEqualTo(TITLE);
        assertThat(mvc.get().uri(THREAD_URL, threadId).exchange()).hasStatusOk();
    }

    @Test
    void updateThread_returns409_whenAuthorReplied() {
        addReply(threadId, authorProfileId);

        assertRepliesConflict(updateThread(asAuthor(Role.USER), threadId, body(NEW_TITLE, gameDesignId)));
    }

    @Test
    void updateThread_returns204_whenOnlyReplyDeleted() {
        int replyId = addReply(threadId, otherProfileId);
        jdbcTemplate.update("UPDATE posts SET deleted_at = now(), deleted_by = ? WHERE id = ?", otherProfileId, replyId);

        assertThat(updateThread(asAuthor(Role.USER), threadId, body(NEW_TITLE, gameDesignId)))
                .hasStatus(HttpStatus.NO_CONTENT);
    }

    @Test
    void updateThread_returns403_whenOtherUserAndThreadHasReplies() {
        addReply(threadId, otherProfileId);

        assertForbidden(updateThread(asOther(Role.USER), threadId, body(NEW_TITLE, gameDesignId)));
    }

    // --- Hilfsmethoden

    private void assertForbidden(MvcTestResult result) {
        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Keine Berechtigung");
    }

    private void assertThreadNotFound(MvcTestResult result) {
        assertThat(result).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Thread nicht gefunden");
    }

    private void assertRepliesConflict(MvcTestResult result) {
        assertThat(result).hasStatus(HttpStatus.CONFLICT);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Thread hat bereits Antworten");
    }

    private void assertFieldError(MvcTestResult result, String field) {
        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Eingabe");
        assertThat(result).bodyJson().extractingPath("$.errors." + field).asArray().isNotEmpty();
    }

    private MvcTestResult updateThread(RequestPostProcessor auth, int id, String body) {
        return mvc.put().uri(THREAD_URL, id).with(auth)
                .contentType(MediaType.APPLICATION_JSON).content(body).exchange();
    }

    private MvcTestResult deleteThread(RequestPostProcessor auth, int id) {
        return mvc.delete().uri(THREAD_URL, id).with(auth).exchange();
    }

    private RequestPostProcessor asAuthor(Role role) {
        return asAccount(authorAccountId, role);
    }

    private RequestPostProcessor asOther(Role role) {
        return asAccount(otherAccountId, role);
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

    private int createCategory(String name) {
        return jdbcTemplate.queryForObject("INSERT INTO categories (name) VALUES (?) RETURNING id", Integer.class, name);
    }

    /** Thread mit Eröffnungsbeitrag des angegebenen Profils in einer Kategorie. */
    private int createThread(int authorProfileId, String title, int categoryId) {
        int id = jdbcTemplate.queryForObject(
                "INSERT INTO threads (title, created_by) VALUES (?, ?) RETURNING id",
                Integer.class, title, authorProfileId);
        jdbcTemplate.update("INSERT INTO threads_categories (thread_id, category_id) VALUES (?, ?)", id, categoryId);
        jdbcTemplate.update("INSERT INTO posts (content, thread_id, created_by, created_at) VALUES (?, ?, ?, now() - interval '1 hour')",
                OPENING_CONTENT, id, authorProfileId);
        return id;
    }

    private int addReply(int id, int profileId) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO posts (content, thread_id, created_by) VALUES ('Antwort', ?, ?) RETURNING id",
                Integer.class, id, profileId);
    }

    private String titleOf(int id) {
        return jdbcTemplate.queryForObject("SELECT title FROM threads WHERE id = ?", String.class, id);
    }

    private Object createdAtOf(int id) {
        return jdbcTemplate.queryForObject("SELECT created_at FROM threads WHERE id = ?", Object.class, id);
    }

    private List<String> categoryNamesOf(int id) {
        return jdbcTemplate.queryForList("""
                SELECT c.name FROM categories c JOIN threads_categories tc ON tc.category_id = c.id
                WHERE tc.thread_id = ? ORDER BY c.name
                """, String.class, id);
    }

    /** Text des Eröffnungsbeitrags bleibt unverändert */
    private static String body(String title, int... categoryIds) {
        return body(title, OPENING_CONTENT, categoryIds);
    }

    private static String body(String title, String content, int... categoryIds) {
        String ids = String.join(", ", Arrays.stream(categoryIds).mapToObj(String::valueOf).toList());
        return "{\"title\": \"" + title + "\", \"content\": \"" + content + "\", \"categoryIds\": [" + ids + "]}";
    }
}
