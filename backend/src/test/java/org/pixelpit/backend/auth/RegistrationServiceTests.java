package org.pixelpit.backend.auth;

import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.BDDAssertions.thenThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;


@ExtendWith(MockitoExtension.class)
public class RegistrationServiceTests {

    @Mock AccountRepository accountRepository;
    @Mock ProfileRepository profileRepository;
    @Mock PasswordEncoder passwordEncoder;
    @InjectMocks RegistrationService registrationService;

    @Captor ArgumentCaptor<Account> accountArgumentCaptor;
    @Captor ArgumentCaptor<Profile> profileArgumentCaptor;

    @Test
    void register_createAccount_whenEmailIsValid() {
        RegisterAccountRequest request = new RegisterAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_123"
                );

        registrationService.register(request);

        then(accountRepository).should().save(accountArgumentCaptor.capture());
        assertThat(accountArgumentCaptor.getValue().getEmail()).isEqualTo("test@mock.com");
    }

    @Test
    void register_throwEmailAlreadyTakenException_whenEmailIsAlreadyExists() {
        RegisterAccountRequest request = new RegisterAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_123"
        );
        given(accountRepository.existsByEmail(any(String.class))).willReturn(true);

        thenThrownBy(() -> registrationService.register(request)).isInstanceOf(EmailAlreadyTakenException.class);

        then(accountRepository).should(never()).save(any(Account.class));
    }

    @Test
    void register_throwEmailAlreadyTakenException_whenEmailConstraintViolated() {
        RegisterAccountRequest request = new RegisterAccountRequest("blackbird", "test@mock.com", "Sicher_123", "Sicher_123");
        given(accountRepository.save(any(Account.class))).willThrow(new DataIntegrityViolationException("duplicate",
                new ConstraintViolationException("duplicate", new SQLException(), "accounts_email_key")));

        thenThrownBy(() -> registrationService.register(request))
                .isInstanceOf(EmailAlreadyTakenException.class);
    }

    @Test
    void register_throwUsernameAlreadyTakenException_whenUsernameConstraintViolated() {
        RegisterAccountRequest request = new RegisterAccountRequest("blackbird", "test@mock.com", "Sicher_123", "Sicher_123");
        given(profileRepository.save(any(Profile.class))).willThrow(new DataIntegrityViolationException("duplicate",
                new ConstraintViolationException("duplicate", new SQLException(), "profiles_username_key")));

        thenThrownBy(() -> registrationService.register(request))
                .isInstanceOf(UsernameAlreadyTakenException.class);
    }

    @Test
    void register_createAccount_whenPasswordIsValid() {
        RegisterAccountRequest request = new RegisterAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_123"
        );
        given(passwordEncoder.encode(anyString())).willReturn("hashed");

        registrationService.register(request);

        then(accountRepository).should().save(accountArgumentCaptor.capture());
        assertThat(accountArgumentCaptor.getValue().getPasswordHash()).isEqualTo("hashed");
    }

    @Test
    void register_throwPasswordMismatchException_whenPasswordNotMatched() {
        RegisterAccountRequest request = new RegisterAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_12"
        );

        thenThrownBy(() -> registrationService.register(request)).isInstanceOf(PasswordMismatchException.class);

        then(accountRepository).should(never()).existsByEmail(anyString());
        then(profileRepository).should(never()).existsByUsername(anyString());
        then(accountRepository).should(never()).save(any(Account.class));
        then(profileRepository).should(never()).save(any(Profile.class));
        then(passwordEncoder).should(never()).encode(anyString());
    }

    @Test
    void register_createAccount_whenAccountIsValid() {
        RegisterAccountRequest request = new RegisterAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_123"
        );
        given(passwordEncoder.encode(anyString())).willReturn("hashed");
        given(accountRepository.existsByEmail(any(String.class))).willReturn(false);

        registrationService.register(request);

        then(accountRepository).should().save(accountArgumentCaptor.capture());
        assertThat(accountArgumentCaptor.getValue().getPasswordHash()).isEqualTo("hashed");
        assertThat(accountArgumentCaptor.getValue().getEmail()).isEqualTo("test@mock.com");
    }

    @Test
    void register_assignUserRole_whenAccountIsCreated() {
        RegisterAccountRequest request = new RegisterAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_123"
        );

        registrationService.register(request);

        then(accountRepository).should().save(accountArgumentCaptor.capture());
        assertThat(accountArgumentCaptor.getValue().getRole()).isEqualTo(Role.USER);
    }

    @Test
    void register_createProfile_whenAccountAndProfileIsValid() {
        RegisterAccountRequest request = new RegisterAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_123"
        );
        Account persistedAccount = new Account(request.email(), "hashed", Role.USER);
        ReflectionTestUtils.setField(persistedAccount, "id", 42);

        given(passwordEncoder.encode(anyString())).willReturn("hashed");
        given(accountRepository.existsByEmail(any(String.class))).willReturn(false);
        given(accountRepository.save(any(Account.class))).willReturn(persistedAccount);

        registrationService.register(request);

        then(profileRepository).should().save(profileArgumentCaptor.capture());
        Profile profile = profileArgumentCaptor.getValue();
        assertThat(profile.getUsername()).isEqualTo("blackbird");
        assertThat(profile.getAccount().getId()).isEqualTo(42);
    }

    @Test
    void register_throwUsernameAlreadyTakenException_whenUsernameIsAlreadyExists() {
        RegisterAccountRequest request = new RegisterAccountRequest(
                "blackbird",
                "test@mock.com",
                "Sicher_123",
                "Sicher_123"
        );
        given(profileRepository.existsByUsername(any(String.class))).willReturn(true);

        thenThrownBy(() -> registrationService.register(request)).isInstanceOf(UsernameAlreadyTakenException.class);
        then(accountRepository).should(never()).save(any(Account.class));
        then(profileRepository).should(never()).save(any(Profile.class));
    }
}
