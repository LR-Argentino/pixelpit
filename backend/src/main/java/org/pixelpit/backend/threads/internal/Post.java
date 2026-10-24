package org.pixelpit.backend.threads.internal;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "content", nullable = false, columnDefinition = "text")
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "thread_id", nullable = false, updatable = false)
    private ForumThread thread;

    @Column(name = "created_by", nullable = false, updatable = false)
    private Integer createdBy;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deleted_by")
    private Integer deletedBy;

    /** Der Eröffnungspost ist der erste Post eines Threads und trägt dessen Frage. */
    public static Post opening(ForumThread thread, String content, Integer createdBy) {
        Post post = new Post();
        post.thread = thread;
        post.content = content;
        post.createdBy = createdBy;
        return post;
    }

    /** Eine Antwort ist jeder weitere Post eines bestehenden Threads. */
    public static Post reply(ForumThread thread, String content, Integer createdBy) {
        Post post = new Post();
        post.thread = thread;
        post.content = content;
        post.createdBy = createdBy;
        return post;
    }

    /** Ersetzt den Text; updatedAt macht den Post für alle als bearbeitet erkennbar. */
    public void edit(String content) {
        this.content = content;
        this.updatedAt = Instant.now();
    }

    /** Soft Delete; updatedAt bleibt, denn Löschen ist keine Bearbeitung. */
    public void delete(int profileId) {
        this.deletedAt = Instant.now();
        this.deletedBy = profileId;
    }
}
