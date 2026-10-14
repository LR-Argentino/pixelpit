package org.pixelpit.backend.profile.exceptions;

public class UsernameAlreadyTakenException extends RuntimeException {
    public UsernameAlreadyTakenException(String username) {
        super("Benutzername '%s' ist bereits vergeben".formatted(username));
    }
}
