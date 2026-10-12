package org.pixelpit.backend.auth;

import lombok.RequiredArgsConstructor;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void register(RegisterAccountRequest request) throws EmailAlreadyTakenException, UsernameAlreadyTakenException, PasswordMismatchException {
        if (!request.password().equals(request.confirmPassword())) {
            throw new PasswordMismatchException();
        }
        String normalizedEmail = request.email().toLowerCase();
        boolean isEmailAlreadyTaken = accountRepository.existsByEmail(normalizedEmail);
        boolean isUsernameAlreadyTaken = profileRepository.existsByUsername(request.username());

        if (isEmailAlreadyTaken) {
            throw new EmailAlreadyTakenException(normalizedEmail);
        }

        if (isUsernameAlreadyTaken) {
            throw new UsernameAlreadyTakenException(request.username());
        }

        try {
            String hashedPassword = passwordEncoder.encode(request.password());
            Account account = new Account(normalizedEmail, hashedPassword, Role.USER);
            Account persistedAccount = accountRepository.save(account);
            Profile profile = new Profile(persistedAccount, request.username());
            profileRepository.save(profile);
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
            if ("profiles_username_key".equals(constraint)) {
                return new UsernameAlreadyTakenException(request.username());
            }
        }
        return e;
    }
}
