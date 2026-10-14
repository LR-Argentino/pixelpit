package org.pixelpit.backend.account;

import lombok.RequiredArgsConstructor;
import org.hibernate.exception.ConstraintViolationException;
import org.pixelpit.backend.account.exceptions.EmailAlreadyTakenException;
import org.pixelpit.backend.account.exceptions.PasswordMismatchException;
import org.pixelpit.backend.account.internal.Account;
import org.pixelpit.backend.account.internal.AccountRepository;
import org.pixelpit.backend.account.internal.Role;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
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
    public void register(RegisterAccountRequest request) throws EmailAlreadyTakenException, PasswordMismatchException {
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

    private RuntimeException translate(DataIntegrityViolationException e, RegisterAccountRequest request) {
        if (e.getCause() instanceof ConstraintViolationException violation) {
            String constraint = violation.getConstraintName();
            if ("accounts_email_key".equals(constraint)) {
                return new EmailAlreadyTakenException(request.email());
            }
        }
        return e;
    }
}
