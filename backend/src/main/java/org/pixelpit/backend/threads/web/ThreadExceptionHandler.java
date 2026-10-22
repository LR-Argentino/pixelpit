package org.pixelpit.backend.threads.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice(assignableTypes = ForumThreadController.class)
public class ThreadExceptionHandler {

    @ExceptionHandler({HandlerMethodValidationException.class, MethodArgumentTypeMismatchException.class})
    public ProblemDetail handleInvalidPaging(Exception e) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problemDetail.setTitle("Ungültige Seitenangabe");
        problemDetail.setDetail("Seite muss 0 oder größer sein, Seitengröße mindestens 1.");
        return problemDetail;
    }
}
