package org.pixelpit.backend.threads.exceptions;

/** Unter dem Thread steht mindestens eine sichtbare Antwort – Thread und Eröffnungspost sind damit gesperrt. */
public class ThreadHasRepliesException extends RuntimeException {
    public ThreadHasRepliesException(int threadId) {
        super("Thread %d hat bereits Antworten".formatted(threadId));
    }
}
