package org.pixelpit.backend.threads;

import java.time.Instant;
import java.util.List;

/** Sichtbarer Post; editedAt ist null, solange er nie bearbeitet wurde. */
public record PostView(
        Integer id,
        String author,
        Instant createdAt,
        Instant editedAt,
        String content,
        boolean solution,
        List<AttachmentView> attachments
) {
}
