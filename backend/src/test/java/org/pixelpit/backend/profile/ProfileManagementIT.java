package org.pixelpit.backend.profile;

import org.junit.jupiter.api.*;
import org.pixelpit.backend.TestcontainersConfiguration;
import org.pixelpit.backend.account.AccountRegistered;
import org.pixelpit.backend.profile.internal.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.modulith.test.ApplicationModuleTest;
import org.springframework.modulith.test.Scenario;

import static org.assertj.core.api.Assertions.assertThat;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
public class ProfileManagementIT {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ProfileRepository profileRepository;

    private Integer accountId;

    @BeforeAll
    void setUp() {
        accountId = jdbcTemplate.queryForObject(
                "INSERT INTO accounts (email, password_hash) VALUES (?, ?) RETURNING id",
                Integer.class,
                "blackbird@mock.com", "irrelevant-hash");
    }

    @AfterAll
    void tearDown() {
        jdbcTemplate.update("TRUNCATE profiles CASCADE");
        jdbcTemplate.update("TRUNCATE accounts CASCADE");
    }


    @Test
    public void createProfile_listenOnAccountRegistered_whenEventWasFired(Scenario scenario) {
        AccountRegistered accountRegistered = new AccountRegistered(accountId, "blackbird");

        scenario.publish(accountRegistered)
                .andWaitForStateChange(() -> profileRepository.existsByUsername("blackbird"))
                .andVerify(exists -> assertThat(exists).isTrue());
    }

}
