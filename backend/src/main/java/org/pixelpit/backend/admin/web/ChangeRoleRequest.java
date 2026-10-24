package org.pixelpit.backend.admin.web;

import jakarta.validation.constraints.NotNull;
import org.pixelpit.backend.account.Role;

public record ChangeRoleRequest(@NotNull(message = "Rolle fehlt") Role role) {
}
