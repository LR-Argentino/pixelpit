package org.pixelpit.backend.account.exceptions;

public class OwnRoleChangeException extends RuntimeException {
    public OwnRoleChangeException() {
        super("Administratoren können ihre eigene Rolle nicht ändern.");
    }
}
