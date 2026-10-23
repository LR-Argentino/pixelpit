package org.pixelpit.backend.threads.web;

import org.pixelpit.backend.threads.PostView;

import java.time.Instant;
import java.util.List;

public record PostResponse(
        Integer id,
        String author,
        Instant createdAt,
        Instant editedAt,
        String content,
        boolean solution,
        List<AttachmentResponse> attachments
) {
    public static PostResponse from(PostView view) {
        return new PostResponse(view.id(), view.author(), view.createdAt(), view.editedAt(), view.content(),
                view.solution(), view.attachments().stream().map(AttachmentResponse::from).toList());
    }
}
