package org.pixelpit.backend.auth;

import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.account.Account;
import org.pixelpit.backend.account.AccountDetails;
import org.pixelpit.backend.auth.internal.ReadAccountRepository;
import org.pixelpit.backend.profile.ProfileLookUp;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    private final ReadAccountRepository accountRepository;
    private final ProfileLookUp profileLookUp;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrEmail) {
        String input = usernameOrEmail.trim();
        String EMAIL_SEPARATOR = "@";

        Optional<Account> account = input.contains(EMAIL_SEPARATOR)
                ? accountRepository.findByEmail(input.toLowerCase(Locale.ROOT))
                : profileLookUp.findAccountIdByUsername(input).flatMap(accountRepository::findById);

        return account.map(AccountDetails::from)
                .orElseThrow(() -> new UsernameNotFoundException("ungültige Zugangsdaten"));
    }
}
