package org.pixelpit.backend.auth.internal;

import org.pixelpit.backend.account.Account;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface ReadAccountRepository extends Repository<Account, Integer> {
    Optional<Account> findByEmail(String email);
    Optional<Account> findById(Integer id);
}
