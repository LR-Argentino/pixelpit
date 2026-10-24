package org.pixelpit.backend.account.exceptions;

public class AccountNotFoundException extends RuntimeException {
    public AccountNotFoundException(int accountId) {
        super("Konto %d existiert nicht".formatted(accountId));
    }
}
