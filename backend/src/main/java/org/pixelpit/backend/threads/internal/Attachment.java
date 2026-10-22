package org.pixelpit.backend.threads.internal;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Anhang eines Posts; die Datei-Metadaten liegen in files und werden nur per Projektion gelesen. */
@Entity
@Table(name = "attachments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "post_id", nullable = false, updatable = false)
    private Integer postId;

    @Column(name = "file_id", nullable = false, unique = true, updatable = false)
    private Integer fileId;
}
