package org.pixelpit.backend.configs;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Argon2id-Parameter. Defaults und Untergrenzen entsprechen der OWASP-Mindestempfehlung
 * (m = 19 MiB, t = 2, p = 1).
 */
@Validated
@ConfigurationProperties(prefix = "app.security.argon2")
record PasswordEncoderProperties(
        @DefaultValue("16") @Min(16) int saltLength,     // Bytes
        @DefaultValue("32") @Min(32) int hashLength,     // Bytes
        @DefaultValue("1") @Min(1) int parallelism,
        @DefaultValue("19456") @Min(19456) int memory,   // KiB
        @DefaultValue("2") @Min(2) int iterations)
{ }
