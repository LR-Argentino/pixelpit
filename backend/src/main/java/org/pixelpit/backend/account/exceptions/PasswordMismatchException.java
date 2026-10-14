package org.pixelpit.backend.account.exceptions;

public class PasswordMismatchException extends RuntimeException {
    public PasswordMismatchException() {
        super("Die Passwörter stimmen nicht überein.");
    }
}
