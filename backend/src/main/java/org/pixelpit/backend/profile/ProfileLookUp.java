package org.pixelpit.backend.profile;

import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.profile.internal.Profile;
import org.pixelpit.backend.profile.internal.ProfileRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileLookUp {
    private final ProfileRepository profileRepository;

    public Optional<Integer> findAccountIdByUsername(String username) {
        return profileRepository.findByUsername(username).map(Profile::getAccountId);
    }

    public Optional<String> findUsernameByAccountId(Integer accountId) {
        return profileRepository.findByAccountId(accountId).map(Profile::getUsername);
    }
}