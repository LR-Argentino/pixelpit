package org.pixelpit.backend.account.web;

import jakarta.validation.constraints.*;

public record CreateAccountRequest(
        @NotBlank @Size(min = 3, max = 20) String username,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 30) String password,
        @NotBlank @Size(min = 8, max = 30) String confirmPassword
) {
}
