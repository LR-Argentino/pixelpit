package org.pixelpit.backend.auth;

public class PasswordMismatchException extends RuntimeException {
    public PasswordMismatchException() {
        super("Die Passwörter stimmen nicht überein.");
    }
}
