package org.pixelpit.backend.account.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.account.AccountManagement;
import org.springframework.http.HttpStatus;
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
}
