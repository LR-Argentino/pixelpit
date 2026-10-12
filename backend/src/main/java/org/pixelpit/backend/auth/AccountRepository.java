package org.pixelpit.backend.auth;

import org.springframework.data.repository.Repository;

public interface AccountRepository extends Repository<Account, Integer> {
    Account save(Account account);
    boolean existsByEmail(String email);
}
