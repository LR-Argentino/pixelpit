package org.pixelpit.backend.threads.exceptions;

/** Thread oder Post gehört einem anderen Profil – nur der Ersteller darf ihn ändern oder löschen. */
public class NotContentOwnerException extends RuntimeException {
    public NotContentOwnerException() {
        super("Nur der Ersteller darf diesen Inhalt ändern");
    }
}
