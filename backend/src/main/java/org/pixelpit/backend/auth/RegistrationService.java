package org.pixelpit.backend.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class RegistrationService {

    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(AccountRepository accountRepository, ProfileRepository profileRepository, PasswordEncoder pwEncoder) {
        this.accountRepository = accountRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = pwEncoder;
    }

    @Transactional
    public void register(RegisterAccountRequest accountRequest) throws EmailAlreadyTakenException, UsernameAlreadyTakenException, PasswordMismatchException {
        if (!accountRequest.password().equals(accountRequest.confirmPassword())) {
            throw new PasswordMismatchException();
        }
        String normalizedEmail = accountRequest.email().toLowerCase(Locale.ROOT);
        boolean isEmailAlreadyTaken = accountRepository.existsByEmail(normalizedEmail);
        boolean isUsernameAlreadyTake = profileRepository.existsByUsername(accountRequest.username());

        if (isEmailAlreadyTaken) {
            throw new EmailAlreadyTakenException(normalizedEmail);
        }

        if (isUsernameAlreadyTake) {
            throw new UsernameAlreadyTakenException(accountRequest.username());
        }
        String hashedPassword = passwordEncoder.encode(accountRequest.password());
        Account account = new Account(normalizedEmail, hashedPassword, Role.USER);
        Account persistedAccount = accountRepository.save(account);
        Profile profile = new Profile(persistedAccount, accountRequest.username());
        profileRepository.save(profile);
    }
}
