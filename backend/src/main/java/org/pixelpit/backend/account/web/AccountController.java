package org.pixelpit.backend.account.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.account.AccountDetails;
import org.pixelpit.backend.account.AccountManagement;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;

@RestController()
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountManagement accountManagement;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void createAccount(@Valid @RequestBody CreateAccountRequest accountRequest) {
        accountManagement.create(accountRequest);
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMe(@Valid @RequestBody DeleteAccountRequest deleteRequest, Authentication authentication,
                         HttpServletRequest request, HttpServletResponse response) {
        AccountDetails me = (AccountDetails) authentication.getPrincipal();
        accountManagement.delete(me.getAccountId(), deleteRequest.password());

        // Erst nach erfolgreichem Löschen abmelden: bei falschem Passwort bleibt die Session bestehen
        new SecurityContextLogoutHandler().logout(request, response, authentication);
    }
}
