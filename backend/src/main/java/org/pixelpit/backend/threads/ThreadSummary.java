package org.pixelpit.backend.threads;

import java.time.Instant;
import java.util.List;

/** Eintrag der Thread-Liste; categories ist alphabetisch nach Name sortiert und leer, wenn es keine gibt. */
public record ThreadSummary(
        Integer id,
        String title,
        Instant createdAt,
        String excerpt,
        List<CategoryView> categories
) {
    /** Für die JPQL-Projektion, ohne Kategorien. */
    public ThreadSummary(Integer id, String title, Instant createdAt, String excerpt) {
        this(id, title, createdAt, excerpt, List.of());
    }

    public ThreadSummary withCategories(List<CategoryView> categories) {
        return new ThreadSummary(id, title, createdAt, excerpt, categories);
    }
}
