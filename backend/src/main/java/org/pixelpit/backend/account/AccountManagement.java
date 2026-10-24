package org.pixelpit.backend.account;

import lombok.RequiredArgsConstructor;
import org.hibernate.exception.ConstraintViolationException;
import org.pixelpit.backend.account.exceptions.AccountNotFoundException;
import org.pixelpit.backend.account.exceptions.EmailAlreadyTakenException;
import org.pixelpit.backend.account.exceptions.InvalidPasswordException;
import org.pixelpit.backend.account.exceptions.OwnRoleChangeException;
import org.pixelpit.backend.account.exceptions.PasswordMismatchException;
import org.pixelpit.backend.account.internal.AccountRepository;
import org.pixelpit.backend.account.web.CreateAccountRequest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountManagement {
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;


    @Transactional
    public void create(CreateAccountRequest request) throws EmailAlreadyTakenException, PasswordMismatchException {
        if (!request.password().equals(request.confirmPassword())) {
            throw new PasswordMismatchException();
        }
        String normalizedEmail = request.email().toLowerCase();
        boolean isEmailAlreadyTaken = accountRepository.existsByEmail(normalizedEmail);

        if (isEmailAlreadyTaken) {
            throw new EmailAlreadyTakenException(normalizedEmail);
        }

        try {
            String hashedPassword = passwordEncoder.encode(request.password());
            Account account = new Account(normalizedEmail, hashedPassword, Role.USER);
            Account persistedAccount = accountRepository.save(account);

            eventPublisher.publishEvent(new AccountRegistered(persistedAccount.getId(), request.username()));
        } catch (DataIntegrityViolationException e) {
            throw translate(e, request);
        }

    }

    /** Löscht den Account nach Passwortprüfung; das Profil wird per {@link AccountDeleted} in derselben Transaktion anonymisiert. */
    @Transactional
    public void delete(int accountId, String password) throws InvalidPasswordException {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalStateException("Kein Account " + accountId));

        if (!passwordEncoder.matches(password, account.getPasswordHash())) {
            throw new InvalidPasswordException();
        }

        eventPublisher.publishEvent(new AccountDeleted(accountId));
        accountRepository.delete(account);
    }

    @Transactional(readOnly = true)
    public Page<AccountSummary> listAccounts(Pageable pageable) {
        return accountRepository.findAll(pageable).map(AccountSummary::from);
    }

    /** Die Regel gegen das Ändern der eigenen Rolle sorgt dafür, dass immer mindestens ein Admin übrig bleibt. */
    @Transactional
    public AccountSummary changeRole(int actingAccountId, int targetAccountId, Role role)
            throws OwnRoleChangeException, AccountNotFoundException {
        if (actingAccountId == targetAccountId) {
            throw new OwnRoleChangeException();
        }
        Account account = accountRepository.findById(targetAccountId)
                .orElseThrow(() -> new AccountNotFoundException(targetAccountId));

        account.changeRole(role);
        return AccountSummary.from(account);
    }

    private RuntimeException translate(DataIntegrityViolationException e, CreateAccountRequest request) {
        if (e.getCause() instanceof ConstraintViolationException violation) {
            String constraint = violation.getConstraintName();
            if ("accounts_email_key".equals(constraint)) {
                return new EmailAlreadyTakenException(request.email());
            }
        }
        return e;
    }
}
