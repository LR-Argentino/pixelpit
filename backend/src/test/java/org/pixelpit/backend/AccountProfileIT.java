package org.pixelpit.backend;


import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.pixelpit.backend.account.AccountManagement;
import org.pixelpit.backend.account.RegisterAccountRequest;
import org.pixelpit.backend.account.exceptions.EmailAlreadyTakenException;
import org.pixelpit.backend.account.exceptions.PasswordMismatchException;
import org.pixelpit.backend.profile.exceptions.UsernameAlreadyTakenException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
public class AccountProfileIT {
    private static final String PASSWORD = "Sicher_1234";

    @Autowired
    private AccountManagement accountManagement;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void tearDown() {
        jdbcTemplate.update("TRUNCATE profiles, accounts RESTART IDENTITY CASCADE");
    }

    @Test
    void createAccountAndProfile_accountProfileCreated_whenValid() {
        accountManagement.register(request("blackbird_1996", "Test@Mock.com"));

        Map<String, Object> account = jdbcTemplate.queryForMap("SELECT id, email, password_hash, role FROM accounts");
        assertThat(account.get("email")).isEqualTo("test@mock.com");
        assertThat(account.get("role")).isEqualTo("USER");
        assertThat(account.get("password_hash")).isNotEqualTo(PASSWORD);

        Map<String, Object> profile = jdbcTemplate.queryForMap("SELECT account_id, username FROM profiles");
        assertThat(profile.get("username")).isEqualTo("blackbird_1996");
        assertThat(profile.get("account_id")).isEqualTo(account.get("id"));
    }

    @Test
    void register_rollsBackAccount_whenUsernameTaken() {
        accountManagement.register(request("blackbird", "a@mock.com"));

        assertThatThrownBy(() -> accountManagement.register(request("blackbird", "b@mock.com")))
                .isInstanceOf(UsernameAlreadyTakenException.class);

        assertThat(count("SELECT count(*) FROM accounts WHERE email = 'b@mock.com'")).isZero();
        assertThat(count("SELECT count(*) FROM accounts")).isEqualTo(1);
        assertThat(count("SELECT count(*) FROM profiles")).isEqualTo(1);
    }

    @Test
    void register_throwsEmailAlreadyTaken_whenEmailExistsCaseInsensitive() {
        accountManagement.register(request("user1", "test@mock.com"));

        assertThatThrownBy(() -> accountManagement.register(request("user2", "TEST@mock.com")))
                .isInstanceOf(EmailAlreadyTakenException.class);

        assertThat(count("SELECT count(*) FROM profiles WHERE username = 'user2'")).isZero();
        assertThat(count("SELECT count(*) FROM profiles")).isEqualTo(1);
    }

    @Test
    void register_createsNothing_whenPasswordsMismatch() {
        RegisterAccountRequest request = new RegisterAccountRequest("blackbird", "test@mock.com",
                PASSWORD, "Anders_1234");

        assertThatThrownBy(() -> accountManagement.register(request))
                .isInstanceOf(PasswordMismatchException.class);

        assertThat(count("SELECT count(*) FROM accounts")).isZero();
        assertThat(count("SELECT count(*) FROM profiles")).isZero();
    }

    private RegisterAccountRequest request(String username, String email) {
        return new RegisterAccountRequest(username, email, PASSWORD, PASSWORD);
    }

    private long count(String sql) {
        return jdbcTemplate.queryForObject(sql, Long.class);
    }
}
