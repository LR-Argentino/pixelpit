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

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
public class AccountJpaRepositoryIT {

    @Autowired
    private AccountRepository accountRepository;

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
    void save_createAccount_whenUserIsNotRegistered() {
        Account blackbird = new Account(
                "test@text.com",
                "$2a$12$ELmElEuSBDbZfjVRLN4.i.9QIsSoRSNb31W03XY4KqbevJXAIxupi",
                Role.USER
        );

        Instant before = Instant.now().truncatedTo(ChronoUnit.MICROS);
        Account persistedAccount = accountRepository.save(blackbird);
        Instant after = Instant.now();

        assertSame(persistedAccount, blackbird);
        assertNotNull(persistedAccount.getId());
        assertNotNull(persistedAccount.getCreatedAt());
        assertEquals(Role.USER, persistedAccount.getRole());

        assertFalse(persistedAccount.getCreatedAt().isBefore(before));
        assertFalse(persistedAccount.getCreatedAt().isAfter(after));
    }

    @Test
    void save_emailIsNormalized_whenSavingAccount() {
        Account blackbird = new Account(
                "Anna.Test@text.com",
                "$2a$12$ELmElEuSBDbZfjVRLN4.i.9QIsSoRSNb31W03XY4KqbevJXAIxupi",
                Role.USER
        );

        Account persistedAccount = accountRepository.save(blackbird);

        assertThat(persistedAccount.getEmail()).isEqualTo("anna.test@text.com");
    }
}
