package org.pixelpit.backend.account;

/** Ein Account wird gelöscht; trägt bewusst nur die ID, keine personenbezogenen Daten. */
public record AccountDeleted(Integer accountId) {
}
