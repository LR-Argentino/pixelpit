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

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class CreateThreadIT {
    private static final String THREADS_URL = "/api/threads";
    private static final String TITLE = "Godot 4 Shader kompiliert nicht";
    private static final String CONTENT = "Seit dem Update auf 4.3 bricht der Shader-Compiler ab.";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private int accountId;
    private int engines;

    @BeforeEach
    void setUp() {
        truncate();
        accountId = createAccountWithProfile("blackbird");
        engines = createCategory("Engines");
    }

    @AfterEach
    void truncate() {
        jdbcTemplate.update("""
                TRUNCATE attachments, files, threads_categories, posts, threads, categories, profiles, accounts
                RESTART IDENTITY CASCADE
                """);
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void createThread_returnsCreated_whenLoggedInWithAnyRole(Role role) {
        MvcTestResult result = createThread(asUser(role), validBody(TITLE, CONTENT, engines));

        assertThat(result).hasStatus(HttpStatus.CREATED);
        assertThat(countThreads()).isEqualTo(1);
    }

    @Test
    void createThread_returnsUnauthorized_whenGuest() {
        MvcTestResult result = createThread(csrf(), validBody(TITLE, CONTENT, engines));

        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(countThreads()).isZero();
    }

    @Test
    void createThread_returnsForbidden_whenCsrfTokenMissing() {
        MvcTestResult result = mvc.post().uri(THREADS_URL).with(user(accountDetails(Role.USER)))
                .contentType(MediaType.APPLICATION_JSON).content(validBody(TITLE, CONTENT, engines)).exchange();

        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(countThreads()).isZero();
    }

    @Test
    void createThread_returnsLocationAndId_whenValid() {
        MvcTestResult result = createThread(asUser(Role.USER), validBody(TITLE, CONTENT, engines));

        assertThat(result).hasStatus(HttpStatus.CREATED);
        int id = createdId(result);
        assertThat(result).bodyJson().extractingPath("$.id").isEqualTo(id);
        assertThat(result).headers().hasValue("Location", "/api/threads/" + id);
    }

    @Test
    void createThread_returnsNoLocation_whenTitleIsBlank() {
        MvcTestResult result = createThread(asUser(Role.USER), validBody("", CONTENT, engines));

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).headers().doesNotContainHeader("Location");
    }

    @Test
    void createThread_isReadableInDetailView_whenCreated() {
        int id = createdId(createThread(asUser(Role.USER), validBody(TITLE, CONTENT, engines)));

        MvcTestResult thread = mvc.get().uri(THREADS_URL + "/{id}", id).exchange();
        assertThat(thread).hasStatusOk();
        assertThat(thread).bodyJson().extractingPath("$.title").isEqualTo(TITLE);
        assertThat(thread).bodyJson().extractingPath("$.author").isEqualTo("blackbird");
        assertThat(thread).bodyJson().extractingPath("$.categories[*].name").isEqualTo(List.of("Engines"));

        MvcTestResult posts = mvc.get().uri(THREADS_URL + "/{id}/posts", id).exchange();
        assertThat(posts).hasStatusOk();
        assertThat(posts).bodyJson().extractingPath("$.content.length()").isEqualTo(1);
        assertThat(posts).bodyJson().extractingPath("$.content[0].content").isEqualTo(CONTENT);
        assertThat(posts).bodyJson().extractingPath("$.content[0].author").isEqualTo("blackbird");
    }

    @Test
    void createThread_appearsInThreadList_whenCreated() {
        int id = createdId(createThread(asUser(Role.USER), validBody(TITLE, CONTENT, engines)));

        MvcTestResult result = mvc.get().uri(THREADS_URL).exchange();

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[0].id").isEqualTo(id);
        assertThat(result).bodyJson().extractingPath("$.content[0].excerpt").isEqualTo(CONTENT);
    }

    @Test
    void createThread_returnsBadRequestWithAllFieldErrors_whenSeveralFieldsInvalid() {
        MvcTestResult result = createThread(asUser(Role.USER), """
                {"title": "abc", "content": "", "categoryIds": []}
                """);

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Eingabe");
        assertThat(result).bodyJson().extractingPath("$.errors.title").asArray().isNotEmpty();
        assertThat(result).bodyJson().extractingPath("$.errors.content").asArray().isNotEmpty();
        assertThat(result).bodyJson().extractingPath("$.errors.categoryIds").asArray().isNotEmpty();
    }

    @Test
    void createThread_returnsBadRequest_whenBodyIsNotJson() {
        MvcTestResult result = createThread(asUser(Role.USER), "{\"title\": ");

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Anfrage");
    }

    @ParameterizedTest
    @ValueSource(ints = {5, 200})
    void createThread_returnsCreated_whenTitleHasBoundaryLength(int length) {
        MvcTestResult result = createThread(asUser(Role.USER), validBody("a".repeat(length), CONTENT, engines));

        assertThat(result).hasStatus(HttpStatus.CREATED);
    }

    @Test
    void createThread_storesStrippedTitle_whenTitleHasSurroundingSpaces() {
        int id = createdId(createThread(asUser(Role.USER), validBody("  Hilfe bei Netcode  ", CONTENT, engines)));

        assertThat(jdbcTemplate.queryForObject("SELECT title FROM threads WHERE id = ?", String.class, id))
                .isEqualTo("Hilfe bei Netcode");
    }

    @ParameterizedTest
    @ValueSource(strings = {"abcd", "  abc  "})
    void createThread_returnsBadRequest_whenTitleTooShort(String title) {
        assertFieldError(createThread(asUser(Role.USER), validBody(title, CONTENT, engines)), "title");
    }

    @Test
    void createThread_returnsBadRequest_whenTitleTooLong() {
        assertFieldError(createThread(asUser(Role.USER), validBody("a".repeat(201), CONTENT, engines)), "title");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{\"content\": \"Text\", \"categoryIds\": [1]}",
            "{\"title\": \"\", \"content\": \"Text\", \"categoryIds\": [1]}",
            "{\"title\": \"   \", \"content\": \"Text\", \"categoryIds\": [1]}"})
    void createThread_returnsBadRequest_whenTitleMissingOrBlank(String body) {
        assertFieldError(createThread(asUser(Role.USER), body), "title");
    }

    @Test
    void createThread_returnsCreated_whenContentHasMaxLength() {
        MvcTestResult result = createThread(asUser(Role.USER), validBody(TITLE, "a".repeat(20_000), engines));

        assertThat(result).hasStatus(HttpStatus.CREATED);
    }

    @Test
    void createThread_returnsBadRequest_whenContentTooLong() {
        assertFieldError(createThread(asUser(Role.USER), validBody(TITLE, "a".repeat(20_001), engines)), "content");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{\"title\": \"Netcode-Frage\", \"categoryIds\": [1]}",
            "{\"title\": \"Netcode-Frage\", \"content\": \"\", \"categoryIds\": [1]}",
            "{\"title\": \"Netcode-Frage\", \"content\": \"   \", \"categoryIds\": [1]}"})
    void createThread_returnsBadRequest_whenContentMissingOrBlank(String body) {
        assertFieldError(createThread(asUser(Role.USER), body), "content");
    }

    @Test
    void createThread_returnsBadRequest_whenTitleHasFourEmojis() {
        // 4 Code Points, aber 8 UTF-16-Einheiten: zu kurz, auch wenn @Size 8 Zeichen zählen würde
        assertFieldError(createThread(asUser(Role.USER), validBody("🎮🎮🎮🎮", CONTENT, engines)), "title");
        assertThat(countThreads()).isZero();
    }

    @Test
    void createThread_returnsCreated_whenTitleHasFiveEmojis() {
        MvcTestResult result = createThread(asUser(Role.USER), validBody("🎮🎮🎮🎮🎮", CONTENT, engines));

        assertThat(result).hasStatus(HttpStatus.CREATED);
    }

    @Test
    void createThread_assignsBothCategories_whenTwoGiven() {
        int programming = createCategory("Programmierung");

        int id = createdId(createThread(asUser(Role.USER), validBody(TITLE, CONTENT, engines, programming)));

        assertThat(categoryNames(id)).isEqualTo(List.of("Engines", "Programmierung"));
    }

    @Test
    void createThread_assignsCategoryOnce_whenSameCategoryGivenTwice() {
        int id = createdId(createThread(asUser(Role.USER), validBody(TITLE, CONTENT, engines, engines)));

        assertThat(categoryNames(id)).isEqualTo(List.of("Engines"));
    }

    @Test
    void createThread_returnsCreated_whenThreeIdsContainDuplicate() {
        int showcase = createCategory("Showcase");

        int id = createdId(createThread(asUser(Role.USER), validBody(TITLE, CONTENT, engines, engines, showcase)));

        assertThat(categoryNames(id)).isEqualTo(List.of("Engines", "Showcase"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{\"title\": \"Netcode-Frage\", \"content\": \"Text\"}",
            "{\"title\": \"Netcode-Frage\", \"content\": \"Text\", \"categoryIds\": []}"})
    void createThread_returnsBadRequest_whenCategoriesMissingOrEmpty(String body) {
        assertFieldError(createThread(asUser(Role.USER), body), "categoryIds");
    }

    @Test
    void createThread_returnsBadRequest_whenThreeCategoriesGiven() {
        int programming = createCategory("Programmierung");
        int showcase = createCategory("Showcase");

        assertFieldError(createThread(asUser(Role.USER), validBody(TITLE, CONTENT, engines, programming, showcase)),
                "categoryIds");
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1", "null"})
    void createThread_returnsBadRequest_whenCategoryIdInvalid(String categoryId) {
        MvcTestResult result = createThread(asUser(Role.USER), """
                {"title": "Netcode-Frage", "content": "Text", "categoryIds": [%s]}
                """.formatted(categoryId));

        assertFieldError(result, "categoryIds");
    }

    @Test
    void createThread_returnsBadRequest_whenCategoryDoesNotExist() {
        MvcTestResult result = createThread(asUser(Role.USER), validBody(TITLE, CONTENT, engines, 999));

        assertFieldError(result, "categoryIds");
        assertThat(result).bodyJson().extractingPath("$.errors.categoryIds[0]").asString().contains("999");
        assertThat(countThreads()).isZero();
        assertThat(countPosts()).isZero();
    }

    @Test
    void createThread_returnsCreated_whenCategoryExists() {
        MvcTestResult result = createThread(asUser(Role.USER), validBody(TITLE, CONTENT, engines));

        assertThat(result).hasStatus(HttpStatus.CREATED);
    }

    private void assertFieldError(MvcTestResult result, String field) {
        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Eingabe");
        assertThat(result).bodyJson().extractingPath("$.errors." + field).asArray().isNotEmpty();
    }

    private List<String> categoryNames(int threadId) {
        return jdbcTemplate.queryForList("""
                SELECT c.name FROM categories c JOIN threads_categories tc ON tc.category_id = c.id
                WHERE tc.thread_id = ? ORDER BY c.name
                """, String.class, threadId);
    }

    private MvcTestResult createThread(RequestPostProcessor auth, String body) {
        return mvc.post().uri(THREADS_URL).with(auth)
                .contentType(MediaType.APPLICATION_JSON).content(body).exchange();
    }

    private int createdId(MvcTestResult result) {
        assertThat(result).hasStatus(HttpStatus.CREATED);
        return jdbcTemplate.queryForObject("SELECT max(id) FROM threads", Integer.class);
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

    private int createCategory(String name) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO categories (name) VALUES (?) RETURNING id", Integer.class, name);
    }

    private static String validBody(String title, String content, Integer... categoryIds) {
        String ids = Arrays.stream(categoryIds).map(String::valueOf).collect(Collectors.joining(", "));
        return """
                {"title": %s, "content": %s, "categoryIds": [%s]}
                """.formatted(quote(title), quote(content), ids);
    }

    private static String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private int countThreads() {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM threads", Integer.class);
    }

    private int countPosts() {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM posts", Integer.class);
    }
}
