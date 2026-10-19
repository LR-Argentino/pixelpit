package org.pixelpit.backend.auth;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.pixelpit.backend.TestcontainersConfiguration;
import org.pixelpit.backend.account.AccountManagement;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AuthFlowIT {
    private static final String PASSWORD = "Sicher_1234";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private AccountManagement accountManagement;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        accountManagement.create(new CreateAccountRequest("blackbird", "test@mock.com", PASSWORD, PASSWORD));
    }

    @AfterEach
    void tearDown() {
        jdbcTemplate.update("TRUNCATE profiles, accounts RESTART IDENTITY CASCADE");
    }

    @Test
    void login_createsSession_whenEmailAndPasswordAreValid() {
        MvcTestResult result = login("Test@Mock.com", PASSWORD, new MockHttpSession());

        assertThat(result).hasStatus(HttpStatus.NO_CONTENT);

        MvcTestResult me = me(sessionOf(result));
        assertThat(me).hasStatusOk();
        assertThat(me).bodyJson().extractingPath("$.email").isEqualTo("test@mock.com");
        assertThat(me).bodyJson().extractingPath("$.username").isEqualTo("blackbird");
        assertThat(me).bodyJson().extractingPath("$.role").isEqualTo("USER");
        assertThat(me).bodyJson().doesNotHavePath("$.password");
    }

    @Test
    void login_createsSession_whenUsernameAndPasswordAreValid() {
        MvcTestResult result = login("blackbird", PASSWORD, new MockHttpSession());

        assertThat(result).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(me(sessionOf(result))).hasStatusOk();
    }

    @Test
    void login_returnsUnauthorized_whenPasswordIsWrong() {
        MvcTestResult result = login("blackbird", "Falsch_1234", new MockHttpSession());

        assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Zugangsdaten");
    }

    @Test
    void login_returnsSameError_whenUserIsUnknown() {
        MvcTestResult unknownUsername = login("niemand", PASSWORD, new MockHttpSession());
        MvcTestResult unknownEmail = login("niemand@mock.com", PASSWORD, new MockHttpSession());

        assertThat(unknownUsername).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(unknownUsername).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Zugangsdaten");
        assertThat(unknownEmail).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(unknownEmail).bodyJson().extractingPath("$.title").isEqualTo("Ungültige Zugangsdaten");
    }

    @Test
    void login_returnsBadRequest_whenFieldsAreBlank() {
        MvcTestResult result = mvc.post().uri("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}")
                .exchange();

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
    }

    @Test
    void login_returnsForbidden_whenCsrfTokenIsMissing() {
        MvcTestResult result = mvc.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson("blackbird", PASSWORD))
                .exchange();

        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
    }

    @Test
    void login_changesSessionId_toPreventSessionFixation() {
        MockHttpSession session = new MockHttpSession();
        String idBeforeLogin = session.getId();

        MvcTestResult result = login("blackbird", PASSWORD, session);

        assertThat(sessionOf(result).getId()).isNotEqualTo(idBeforeLogin);
    }

    @Test
    void me_returnsUnauthorized_whenNotLoggedIn() {
        assertThat(me(new MockHttpSession())).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void logout_invalidatesSession() {
        MockHttpSession session = sessionOf(login("blackbird", PASSWORD, new MockHttpSession()));

        MvcTestResult logout = mvc.post().uri("/api/auth/logout").session(session).with(csrf()).exchange();

        assertThat(logout).hasStatusOk();
        assertThat(me(session)).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    private MvcTestResult login(String identifier, String password, MockHttpSession session) {
        return mvc.post().uri("/api/auth/login")
                .session(session)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(identifier, password))
                .exchange();
    }

    private MvcTestResult me(MockHttpSession session) {
        return mvc.get().uri("/api/auth/me").session(session).exchange();
    }

    private MockHttpSession sessionOf(MvcTestResult result) {
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private String loginJson(String identifier, String password) {
        return """
            {
              "identifier": "%s",
              "password": "%s"
            }
            """.formatted(identifier, password);
    }
}
