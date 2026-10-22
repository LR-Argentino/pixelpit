package org.pixelpit.backend.threads;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ForumThreadManagement {
    private final ForumThreadRepository forumThreadRepository;

    @Transactional(readOnly = true)
    public Page<ThreadSummary> listThreads(Pageable pageable) {
        return forumThreadRepository.findSummaries(pageable);
    }
}
