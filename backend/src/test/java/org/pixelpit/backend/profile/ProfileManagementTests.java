package org.pixelpit.backend.profile;


import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pixelpit.backend.account.AccountRegistered;
import org.pixelpit.backend.profile.exceptions.UsernameAlreadyTakenException;
import org.pixelpit.backend.profile.internal.Profile;
import org.pixelpit.backend.profile.internal.ProfileManagement;
import org.pixelpit.backend.profile.internal.ProfileRepository;
import org.springframework.dao.DataIntegrityViolationException;

import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.BDDAssertions.thenThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
public class ProfileManagementTests {

    @Mock ProfileRepository profileRepository;
    @InjectMocks
    ProfileManagement profileManagement;

    @Captor ArgumentCaptor<Profile> profileArgumentCaptor;

    @Test
    void createProfile_saveProfile_whenUsernameIsAvailable() {
        AccountRegistered event = new AccountRegistered(42, "blackbird");
        given(profileRepository.existsByUsername("blackbird")).willReturn(false);

        profileManagement.createProfile(event.accountId(), event.username());

        then(profileRepository).should().save(profileArgumentCaptor.capture());
        Profile profile = profileArgumentCaptor.getValue();
        assertThat(profile.getAccountId()).isEqualTo(42);
        assertThat(profile.getUsername()).isEqualTo("blackbird");
    }

    @Test
    void createProfile_throwUsernameAlreadyTakenException_whenUsernameAlreadyExists() {
        AccountRegistered event = new AccountRegistered(42, "blackbird");
        given(profileRepository.existsByUsername("blackbird")).willReturn(true);

        thenThrownBy(() -> profileManagement.createProfile(event.accountId(), event.username()))
                .isInstanceOf(UsernameAlreadyTakenException.class)
                .hasMessageContaining("blackbird");

        then(profileRepository).should(never()).save(any(Profile.class));
    }

    @Test
    void createProfile_throwUsernameAlreadyTakenException_whenUsernameConstraintViolated() {
        AccountRegistered event = new AccountRegistered(42, "blackbird");
        given(profileRepository.save(any(Profile.class))).willThrow(new DataIntegrityViolationException("duplicate",
                new ConstraintViolationException("duplicate", new SQLException(), "profiles_username_key")));

        thenThrownBy(() -> profileManagement.createProfile(event.accountId(), event.username()))
                .isInstanceOf(UsernameAlreadyTakenException.class)
                .hasMessageContaining("blackbird");
    }

    @Test
    void createProfile_rethrowDataIntegrityViolation_whenOtherConstraintViolated() {
        AccountRegistered event = new AccountRegistered(42, "blackbird");
        DataIntegrityViolationException exception = new DataIntegrityViolationException("duplicate",
                new ConstraintViolationException("duplicate", new SQLException(), "profiles_account_id_key"));
        given(profileRepository.save(any(Profile.class))).willThrow(exception);

        thenThrownBy(() -> profileManagement.createProfile(event.accountId(), event.username()))
                .isSameAs(exception);
    }

    @Test
    void createProfile_rethrowDataIntegrityViolation_whenCauseIsNoConstraintViolation() {
        AccountRegistered event = new AccountRegistered(42, "blackbird");
        DataIntegrityViolationException exception = new DataIntegrityViolationException("broken");
        given(profileRepository.save(any(Profile.class))).willThrow(exception);

        thenThrownBy(() -> profileManagement.createProfile(event.accountId(), event.username()))
                .isSameAs(exception);
    }
}
