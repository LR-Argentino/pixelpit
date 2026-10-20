package org.pixelpit.backend.auth.web;

import org.pixelpit.backend.account.Role;

public record MeResponse(Integer accountId, String email, String username, Role role) {
}
