package org.pixelpit.backend.profile.internal;

import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface ProfileRepository extends Repository<Profile, Integer> {
    Profile save(Profile profile);
    boolean existsByUsername(String username);
    Optional<Profile> findByUsername(String username);
    Optional<Profile> findByAccountId(Integer accountId);
}