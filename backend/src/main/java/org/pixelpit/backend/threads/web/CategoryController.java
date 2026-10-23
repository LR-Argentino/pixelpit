package org.pixelpit.backend.threads.web;

import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.threads.ForumThreadManagement;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final ForumThreadManagement forumThreadManagement;

    @GetMapping
    public List<CategoryResponse> listCategories() {
        return CategoryResponse.from(forumThreadManagement.listCategories());
    }
}
