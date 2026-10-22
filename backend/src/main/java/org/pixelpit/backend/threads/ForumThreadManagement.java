package org.pixelpit.backend.threads;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ForumThreadManagement {
    private final ForumThreadRepository forumThreadRepository;
}
