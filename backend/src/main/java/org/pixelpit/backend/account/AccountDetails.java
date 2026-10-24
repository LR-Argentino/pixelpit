package org.pixelpit.backend.account;

import lombok.Getter;
import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serial;
import java.util.Collection;
import java.util.List;

@Getter
public final class AccountDetails implements UserDetails, CredentialsContainer {
    @Serial
    private static final long serialVersionUID = 1L;

    private final Integer accountId;
    private final String email;
    private final Role role;
    private String password;

    public AccountDetails(Integer accountId, String email, String password, Role role) {
        this.accountId = accountId;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public static AccountDetails from(Account account) {
        return new AccountDetails(account.getId(), account.getEmail(),
                account.getPasswordHash(), account.getRole());
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String role = "ROLE_" + this.role.name();
        return List.of(new SimpleGrantedAuthority(role));
    }

    @Override
    public void eraseCredentials() {
        this.password = null;
    }
}
