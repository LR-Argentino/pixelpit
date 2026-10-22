package org.pixelpit.backend.threads.exceptions;

/** Thread gibt es nicht oder er ist gelöscht – beides wird bewusst nicht unterschieden. */
public class ThreadNotFoundException extends RuntimeException {
    public ThreadNotFoundException(int threadId) {
        super("Thread %d nicht gefunden".formatted(threadId));
    }
}
