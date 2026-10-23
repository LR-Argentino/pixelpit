package org.pixelpit.backend.threads.web;

import org.pixelpit.backend.threads.exceptions.ThreadNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice(assignableTypes = ForumThreadController.class)
public class ThreadExceptionHandler {

    /** Muss dem Namen des Pfad-Parameters in {@link ForumThreadController} entsprechen. */
    private static final String THREAD_ID_PARAMETER = "id";

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return THREAD_ID_PARAMETER.equals(e.getName()) ? invalidThreadId() : invalidPaging();
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ProblemDetail handleValidation(HandlerMethodValidationException e) {
        boolean threadIdInvalid = e.getParameterValidationResults().stream()
                .anyMatch(result -> THREAD_ID_PARAMETER.equals(result.getMethodParameter().getParameterName()));
        return threadIdInvalid ? invalidThreadId() : invalidPaging();
    }

    /** Unbekannt und gelöscht ergeben dieselbe Antwort, damit sich nicht erkennen lässt, ob es einen Thread gab. */
    @ExceptionHandler(ThreadNotFoundException.class)
    public ProblemDetail handleThreadNotFound() {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problemDetail.setTitle("Thread nicht gefunden");
        problemDetail.setDetail("Diesen Thread gibt es nicht.");
        return problemDetail;
    }

    private ProblemDetail invalidThreadId() {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problemDetail.setTitle("Ungültige Thread-ID");
        problemDetail.setDetail("Die Thread-ID muss eine positive ganze Zahl sein.");
        return problemDetail;
    }

    private ProblemDetail invalidPaging() {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problemDetail.setTitle("Ungültige Seitenangabe");
        problemDetail.setDetail("Seite muss 0 oder größer sein, Seitengröße mindestens 1.");
        return problemDetail;
    }
}
