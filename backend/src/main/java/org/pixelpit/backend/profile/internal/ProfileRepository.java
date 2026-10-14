package org.pixelpit.backend.profile.internal;

import org.springframework.data.repository.Repository;

public interface ProfileRepository extends Repository<Profile, Integer> {
    Profile save(Profile profile);
    boolean existsByUsername(String username);
}