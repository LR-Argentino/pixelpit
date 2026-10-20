package org.pixelpit.backend.account.web;

import jakarta.validation.constraints.*;

public record CreateAccountRequest(
        @NotBlank @Size(min = 3, max = 20)
        @Pattern(regexp = "^[A-Za-z0-9_.-]*$", message = "darf nur Buchstaben, Ziffern sowie _ . - enthalten")
        String username,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 30) String password,
        @NotBlank @Size(min = 8, max = 30) String confirmPassword
) {
}
