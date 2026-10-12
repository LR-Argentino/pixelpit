package org.pixelpit.backend.auth;


import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
public class ProfileJpaRepositoryIT {

    @Autowired
    private ProfileRepository profileRepository;

    @Container
    private static final PostgreSQLContainer postgreSQLContainer = new PostgreSQLContainer("postgres:18.4")
            .withDatabaseName("test")
            .withUsername("test")
            .withPassword("test");


    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgreSQLContainer::getJdbcUrl);
        registry.add("spring.datasource.username", postgreSQLContainer::getUsername);
        registry.add("spring.datasource.password", postgreSQLContainer::getPassword);
    }

    @Test
    void save_createProfile_whenProfileIsValid() {
        Account blackbird = new Account(
                "test@text.com",
                "$2a$12$ELmElEuSBDbZfjVRLN4.i.9QIsSoRSNb31W03XY4KqbevJXAIxupi",
                Role.USER
        );
        Profile blackbirdProfile = new Profile(blackbird, "blackbird");

        Profile persistedAccount = profileRepository.save(blackbirdProfile);

        assertSame(persistedAccount.getAccount(), blackbird);

        assertNotNull(persistedAccount.getId());
        assertThat(persistedAccount.getUsername()).isEqualTo("blackbird");
    }
}
