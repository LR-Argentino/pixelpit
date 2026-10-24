package org.pixelpit.backend.account.internal;

import org.pixelpit.backend.account.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface AccountRepository extends Repository<Account, Integer> {
    Account save(Account account);
    boolean existsByEmail(String email);
    Optional<Account> findById(Integer id);
    Page<Account> findAll(Pageable pageable);
    void delete(Account account);
}
