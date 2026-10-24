package org.pixelpit.backend.admin;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.pixelpit.backend.TestcontainersConfiguration;
import org.pixelpit.backend.account.AccountManagement;
import org.pixelpit.backend.account.Role;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AdminAccountsIT {
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
        register("admin");
        register("vera");
        register("sam");
        setRole("admin", Role.ADMIN);
    }

    @AfterEach
    void truncate() {
        jdbcTemplate.update("""
                TRUNCATE attachments, files, threads_categories, posts, threads, profiles, accounts
                RESTART IDENTITY CASCADE
                """);
    }

    // --- CORS

    @Test
    void changeRole_allowsPatchPreflight_whenRequestComesFromFrontendOrigin() {
        MvcTestResult result = mvc.options().uri("/api/admin/accounts/2/role")
                .header("Origin", "http://localhost:4200")
                .header("Access-Control-Request-Method", "PATCH")
                .exchange();

        assertThat(result).hasStatusOk();
        assertThat(result.getResponse().getHeader("Access-Control-Allow-Methods")).contains("PATCH");
    }

    // --- Mitgliederliste

    @Test
    void listAccounts_returns200WithAllAccounts_whenAdmin() {
        MvcTestResult result = list(login("admin"), "");

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[*].username").isEqualTo(List.of("admin", "vera", "sam"));
        assertThat(result).bodyJson().extractingPath("$.content[1].email").isEqualTo("vera@mock.com");
        assertThat(result).bodyJson().extractingPath("$.content[1].role").isEqualTo("USER");
        assertThat(result).bodyJson().extractingPath("$.content[0].role").isEqualTo("ADMIN");
        assertThat(result).bodyJson().extractingPath("$.page.totalElements").isEqualTo(3);
    }

    @Test
    void listAccounts_returnsRequestedPage_whenPaged() {
        register("pia");
        register("gustav");

        MvcTestResult result = list(login("admin"), "?page=1&size=2");

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.content[*].username").isEqualTo(List.of("sam", "pia"));
        assertThat(result).bodyJson().extractingPath("$.page.number").isEqualTo(1);
        assertThat(result).bodyJson().extractingPath("$.page.size").isEqualTo(2);
        assertThat(result).bodyJson().extractingPath("$.page.totalElements").isEqualTo(5);
    }

    @Test
    void listAccounts_omitsDeletedAccounts_whenAccountDeleted() {
        mvc.delete().uri("/api/accounts/me")
                .session(login("vera"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\": \"%s\"}".formatted(PASSWORD))
                .exchange();

        MvcTestResult result = list(login("admin"), "");

        assertThat(result).bodyJson().extractingPath("$.content[*].username").isEqualTo(List.of("admin", "sam"));
    }

    @Test
    void listAccounts_returns401_whenGuest() {
        assertThat(list(new MockHttpSession(), "")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"USER", "MODERATOR"})
    void listAccounts_returns403_whenNotAdmin(Role role) {
        setRole("vera", role);

        assertThat(list(login("vera"), "")).hasStatus(HttpStatus.FORBIDDEN);
    }

    // --- Rolle ändern

    @Test
    void changeRole_returns200AndPersists_whenAdminAppointsModerator() {
        MockHttpSession admin = login("admin");

        MvcTestResult result = changeRole(admin, accountIdOf("vera"), "MODERATOR");

        assertThat(result).hasStatusOk();
        assertThat(result).bodyJson().extractingPath("$.username").isEqualTo("vera");
        assertThat(result).bodyJson().extractingPath("$.email").isEqualTo("vera@mock.com");
        assertThat(result).bodyJson().extractingPath("$.role").isEqualTo("MODERATOR");
        assertThat(list(admin, "")).bodyJson().extractingPath("$.content[1].role").isEqualTo("MODERATOR");
    }

    @Test
    void changeRole_returns200_whenAdminDemotesOtherAdmin() {
        setRole("vera", Role.ADMIN);

        MvcTestResult result = changeRole(login("admin"), accountIdOf("vera"), "USER");

        assertThat(result).hasStatusOk();
        assertThat(roleOf("vera")).isEqualTo("USER");
    }

    @Test
    void changeRole_returns200_whenRoleUnchanged() {
        setRole("vera", Role.MODERATOR);

        MvcTestResult result = changeRole(login("admin"), accountIdOf("vera"), "MODERATOR");

        assertThat(result).hasStatusOk();
        assertThat(roleOf("vera")).isEqualTo("MODERATOR");
    }

    @Test
    void changeRole_appliesOnNextLogin_whenTargetLogsInAgain() {
        changeRole(login("admin"), accountIdOf("vera"), "ADMIN");

        MvcTestResult me = mvc.get().uri("/api/auth/me").session(login("vera")).exchange();

        assertThat(me).bodyJson().extractingPath("$.role").isEqualTo("ADMIN");
    }

    @Test
    void changeRole_returns404_whenAccountUnknown() {
        MvcTestResult result = changeRole(login("admin"), 999, "MODERATOR");

        assertThat(result).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Konto nicht gefunden");
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"role\": null}", "{\"role\": \"SUPERUSER\"}"})
    void changeRole_returns400AndKeepsRole_whenRoleMissingOrInvalid(String body) {
        MvcTestResult result = mvc.patch().uri("/api/admin/accounts/" + accountIdOf("vera") + "/role")
                .session(login("admin"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .exchange();

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(roleOf("vera")).isEqualTo("USER");
    }

    @Test
    void changeRole_returns401_whenGuest() {
        MvcTestResult result = changeRole(new MockHttpSession(), accountIdOf("vera"), "ADMIN");

        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(roleOf("vera")).isEqualTo("USER");
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"USER", "MODERATOR"})
    void changeRole_returns403AndKeepsRole_whenNotAdmin(Role role) {
        setRole("vera", role);

        MvcTestResult result = changeRole(login("vera"), accountIdOf("sam"), "ADMIN");

        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(roleOf("sam")).isEqualTo("USER");
    }

    // --- Eigene Rolle

    @Test
    void changeRole_returns409AndKeepsRole_whenAdminChangesOwnRole() {
        MvcTestResult result = changeRole(login("admin"), accountIdOf("admin"), "USER");

        assertThat(result).hasStatus(HttpStatus.CONFLICT);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Die eigene Rolle kann nicht geändert werden");
        assertThat(roleOf("admin")).isEqualTo("ADMIN");
    }

    private void register(String username) {
        accountManagement.create(new CreateAccountRequest(username, username + "@mock.com", PASSWORD, PASSWORD));
    }

    private void setRole(String username, Role role) {
        jdbcTemplate.update("UPDATE accounts SET role = ? WHERE email = ?", role.name(), username + "@mock.com");
    }

    private MockHttpSession login(String username) {
        MvcTestResult result = mvc.post().uri("/api/auth/login")
                .session(new MockHttpSession())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"identifier": "%s", "password": "%s"}
                        """.formatted(username, PASSWORD))
                .exchange();
        assertThat(result).hasStatus(HttpStatus.NO_CONTENT);
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private MvcTestResult list(MockHttpSession session, String query) {
        return mvc.get().uri("/api/admin/accounts" + query).session(session).exchange();
    }

    private MvcTestResult changeRole(MockHttpSession session, int accountId, String role) {
        return mvc.patch().uri("/api/admin/accounts/" + accountId + "/role")
                .session(session)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\": \"%s\"}".formatted(role))
                .exchange();
    }

    private int accountIdOf(String username) {
        return jdbcTemplate.queryForObject("SELECT id FROM accounts WHERE email = ?", Integer.class, username + "@mock.com");
    }

    private String roleOf(String username) {
        return jdbcTemplate.queryForObject("SELECT role FROM accounts WHERE email = ?", String.class, username + "@mock.com");
    }
}
