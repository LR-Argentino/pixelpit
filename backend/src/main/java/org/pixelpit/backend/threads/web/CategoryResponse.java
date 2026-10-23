package org.pixelpit.backend.threads.web;

import org.pixelpit.backend.threads.CategoryView;

import java.util.List;

public record CategoryResponse(Integer id, String name) {
    static List<CategoryResponse> from(List<CategoryView> categories) {
        return categories.stream().map(category -> new CategoryResponse(category.id(), category.name())).toList();
    }
}
