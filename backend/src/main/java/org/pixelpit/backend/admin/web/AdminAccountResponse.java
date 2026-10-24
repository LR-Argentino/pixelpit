package org.pixelpit.backend.admin.web;

import org.pixelpit.backend.account.AccountSummary;
import org.pixelpit.backend.account.Role;

public record AdminAccountResponse(int accountId, String username, String email, Role role) {

    public static AdminAccountResponse of(AccountSummary account, String username) {
        return new AdminAccountResponse(account.id(), username, account.email(), account.role());
    }
}
