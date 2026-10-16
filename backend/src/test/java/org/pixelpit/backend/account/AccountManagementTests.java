package org.pixelpit.backend.account;

import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pixelpit.backend.account.exceptions.EmailAlreadyTakenException;
import org.pixelpit.backend.account.exceptions.PasswordMismatchException;
import org.pixelpit.backend.account.internal.Account;
import org.pixelpit.backend.account.internal.AccountRepository;
import org.pixelpit.backend.account.internal.Role;
import org.pixelpit.backend.account.web.CreateAccountRequest;
import org.pixelpit.backend.profile.internal.Profile;
import org.pixelpit.backend.profile.internal.ProfileRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.BDDAssertions.thenThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;


@ExtendWith(MockitoExtension.class)
public class AccountManagementTests {

    @Mock AccountRepository accountRepository;
    @Mock ProfileRepository profileRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock
    ApplicationEventPublisher applicationEventPublisher;

    @InjectMocks
    AccountManagement accountManagement;

    @Captor ArgumentCaptor<Account> accountArgumentCaptor;

    @Test
    void register_createAccount_whenEmailIsValid() {
        CreateAccountRequest request = new CreateAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_123"
                );
       givenSaveAssignsId(13);

        accountManagement.register(request);

        then(accountRepository).should().save(accountArgumentCaptor.capture());
        then(applicationEventPublisher).should().publishEvent(any(AccountRegistered.class));
        assertThat(accountArgumentCaptor.getValue().getEmail()).isEqualTo("test@mock.com");
    }

    @Test
    void register_throwEmailAlreadyTakenException_whenEmailIsAlreadyExists() {
        CreateAccountRequest request = new CreateAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_123"
        );
        given(accountRepository.existsByEmail(any(String.class))).willReturn(true);

        thenThrownBy(() -> accountManagement.register(request)).isInstanceOf(EmailAlreadyTakenException.class);

        then(accountRepository).should(never()).save(any(Account.class));
        then(applicationEventPublisher).should(never()).publishEvent(any(AccountRegistered.class));
    }

    @Test
    void register_throwEmailAlreadyTakenException_whenEmailConstraintViolated() {
        CreateAccountRequest request = new CreateAccountRequest("blackbird", "test@mock.com", "Sicher_123", "Sicher_123");
        given(accountRepository.save(any(Account.class))).willThrow(new DataIntegrityViolationException("duplicate",
                new ConstraintViolationException("duplicate", new SQLException(), "accounts_email_key")));

        thenThrownBy(() -> accountManagement.register(request))
                .isInstanceOf(EmailAlreadyTakenException.class);
    }

    @Test
    void register_createAccount_whenPasswordIsValid() {
        CreateAccountRequest request = new CreateAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_123"
        );
        given(passwordEncoder.encode(anyString())).willReturn("hashed");
        givenSaveAssignsId(42);

        accountManagement.register(request);

        then(applicationEventPublisher).should().publishEvent(any(AccountRegistered.class));
        then(accountRepository).should().save(accountArgumentCaptor.capture());
        assertThat(accountArgumentCaptor.getValue().getPasswordHash()).isEqualTo("hashed");
    }

    @Test
    void register_throwPasswordMismatchException_whenPasswordNotMatched() {
        CreateAccountRequest request = new CreateAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_12"
        );

        thenThrownBy(() -> accountManagement.register(request)).isInstanceOf(PasswordMismatchException.class);

        then(applicationEventPublisher).should(never()).publishEvent(any(AccountRegistered.class));
        then(accountRepository).should(never()).existsByEmail(anyString());
        then(profileRepository).should(never()).existsByUsername(anyString());
        then(accountRepository).should(never()).save(any(Account.class));
        then(profileRepository).should(never()).save(any(Profile.class));
        then(passwordEncoder).should(never()).encode(anyString());
    }

    @Test
    void register_createAccount_whenAccountIsValid() {
        CreateAccountRequest request = new CreateAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_123"
        );
        given(passwordEncoder.encode(anyString())).willReturn("hashed");
        given(accountRepository.existsByEmail(any(String.class))).willReturn(false);
        givenSaveAssignsId(42);

        accountManagement.register(request);

        then(applicationEventPublisher).should().publishEvent(any(AccountRegistered.class));
        then(accountRepository).should().save(accountArgumentCaptor.capture());
        assertThat(accountArgumentCaptor.getValue().getPasswordHash()).isEqualTo("hashed");
        assertThat(accountArgumentCaptor.getValue().getEmail()).isEqualTo("test@mock.com");
    }

    @Test
    void register_assignUserRole_whenAccountIsCreated() {
        CreateAccountRequest request = new CreateAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_123"
        );

        givenSaveAssignsId(42);
        accountManagement.register(request);

        then(accountRepository).should().save(accountArgumentCaptor.capture());
        then(applicationEventPublisher).should().publishEvent(any(AccountRegistered.class));
        assertThat(accountArgumentCaptor.getValue().getRole()).isEqualTo(Role.USER);
    }

    private void givenSaveAssignsId(int id) {
        given(accountRepository.save(any(Account.class))).willAnswer(invocation -> {
            Account account = invocation.getArgument(0);
            ReflectionTestUtils.setField(account, "id", id); // simuliert die DB-generierte ID
            return account;
        });
    }
}
