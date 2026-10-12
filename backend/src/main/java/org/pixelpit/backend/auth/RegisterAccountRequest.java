package org.pixelpit.backend.auth;

import jakarta.validation.constraints.*;

public record RegisterAccountRequest(
        @NotBlank @Size(min = 3, max = 20) String username,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 30) String password,
        @NotBlank @Size(min = 8, max = 30) String confirmPassword
) {
}
