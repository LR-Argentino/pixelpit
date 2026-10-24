package org.pixelpit.backend.threads.internal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostRepository extends PagingAndSortingRepository<Post, Integer>, CrudRepository<Post, Integer> {

    Optional<Post> findById(Integer id);

    /** Nicht gelöschte Posts eines Threads, ältester zuerst; die ID entscheidet bei gleichem Zeitpunkt. */
    @Query(value = """
            select p from Post p
            where p.thread.id = :threadId and p.deletedAt is null
            order by p.createdAt asc, p.id asc
            """,
            countQuery = "select count(p) from Post p where p.thread.id = :threadId and p.deletedAt is null")
    Page<Post> findVisibleByThreadId(@Param("threadId") int threadId, Pageable pageable);

    /** ID des Eröffnungsposts, also des Posts mit der kleinsten ID (wie in VISIBLE), auch wenn er gelöscht ist. */
    @Query("select min(p.id) from Post p where p.thread.id = :threadId")
    Integer findOpeningPostId(@Param("threadId") int threadId);

    /** Gibt es einen nicht gelöschten Post außer dem Eröffnungspost (kleinste Post-ID, wie in VISIBLE)? */
    @Query("""
            select count(p) > 0 from Post p
            where p.thread.id = :threadId and p.deletedAt is null
              and p.id > (select min(p2.id) from Post p2 where p2.thread.id = :threadId)
            """)
    boolean existsVisibleReply(@Param("threadId") int threadId);

    /** Anzahl nicht gelöschter Posts eines Profils in sichtbaren Threads, Eröffnungsposts eingeschlossen. */
    @Query("""
            select count(p) from Post p
            join p.thread t
            where p.createdBy = :profileId and p.deletedAt is null and""" + ForumThreadRepository.VISIBLE)
    long countVisibleByCreatedBy(@Param("profileId") int profileId);
}
