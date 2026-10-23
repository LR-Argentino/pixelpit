package org.pixelpit.backend.threads.internal;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AttachmentRepository extends Repository<Attachment, Integer> {

    /** Metadaten der Anhänge aller übergebenen Posts mit einer Abfrage (kein N+1). */
    @Query(value = """
            select a.post_id as postId, a.id as id, f.file_name as fileName,
                   f.mime_type as mimeType, f.file_size as fileSize
            from attachments a
            join files f on f.id = a.file_id
            where a.post_id in (:postIds)
            order by a.id
            """, nativeQuery = true)
    List<AttachmentRow> findViewsByPostIdIn(@Param("postIds") Collection<Integer> postIds);

    interface AttachmentRow {
        Integer getPostId();
        Integer getId();
        String getFileName();
        String getMimeType();
        long getFileSize();
    }
}
