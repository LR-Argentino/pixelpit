package org.pixelpit.backend.threads.web;

import org.pixelpit.backend.threads.AttachmentView;

public record AttachmentResponse(Integer id, String fileName, String mimeType, long fileSize) {
    public static AttachmentResponse from(AttachmentView view) {
        return new AttachmentResponse(view.id(), view.fileName(), view.mimeType(), view.fileSize());
    }
}
