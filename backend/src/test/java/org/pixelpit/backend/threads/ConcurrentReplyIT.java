package org.pixelpit.backend.threads;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.pixelpit.backend.TestcontainersConfiguration;
import org.pixelpit.backend.threads.exceptions.ThreadHasRepliesException;
import org.pixelpit.backend.threads.exceptions.ThreadNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;

import static java.util.concurrent.TimeUnit.MILLISECONDS;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Ein Konkurrent hält die Sperre der Thread-Zeile in einer offenen Transaktion (wie ein laufender Schreibpfad),
 * der andere muss warten und danach den committeten Stand sehen.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class ConcurrentReplyIT {
    /** Lang genug, dass ein nicht blockierter Aufruf sicher fertig wäre */
    private static final long BLOCKED_MILLIS = 500;

    @Autowired
    private ForumThreadManagement forumThreadManagement;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private int authorAccountId;
    private int authorProfileId;
    private int replierAccountId;
    private int replierProfileId;
    private int threadId;
    private int openingPostId;

    @BeforeEach
    void setUp() {
        truncate();
        authorAccountId = createAccountWithProfile("vera");
        authorProfileId = profileIdOf(authorAccountId);
        replierAccountId = createAccountWithProfile("blackbird");
        replierProfileId = profileIdOf(replierAccountId);
        threadId = jdbcTemplate.queryForObject(
                "INSERT INTO threads (title, created_by) VALUES ('Shader ruckelt', ?) RETURNING id",
                Integer.class, authorProfileId);
        openingPostId = jdbcTemplate.queryForObject(
                "INSERT INTO posts (content, thread_id, created_by) VALUES ('Frage', ?, ?) RETURNING id",
                Integer.class, threadId, authorProfileId);
    }

    @AfterEach
    void truncate() {
        jdbcTemplate.update("""
                TRUNCATE attachments, files, threads_categories, posts, threads, categories, profiles, accounts
                RESTART IDENTITY CASCADE
                """);
    }

    @Test
    void createPost_throwsThreadNotFound_whenDeleteCommitsFirst() {
        CompletableFuture<Integer> reply = whileLocked(
                () -> CompletableFuture.supplyAsync(
                        () -> forumThreadManagement.createPost(replierAccountId, threadId, "Antwort")),
                () -> jdbcTemplate.update("UPDATE threads SET deleted_at = now(), deleted_by = ? WHERE id = ?",
                        authorProfileId, threadId));

        assertFailsWith(reply, ThreadNotFoundException.class);
        assertThat(countPosts()).isEqualTo(1);
    }

    @Test
    void deleteThread_throwsThreadHasReplies_whenReplyCommitsFirst() {
        CompletableFuture<Void> delete = whileLocked(
                () -> CompletableFuture.runAsync(() -> forumThreadManagement.deleteThread(authorAccountId, threadId)),
                this::insertReply);

        assertFailsWith(delete, ThreadHasRepliesException.class);
        assertThat(jdbcTemplate.queryForObject("SELECT deleted_at IS NULL FROM threads WHERE id = ?",
                Boolean.class, threadId)).isTrue();
    }

    @Test
    void updateThread_throwsThreadHasReplies_whenReplyCommitsFirst() {
        int categoryId = jdbcTemplate.queryForObject(
                "INSERT INTO categories (name) VALUES ('Engines') RETURNING id", Integer.class);

        CompletableFuture<Void> update = whileLocked(
                () -> CompletableFuture.runAsync(() -> forumThreadManagement.updateThread(
                        authorAccountId, threadId, "Neuer Titel", "Neue Frage", Set.of(categoryId))),
                this::insertReply);

        assertFailsWith(update, ThreadHasRepliesException.class);
        assertThat(jdbcTemplate.queryForObject("SELECT title FROM threads WHERE id = ?", String.class, threadId))
                .isEqualTo("Shader ruckelt");
    }

    @Test
    void updateOpeningPost_throwsThreadHasReplies_whenReplyCommitsFirst() {
        CompletableFuture<Void> update = whileLocked(
                () -> CompletableFuture.runAsync(() -> forumThreadManagement.updatePost(
                        authorAccountId, threadId, openingPostId, "Neuer Text")),
                this::insertReply);

        assertFailsWith(update, ThreadHasRepliesException.class);
        assertThat(jdbcTemplate.queryForObject("SELECT content FROM posts WHERE id = ?", String.class, openingPostId))
                .isEqualTo("Frage");
    }

    /**
     * Sperrt die Thread-Zeile, startet den Konkurrenten, prüft, dass er wartet, führt dann die eigene Änderung aus
     * und committet.
     */
    private <T> CompletableFuture<T> whileLocked(Supplier<CompletableFuture<T>> competitor,
                                                 Runnable firstChange) {
        return transactionTemplate.execute(status -> {
            jdbcTemplate.queryForObject("SELECT id FROM threads WHERE id = ? FOR UPDATE", Integer.class, threadId);
            CompletableFuture<T> future = competitor.get();
            assertThatThrownBy(() -> future.get(BLOCKED_MILLIS, MILLISECONDS))
                    .as("Der Konkurrent muss auf die Sperre der Thread-Zeile warten")
                    .isInstanceOf(TimeoutException.class);
            firstChange.run();
            return future;
        });
    }

    private static void assertFailsWith(CompletableFuture<?> future, Class<? extends Throwable> expected) {
        assertThatThrownBy(() -> future.get(10, SECONDS))
                .isInstanceOf(ExecutionException.class)
                .hasCauseInstanceOf(expected);
    }

    private void insertReply() {
        jdbcTemplate.update("INSERT INTO posts (content, thread_id, created_by) VALUES ('Antwort', ?, ?)",
                threadId, replierProfileId);
    }

    private int countPosts() {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM posts WHERE thread_id = ?", Integer.class, threadId);
    }

    private int createAccountWithProfile(String username) {
        Integer id = jdbcTemplate.queryForObject(
                "INSERT INTO accounts (email, password_hash) VALUES (?, 'hash') RETURNING id",
                Integer.class, username + "@mock.com");
        jdbcTemplate.update("INSERT INTO profiles (account_id, username) VALUES (?, ?)", id, username);
        return id;
    }

    private int profileIdOf(int accountId) {
        return jdbcTemplate.queryForObject("SELECT id FROM profiles WHERE account_id = ?", Integer.class, accountId);
    }
}
