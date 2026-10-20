package org.pixelpit.backend.account.internal;

import org.pixelpit.backend.account.Account;
import org.springframework.data.repository.Repository;

public interface AccountRepository extends Repository<Account, Integer> {
    Account save(Account account);
    boolean existsByEmail(String email);
}
