package org.pixelpit.backend.threads;

import java.time.Instant;
import java.util.List;

/**
 * Kopf eines sichtbaren Threads. solutionPostId und solution sind null, wenn keine sichtbare Lösung markiert ist.
 * authorId ist die Profil-ID des Erstellers, author sein Benutzername (bei gelöschten Konten „deleted-&lt;id&gt;“).
 * categories ist alphabetisch nach Name sortiert. author, categories und solution sind null bzw. leer, solange sie
 * nicht geladen wurden (z. B. beim Blättern durch die Posts).
 */
public record ThreadDetails(
        Integer id,
        String title,
        Instant createdAt,
        List<CategoryView> categories,
        Integer solutionPostId,
        Integer authorId,
        String author,
        PostView solution
) {
    /** Für die JPQL-Projektion, ohne Kategorien, aufgelösten Autor und Lösungspost. */
    public ThreadDetails(Integer id, String title, Instant createdAt, Integer solutionPostId, Integer authorId) {
        this(id, title, createdAt, List.of(), solutionPostId, authorId, null, null);
    }

    public ThreadDetails withCategories(List<CategoryView> categories) {
        return new ThreadDetails(id, title, createdAt, categories, solutionPostId, authorId, author, solution);
    }

    public ThreadDetails withAuthor(String author) {
        return new ThreadDetails(id, title, createdAt, categories, solutionPostId, authorId, author, solution);
    }

    public ThreadDetails withSolution(PostView solution) {
        return new ThreadDetails(id, title, createdAt, categories, solutionPostId, authorId, author, solution);
    }
}
