package org.pixelpit.backend.account.web;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(@NotBlank String password) {
}
