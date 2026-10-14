package org.pixelpit.backend.profile.internal;


import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.account.AccountRegistered;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccountEventListener {
    private final ProfileManagement profileManagement;

    @EventListener
    public void on(AccountRegistered account) {
        profileManagement.createProfile(account.accountId(), account.username());
    }
}
