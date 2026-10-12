package org.pixelpit.backend.auth;

public class UsernameAlreadyTakenException extends RuntimeException {
    public UsernameAlreadyTakenException(String username) {
        super("Benutzername '%s' ist bereits vergeben".formatted(username));
    }
}
