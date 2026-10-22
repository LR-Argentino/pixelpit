package org.pixelpit.backend.threads;

/** Metadaten eines Anhangs, ohne Adresse zum Herunterladen. */
public record AttachmentView(
        Integer id,
        String fileName,
        String mimeType,
        long fileSize
) {
}
