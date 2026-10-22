package org.pixelpit.backend.threads;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;

public interface ForumThreadRepository extends PagingAndSortingRepository<ForumThread, Integer> {

    /**
     * Eine Abfrage pro Seite statt Entities pro Thread nachzuladen (kein N+1).
     * Eröffnungspost = Post mit der kleinsten ID; ist er gelöscht, bleibt die Vorschau leer.
     */
    @Query(value = """
            select new org.pixelpit.backend.threads.ThreadSummary(
                t.id, t.title, t.createdAt, c.id, c.name,
                case when p.deletedAt is null then substring(p.content, 1, 200) end)
            from ForumThread t
            left join t.categories c
            left join Post p on p.thread = t
                and p.id = (select min(p2.id) from Post p2 where p2.thread = t)
            where t.deletedAt is null
            order by t.createdAt desc, t.id desc
            """,
            countQuery = "select count(t) from ForumThread t where t.deletedAt is null")
    Page<ThreadSummary> findSummaries(Pageable pageable);
}
