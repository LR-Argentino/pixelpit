package org.pixelpit.backend.account;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.pixelpit.backend.account.exceptions.EmailAlreadyTakenException;
import org.pixelpit.backend.account.exceptions.PasswordMismatchException;
import org.pixelpit.backend.account.web.AccountController;
import org.pixelpit.backend.account.web.CreateAccountRequest;
import org.pixelpit.backend.profile.exceptions.UsernameAlreadyTakenException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@WebMvcTest(AccountController.class)
public class AccountControllerIT {
    private static final String ACCOUNT_URL = "/api/accounts";

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    AccountManagement accountManagement;

    @Test
    public void createAccount_returnsCreated_whenRequestIsValid() {
        MvcTestResult result = postAccount(createAccountJson("blackbird", "tester@mock.com", "Sicher_1234", "Sicher_1234"));

        assertThat(result).hasStatus(HttpStatus.CREATED);
        assertThat(result).body().isEmpty();

        verify(accountManagement).register(
                new CreateAccountRequest("blackbird", "tester@mock.com", "Sicher_1234", "Sicher_1234"));
    }

    @Test
    public void createAccount_throwConflict_whenEmailAlreadyExists() {
        doThrow(new EmailAlreadyTakenException("tester@mock.com"))
                .when(accountManagement).register(any(CreateAccountRequest.class));

        assertThat(postAccount(createAccountJson("blackbird", "tester@mock.com", "Sicher_1234", "Sicher_1234")))
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .extractingPath("$.title")
                .isEqualTo("Email existiert bereits!");
    }

    @Test
    public void createAccount_throwConflict_whenUsernameAlreadyExists() {
        doThrow(new UsernameAlreadyTakenException("blackbird"))
                .when(accountManagement).register(any(CreateAccountRequest.class));

        MvcTestResult result = postAccount(createAccountJson("blackbird", "tester@mock.com", "Sicher_1234", "Sicher_1234"));

        assertThat(result).hasStatus(HttpStatus.CONFLICT);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Benutzername ist schon vergeben!");
        assertThat(result).bodyJson().extractingPath("$.detail").isEqualTo("Benutzername 'blackbird' ist bereits vergeben");
    }

    @Test
    public void createAccount_throwBadRequest_whenPasswordsDoNotMatch() {
        doThrow(new PasswordMismatchException())
                .when(accountManagement).register(any(CreateAccountRequest.class));

        MvcTestResult result = postAccount(createAccountJson("blackbird", "tester@mock.com", "Sicher_1234", "Anders_1234"));

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.title").isEqualTo("Passwörter stimmen nicht überein!");
        assertThat(result).bodyJson().extractingPath("$.detail").isEqualTo("Die Passwörter stimmen nicht überein.");
    }

    @Test
    public void createAccount_throwBadRequest_whenRequestIsInvalid() {
        MvcTestResult result = postAccount(createAccountJson("ab", "keine-email", "Sicher_1234", "Sicher_1234"));

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.detail").isEqualTo("Validierung fehlgeschlagen");
        assertThat(result).bodyJson().extractingPath("$.errors.username").asArray().isNotEmpty();
        assertThat(result).bodyJson().extractingPath("$.errors.email").asArray().isNotEmpty();
        assertThat(result).bodyJson().doesNotHavePath("$.errors.password");

        verify(accountManagement, never()).register(any());
    }

    @ParameterizedTest(name = "{0} = \"{1}\"")
    @MethodSource("invalidFields")
    public void createAccount_throwBadRequest_whenSingleFieldIsInvalid(String field, String value) {
        String username = field.equals("username") ? value : "blackbird";
        String email = field.equals("email") ? value : "tester@mock.com";
        String password = field.equals("password") ? value : "Sicher_1234";
        String confirmPassword = field.equals("confirmPassword") ? value : "Sicher_1234";

        MvcTestResult result = postAccount(createAccountJson(username, email, password, confirmPassword));

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.detail").isEqualTo("Validierung fehlgeschlagen");
        assertThat(result).bodyJson().extractingPath("$.errors").asMap().containsOnlyKeys(field);
        assertThat(result).bodyJson().extractingPath("$.errors." + field).asArray().isNotEmpty();

        verify(accountManagement, never()).register(any());
    }

    static Stream<Arguments> invalidFields() {
        return Stream.of(
                Arguments.of("username", "ab"),
                Arguments.of("username", "a".repeat(21)),
                Arguments.of("username", "   "),
                Arguments.of("email", "keine-email"),
                Arguments.of("email", ""),
                Arguments.of("password", "kurz"),
                Arguments.of("password", "a".repeat(31)),
                Arguments.of("confirmPassword", "kurz"),
                Arguments.of("confirmPassword", "a".repeat(31))
        );
    }

    @Test
    public void createAccount_collectsAllMessagesPerField_whenFieldViolatesMultipleConstraints() {
        MvcTestResult result = postAccount(createAccountJson("", "tester@mock.com", "Sicher_1234", "Sicher_1234"));

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.errors.username").asArray().hasSize(2);
    }

    @Test
    public void createAccount_returnsErrorsForAllFields_whenEmptyObjectIsSent() {
        MvcTestResult result = postAccount("{}");

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.errors").asMap()
                .containsOnlyKeys("username", "email", "password", "confirmPassword");

        verify(accountManagement, never()).register(any());
    }

    private MvcTestResult postAccount(String body) {
        return mvc.post()
                .uri(ACCOUNT_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .exchange();
    }

    private String createAccountJson(String username, String email, String password, String confirmPassword) {
        return """
            {
              "username": "%s",
              "email": "%s",
              "password": "%s",
              "confirmPassword": "%s"
            }
            """.formatted(username, email, password, confirmPassword);
    }
}
