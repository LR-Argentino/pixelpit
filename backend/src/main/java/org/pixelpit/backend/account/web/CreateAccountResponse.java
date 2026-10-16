package org.pixelpit.backend.account.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record RegisterAccountResponse(
        @NotBlank @Size(min = 3, max = 20) String username,
        @Email @NotBlank String email,
        @PastOrPresent Instant createdAt,
        @PastOrPresent Instant updatedAt
) {
}
