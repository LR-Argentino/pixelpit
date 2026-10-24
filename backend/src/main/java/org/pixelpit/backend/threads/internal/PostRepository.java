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

    /** Anzahl nicht gelöschter Posts eines Profils in sichtbaren Threads, Eröffnungsposts eingeschlossen. */
    @Query("""
            select count(p) from Post p
            join p.thread t
            where p.createdBy = :profileId and p.deletedAt is null and""" + ForumThreadRepository.VISIBLE)
    long countVisibleByCreatedBy(@Param("profileId") int profileId);
}
