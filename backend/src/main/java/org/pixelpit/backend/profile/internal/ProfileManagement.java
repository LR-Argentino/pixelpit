package org.pixelpit.backend.profile.internal;

import lombok.RequiredArgsConstructor;
import org.hibernate.exception.ConstraintViolationException;
import org.pixelpit.backend.profile.exceptions.UsernameAlreadyTakenException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileManagement {
    private final ProfileRepository profileRepository;

    @Transactional
    public void createProfile(Integer accountId, String username) {
        boolean isUsernameAlreadyTaken = profileRepository.existsByUsername(username);

        if (isUsernameAlreadyTaken) {
            throw new UsernameAlreadyTakenException(username);
        }

        try {
            Profile profile = new  Profile(accountId, username);
            profileRepository.save(profile);
        } catch (DataIntegrityViolationException e) {
            throw translate(e, username);
        }
    }

    @Transactional
    public void anonymize(Integer accountId) {
        Profile profile = profileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new IllegalStateException("Kein Profil für Account " + accountId));
        profile.anonymize();
    }

    private RuntimeException translate(DataIntegrityViolationException e, String username) {
        if (e.getCause() instanceof ConstraintViolationException violation) {
            String constraint = violation.getConstraintName();
            if ("profiles_username_key".equals(constraint)) {
                return new UsernameAlreadyTakenException(username);
            }
        }
        return e;
    }
}
