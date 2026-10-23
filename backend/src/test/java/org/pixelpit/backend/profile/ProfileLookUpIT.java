package org.pixelpit.backend.profile;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.pixelpit.backend.TestcontainersConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.modulith.test.ApplicationModuleTest;

import static org.assertj.core.api.Assertions.assertThat;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
class ProfileLookUpIT {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ProfileLookUp profileLookUp;

    @BeforeEach
    @AfterEach
    void truncate() {
        jdbcTemplate.update("TRUNCATE profiles, accounts RESTART IDENTITY CASCADE");
    }

    @Test
    void findProfileIdByAccountId_returnsProfileId_whenProfileExists() {
        int accountId = createAccount("blackbird");
        int profileId = jdbcTemplate.queryForObject(
                "INSERT INTO profiles (account_id, username) VALUES (?, 'blackbird') RETURNING id",
                Integer.class, accountId);

        assertThat(profileLookUp.findProfileIdByAccountId(accountId)).contains(profileId);
    }

    @Test
    void findProfileIdByAccountId_returnsEmpty_whenNoProfileExists() {
        int accountId = createAccount("blackbird");

        assertThat(profileLookUp.findProfileIdByAccountId(accountId)).isEmpty();
    }

    private int createAccount(String username) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO accounts (email, password_hash) VALUES (?, 'hash') RETURNING id",
                Integer.class, username + "@mock.com");
    }
}
