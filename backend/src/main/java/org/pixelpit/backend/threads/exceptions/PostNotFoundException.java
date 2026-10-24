package org.pixelpit.backend.threads.exceptions;

/** Post gibt es in diesem Thread nicht oder er ist gelöscht – beides wird bewusst nicht unterschieden. */
public class PostNotFoundException extends RuntimeException {
    public PostNotFoundException(int postId) {
        super("Post %d nicht gefunden".formatted(postId));
    }
}
