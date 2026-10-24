package org.pixelpit.backend.auth;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.pixelpit.backend.TestcontainersConfiguration;
import org.pixelpit.backend.account.AccountDetails;
import org.pixelpit.backend.account.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class MeIT {

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private int accountId;
    private int profileId;
    private int otherProfileId;

    @BeforeEach
    void setUp() {
        truncate();
        accountId = createAccountWithProfile("blackbird");
        profileId = profileIdOf(accountId);
        otherProfileId = profileIdOf(createAccountWithProfile("vera"));
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
    void me_returnsOwnProfile_whenUserLoggedIn() {
        MvcTestResult result = me(Role.USER);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.username").isEqualTo("blackbird");
        assertThat(result).bodyJson().extractingPath("$.email").isEqualTo("blackbird@mock.com");
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"MODERATOR", "ADMIN"})
    void me_returnsOwnProfile_whenModeratorOrAdmin(Role role) {
        MvcTestResult result = me(role);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.username").isEqualTo("blackbird");
        assertThat(result).bodyJson().extractingPath("$.role").isEqualTo(role.name());
    }

    @Test
    void me_returns401_whenGuest() {
        assertThat(mvc.get().uri("/api/auth/me").exchange()).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    // --- Anzahl Threads

    @Test
    void me_returnsThreadCount_whenUserCreatedThreads() {
        createThread(profileId);
        createThread(profileId);
        createThread(otherProfileId);

        assertThat(me(Role.USER)).bodyJson().extractingPath("$.threadCount").isEqualTo(2);
    }

    @Test
    void me_returnsZeroThreads_whenNewUser() {
        createThread(otherProfileId);

        MvcTestResult result = me(Role.USER);

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.threadCount").isEqualTo(0);
    }

    @Test
    void me_excludesThread_whenThreadDeleted() {
        createThread(profileId);
        softDelete("threads", createThread(profileId));

        assertThat(me(Role.USER)).bodyJson().extractingPath("$.threadCount").isEqualTo(1);
    }

    @Test
    void me_excludesThread_whenOpeningPostDeleted() {
        int threadId = createThread(profileId);
        softDelete("posts", openingPostOf(threadId));

        assertThat(me(Role.USER)).bodyJson().extractingPath("$.threadCount").isEqualTo(0);
    }

    // --- Anzahl Posts

    @Test
    void me_countsOpeningPostAndReplies_whenUserPosted() {
        createThread(profileId);
        int foreignThreadId = createThread(otherProfileId);
        addReply(foreignThreadId, profileId);
        addReply(foreignThreadId, profileId);

        assertThat(me(Role.USER)).bodyJson().extractingPath("$.postCount").isEqualTo(3);
    }

    @Test
    void me_excludesForeignPosts_whenOthersReplied() {
        int threadId = createThread(profileId);
        addReply(threadId, otherProfileId);

        assertThat(me(Role.USER)).bodyJson().extractingPath("$.postCount").isEqualTo(1);
    }

    @Test
    void me_excludesPost_whenPostDeleted() {
        int foreignThreadId = createThread(otherProfileId);
        addReply(foreignThreadId, profileId);
        softDelete("posts", addReply(foreignThreadId, profileId));

        assertThat(me(Role.USER)).bodyJson().extractingPath("$.postCount").isEqualTo(1);
    }

    @Test
    void me_excludesPost_whenThreadDeleted() {
        int foreignThreadId = createThread(otherProfileId);
        addReply(foreignThreadId, profileId);
        softDelete("threads", foreignThreadId);

        assertThat(me(Role.USER)).bodyJson().extractingPath("$.postCount").isEqualTo(0);
    }

    private MvcTestResult me(Role role) {
        AccountDetails principal = new AccountDetails(accountId, "blackbird@mock.com", "hash", role);
        return mvc.get().uri("/api/auth/me").with(user(principal)).exchange();
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

    /** Thread samt Eröffnungspost; der Eröffnungspost hat die kleinste Post-ID des Threads. */
    private int createThread(int authorProfileId) {
        int id = jdbcTemplate.queryForObject(
                "INSERT INTO threads (title, created_by) VALUES ('Godot 4 Shader kompiliert nicht', ?) RETURNING id",
                Integer.class, authorProfileId);
        addReply(id, authorProfileId);
        return id;
    }

    private int addReply(int threadId, int authorProfileId) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO posts (content, thread_id, created_by) VALUES ('Beitrag', ?, ?) RETURNING id",
                Integer.class, threadId, authorProfileId);
    }

    private int openingPostOf(int threadId) {
        return jdbcTemplate.queryForObject("SELECT min(id) FROM posts WHERE thread_id = ?", Integer.class, threadId);
    }

    /** Löschen gibt es noch nicht über die API, darum direkt per SQL. */
    private void softDelete(String table, int id) {
        jdbcTemplate.update("UPDATE " + table + " SET deleted_at = now(), deleted_by = ? WHERE id = ?", profileId, id);
    }
}
