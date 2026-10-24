package org.pixelpit.backend.account;

/** Konto ohne Login-Geheimnisse, z. B. für die Benutzerverwaltung. */
public record AccountSummary(int id, String email, Role role) {

    public static AccountSummary from(Account account) {
        return new AccountSummary(account.getId(), account.getEmail(), account.getRole());
    }
}
