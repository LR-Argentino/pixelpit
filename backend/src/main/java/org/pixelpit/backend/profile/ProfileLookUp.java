package org.pixelpit.backend.profile;

import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.profile.internal.Profile;
import org.pixelpit.backend.profile.internal.ProfileRepository;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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

    public Optional<Integer> findProfileIdByAccountId(Integer accountId) {
        return profileRepository.findByAccountId(accountId).map(Profile::getId);
    }

    /** Benutzernamen zu mehreren Profil-IDs mit einer Abfrage; gelöschte Konten liefern "deleted-<id>". */
    public Map<Integer, String> findUsernamesByProfileIds(Collection<Integer> profileIds) {
        return profileRepository.findByIdIn(profileIds).stream()
                .collect(Collectors.toMap(Profile::getId, Profile::getUsername));
    }
}
