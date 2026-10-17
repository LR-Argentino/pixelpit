package org.pixelpit.backend.account.exceptions;

public class EmailAlreadyTakenException extends RuntimeException {
    public EmailAlreadyTakenException(String email) {
        super("Email '%s' ist bereits vergeben".formatted(email));
    }
}
