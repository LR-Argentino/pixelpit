package org.pixelpit.backend.account;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.pixelpit.backend.TestcontainersConfiguration;
import org.pixelpit.backend.account.web.CreateAccountRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class DeleteAccountIT {
    private static final String PASSWORD = "Sicher_1234";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private AccountManagement accountManagement;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        truncate();
        register("blackbird");
        register("vera");
    }

    @AfterEach
    void truncate() {
        jdbcTemplate.update("""
                TRUNCATE attachments, files, threads_categories, posts, threads, profiles, accounts
                RESTART IDENTITY CASCADE
                """);
    }

    // --- Berechtigung

    @Test
    void deleteMe_returns204_whenUserWithCorrectPassword() {
        MvcTestResult result = deleteMe(login("blackbird"), PASSWORD);

        assertThat(result).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(accountExists("blackbird@mock.com")).isFalse();
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"MODERATOR", "ADMIN"})
    void deleteMe_returns204_whenModeratorOrAdmin(Role role) {
        jdbcTemplate.update("UPDATE accounts SET role = ? WHERE email = 'blackbird@mock.com'", role.name());

        MvcTestResult result = deleteMe(login("blackbird"), PASSWORD);

        assertThat(result).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(accountExists("blackbird@mock.com")).isFalse();
    }

    @Test
    void deleteMe_returns401_whenGuest() {
        MvcTestResult result = deleteMe(new MockHttpSession(), PASSWORD);

        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(accountCount()).isEqualTo(2);
    }

    @Test
    void deleteMe_keepsOtherAccounts_whenUserDeletesOwn() {
        deleteMe(login("blackbird"), PASSWORD);

        assertThat(loginResult("vera", PASSWORD)).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(usernameOf("vera@mock.com")).isEqualTo("vera");
    }

    // --- Passwort

    @Test
    void deleteMe_returns403AndKeepsAccount_whenPasswordWrong() {
        MvcTestResult result = deleteMe(login("blackbird"), "Falsch_1234");

        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Passwort ist falsch");
        assertThat(accountExists("blackbird@mock.com")).isTrue();
        assertThat(usernameOf("blackbird@mock.com")).isEqualTo("blackbird");
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"password\": \"\"}", "{\"password\": \"   \"}"})
    void deleteMe_returns400_whenPasswordMissingOrBlank(String body) {
        MvcTestResult result = mvc.delete().uri("/api/accounts/me")
                .session(login("blackbird"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .exchange();

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(accountExists("blackbird@mock.com")).isTrue();
    }

    // --- Login-Daten

    @ParameterizedTest
    @ValueSource(strings = {"blackbird@mock.com", "blackbird"})
    void login_returns401_whenAccountDeleted(String identifier) {
        deleteMe(login("blackbird"), PASSWORD);

        assertThat(loginResult(identifier, PASSWORD)).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void register_returns201_whenEmailOfDeletedAccount() {
        deleteMe(login("blackbird"), PASSWORD);

        assertThat(registerResult("neuer_name", "blackbird@mock.com")).hasStatus(HttpStatus.CREATED);
    }

    // --- Profil

    @Test
    void deleteMe_anonymizesUsername_whenAccountDeleted() {
        int profileId = profileIdOf("blackbird@mock.com");

        deleteMe(login("blackbird"), PASSWORD);

        Map<String, Object> profile = jdbcTemplate.queryForMap(
                "SELECT account_id, username, avatar_file_id FROM profiles WHERE id = ?", profileId);
        assertThat(profile.get("account_id")).isNull();
        assertThat(profile.get("username")).isEqualTo("deleted-" + profileId);
        assertThat(profile.get("avatar_file_id")).isNull();
    }

    @Test
    void register_returns201_whenUsernameOfDeletedAccount() {
        deleteMe(login("blackbird"), PASSWORD);

        assertThat(registerResult("blackbird", "neu@mock.com")).hasStatus(HttpStatus.CREATED);
    }

    @Test
    void deleteMe_keepsUsername_whenPasswordWrong() {
        deleteMe(login("blackbird"), "Falsch_1234");

        assertThat(usernameOf("blackbird@mock.com")).isEqualTo("blackbird");
    }

    // --- Inhalte

    @Test
    void threadDetail_showsDeletedUsername_whenAuthorDeleted() {
        int profileId = profileIdOf("blackbird@mock.com");
        int threadId = createThread(profileId);
        addReply(threadId, profileId, "Antwort von blackbird");

        deleteMe(login("blackbird"), PASSWORD);

        MvcTestResult thread = mvc.get().uri("/api/threads/" + threadId).exchange();
        assertThat(thread).hasStatusOk();
        assertThat(thread).bodyJson().extractingPath("$.title").isEqualTo("Godot 4 Shader kompiliert nicht");
        assertThat(thread).bodyJson().extractingPath("$.author").isEqualTo("deleted-" + profileId);

        MvcTestResult posts = mvc.get().uri("/api/threads/" + threadId + "/posts").exchange();
        assertThat(posts).hasStatusOk();
        assertThat(posts).bodyJson().extractingPath("$.content[1].content").isEqualTo("Antwort von blackbird");
        assertThat(posts).bodyJson().extractingPath("$.content[1].author").isEqualTo("deleted-" + profileId);
    }

    @Test
    void threadDetail_keepsOtherAuthors_whenAuthorDeleted() {
        int threadId = createThread(profileIdOf("blackbird@mock.com"));
        addReply(threadId, profileIdOf("vera@mock.com"), "Antwort von vera");

        deleteMe(login("blackbird"), PASSWORD);

        MvcTestResult posts = mvc.get().uri("/api/threads/" + threadId + "/posts").exchange();
        assertThat(posts).bodyJson().extractingPath("$.content[1].author").isEqualTo("vera");
    }

    @Test
    void threadDetail_keepsUsername_whenPasswordWrong() {
        int threadId = createThread(profileIdOf("blackbird@mock.com"));

        deleteMe(login("blackbird"), "Falsch_1234");

        MvcTestResult thread = mvc.get().uri("/api/threads/" + threadId).exchange();
        assertThat(thread).bodyJson().extractingPath("$.author").isEqualTo("blackbird");
    }

    // --- Session

    @Test
    void me_returns401_whenSessionAfterDeletion() {
        MockHttpSession session = login("blackbird");

        deleteMe(session, PASSWORD);

        assertThat(mvc.get().uri("/api/auth/me").session(session).exchange()).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void me_returns200_whenDeletionFailedWithWrongPassword() {
        MockHttpSession session = login("blackbird");

        deleteMe(session, "Falsch_1234");

        MvcTestResult me = mvc.get().uri("/api/auth/me").session(session).exchange();
        assertThat(me).hasStatusOk();
        assertThat(me).bodyJson().extractingPath("$.username").isEqualTo("blackbird");
    }

    /** Thread samt Eröffnungspost; der Eröffnungspost hat die kleinste Post-ID des Threads. */
    private int createThread(int authorProfileId) {
        int id = jdbcTemplate.queryForObject(
                "INSERT INTO threads (title, created_by) VALUES ('Godot 4 Shader kompiliert nicht', ?) RETURNING id",
                Integer.class, authorProfileId);
        addReply(id, authorProfileId, "Eröffnungspost");
        return id;
    }

    private void addReply(int threadId, int authorProfileId, String content) {
        jdbcTemplate.update("INSERT INTO posts (content, thread_id, created_by) VALUES (?, ?, ?)",
                content, threadId, authorProfileId);
    }

    private void register(String username) {
        accountManagement.create(new CreateAccountRequest(username, username + "@mock.com", PASSWORD, PASSWORD));
    }

    private MvcTestResult registerResult(String username, String email) {
        return mvc.post().uri("/api/accounts")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username": "%s", "email": "%s", "password": "%s", "confirmPassword": "%s"}
                        """.formatted(username, email, PASSWORD, PASSWORD))
                .exchange();
    }

    private MockHttpSession login(String identifier) {
        MvcTestResult result = loginResult(identifier, PASSWORD);
        assertThat(result).hasStatus(HttpStatus.NO_CONTENT);
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private MvcTestResult loginResult(String identifier, String password) {
        return mvc.post().uri("/api/auth/login")
                .session(new MockHttpSession())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"identifier": "%s", "password": "%s"}
                        """.formatted(identifier, password))
                .exchange();
    }

    private MvcTestResult deleteMe(MockHttpSession session, String password) {
        return mvc.delete().uri("/api/accounts/me")
                .session(session)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"password": "%s"}
                        """.formatted(password))
                .exchange();
    }

    private boolean accountExists(String email) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM accounts WHERE email = ?", Integer.class, email) > 0;
    }

    private int accountCount() {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM accounts", Integer.class);
    }

    private int profileIdOf(String email) {
        return jdbcTemplate.queryForObject("""
                SELECT p.id FROM profiles p JOIN accounts a ON a.id = p.account_id WHERE a.email = ?
                """, Integer.class, email);
    }

    private String usernameOf(String email) {
        return jdbcTemplate.queryForObject("""
                SELECT p.username FROM profiles p JOIN accounts a ON a.id = p.account_id WHERE a.email = ?
                """, String.class, email);
    }
}
