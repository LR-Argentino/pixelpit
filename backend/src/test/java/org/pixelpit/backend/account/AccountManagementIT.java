package org.pixelpit.backend.account;

import org.junit.jupiter.api.Test;
import org.pixelpit.backend.TestcontainersConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.modulith.test.ApplicationModuleTest;
import org.springframework.modulith.test.Scenario;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

@ApplicationModuleTest
@Import(TestcontainersConfiguration.class)
public class AccountManagementIT {

    @Autowired
    AccountManagement accountManagement;

    @TestConfiguration(proxyBeanMethods = false)
    static class PasswordEncoderConfiguration {

        @Bean
        PasswordEncoder passwordEncoder() {
            return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
        }
    }


    @Test
    public void register_publishesAccountRegistered_whenSuccessfulRegistration(Scenario scenario) {
        RegisterAccountRequest request = new RegisterAccountRequest("blackbird",
                "test@mock.com",
                "Sicher_1234",
                "Sicher_1234");

        scenario.stimulate(() -> accountManagement.register(request))
                .andWaitForEventOfType(AccountRegistered.class)
                .matching((accountRegistered -> accountRegistered.username().equals("blackbird")))
                .toArriveAndVerify((event) -> {
                    assertThat(event.username()).isEqualTo("blackbird");
                    assertThat(event.accountId()).isNotNull();
                });

    }
}
