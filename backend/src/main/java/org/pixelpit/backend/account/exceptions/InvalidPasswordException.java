package org.pixelpit.backend.account.exceptions;

public class InvalidPasswordException extends RuntimeException {
    public InvalidPasswordException() {
        super("Das eingegebene Passwort stimmt nicht.");
    }
}
