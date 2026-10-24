package org.pixelpit.backend.admin.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.account.AccountDetails;
import org.pixelpit.backend.account.AccountManagement;
import org.pixelpit.backend.account.AccountSummary;
import org.pixelpit.backend.profile.ProfileLookUp;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PagedModel;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Nur für ADMIN, abgesichert über die Regel für /api/admin/** in der SecurityConfig. */
@RestController
@RequestMapping("/api/admin/accounts")
@RequiredArgsConstructor
public class AdminAccountController {
    private final AccountManagement accountManagement;
    private final ProfileLookUp profileLookUp;

    @GetMapping
    public PagedModel<AdminAccountResponse> listAccounts(
            @RequestParam(defaultValue = "0") @PositiveOrZero int page,
            @RequestParam(defaultValue = "20") @Positive int size) {
        Page<AccountSummary> accounts = accountManagement.listAccounts(PageRequest.of(page, size, Sort.by("id")));

        // Benutzernamen der ganzen Seite mit einer Abfrage laden statt pro Zeile (N+1)
        Map<Integer, String> usernames = profileLookUp.findUsernamesByAccountIds(
                accounts.map(AccountSummary::id).getContent());
        return new PagedModel<>(accounts.map(account -> AdminAccountResponse.of(account, usernames.get(account.id()))));
    }

    @PatchMapping("/{id}/role")
    public AdminAccountResponse changeRole(@PathVariable int id,
                                           @Valid @RequestBody ChangeRoleRequest request,
                                           @AuthenticationPrincipal AccountDetails me) {
        AccountSummary account = accountManagement.changeRole(me.getAccountId(), id, request.role());
        return AdminAccountResponse.of(account, profileLookUp.findUsernameByAccountId(id).orElse(null));
    }
}
