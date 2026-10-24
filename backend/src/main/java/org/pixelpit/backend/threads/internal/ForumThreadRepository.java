package org.pixelpit.backend.threads.internal;

import org.pixelpit.backend.threads.ThreadDetails;
import org.pixelpit.backend.threads.ThreadSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ForumThreadRepository extends PagingAndSortingRepository<ForumThread, Integer>, CrudRepository<ForumThread, Integer> {

    /** Proxy ohne SELECT, z. B. als Thread eines neuen Posts; umgesetzt von SimpleJpaRepository. */
    ForumThread getReferenceById(Integer id);

    /**
     * Sperrt die Thread-Zeile (SELECT ... FOR UPDATE) bis zum Ende der Transaktion. Alle Schreibpfade eines Threads
     * (Antworten, Bearbeiten, Löschen) sperren zuerst hier, damit sie nacheinander laufen. Bewusst ohne
     * {@link #VISIBLE}: Postgres erlaubt FOR UPDATE nicht zusammen mit Aggregaten wie min().
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from ForumThread t where t.id = :id")
    Optional<ForumThread> findByIdForUpdate(@Param("id") int id);

    /**
     * Einzige Stelle für die Regel „Thread ist sichtbar“, gilt für Liste und Detailansicht (Alias {@code t}).
     * Ein Thread ist gelöscht, wenn er selbst gelöscht ist oder sein Eröffnungspost (kleinste Post-ID).
     */
    String VISIBLE = """
             t.deletedAt is null
             and exists (select 1 from Post op
                         where op.thread = t and op.deletedAt is null
                           and op.id = (select min(p2.id) from Post p2 where p2.thread = t))
            """;

    /**
     * Eine Abfrage pro Seite statt Entities pro Thread nachzuladen (kein N+1). Ohne Join auf die Kategorien,
     * damit jeder Thread genau eine Zeile ergibt; die Kategorien kommen aus {@link #findCategoriesByThreadIdIn}.
     */
    @Query(value = """
            select new org.pixelpit.backend.threads.ThreadSummary(
                t.id, t.title, t.createdAt, substring(p.content, 1, 200))
            from ForumThread t
            join Post p on p.thread = t and p.deletedAt is null
                and p.id = (select min(p2.id) from Post p2 where p2.thread = t)
            where""" + VISIBLE + """
            order by t.createdAt desc, t.id desc
            """,
            countQuery = "select count(t) from ForumThread t where" + VISIBLE)
    Page<ThreadSummary> findSummaries(Pageable pageable);

    /**
     * Kopf eines sichtbaren Threads; ein gelöschter Lösungspost ergibt solutionPostId = null. Ohne Join auf die
     * Kategorien, sonst ergäbe ein Thread mit mehreren Kategorien mehrere Zeilen.
     */
    @Query("""
            select new org.pixelpit.backend.threads.ThreadDetails(
                t.id, t.title, t.createdAt, sp.id, t.createdBy)
            from ForumThread t
            left join Post sp on sp.id = t.solutionPostId and sp.deletedAt is null
            where t.id = :id and""" + VISIBLE)
    Optional<ThreadDetails> findVisibleDetails(@Param("id") int id);

    /** Anzahl sichtbarer Threads eines Profils, z. B. für das eigene Profil. */
    @Query("select count(t) from ForumThread t where t.createdBy = :profileId and" + VISIBLE)
    long countVisibleByCreatedBy(@Param("profileId") int profileId);

    /** Kategorien aller übergebenen Threads mit einer Abfrage (kein N+1), alphabetisch nach Name. */
    @Query("""
            select t.id as threadId, c.id as id, c.name as name
            from ForumThread t
            join t.categories c
            where t.id in :threadIds
            order by c.name, c.id
            """)
    List<CategoryRow> findCategoriesByThreadIdIn(@Param("threadIds") Collection<Integer> threadIds);

    interface CategoryRow {
        Integer getThreadId();
        Integer getId();
        String getName();
    }
}
