package org.pixelpit.backend.threads.exceptions;

import lombok.Getter;

import java.util.Set;

/** Eine angegebene Kategorie gibt es nicht – ein Eingabefehler, kein "nicht gefunden". */
@Getter
public class UnknownCategoryException extends RuntimeException {
    private final Set<Integer> categoryIds;

    public UnknownCategoryException(Set<Integer> categoryIds) {
        super("Kategorien existieren nicht: " + categoryIds);
        this.categoryIds = categoryIds;
    }
}
