package org.pixelpit.backend.threads.web;

import org.pixelpit.backend.threads.exceptions.ThreadNotFoundException;
import org.pixelpit.backend.threads.exceptions.UnknownCategoryException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Vorrang vor dem globalen AccountExceptionHandler, der sonst die Validierungsfehler ohne Titel beantwortet. */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = ForumThreadController.class)
public class ThreadExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleInvalidBody(MethodArgumentNotValidException e) {
        Map<String, List<String>> errors = new HashMap<>();
        e.getBindingResult().getFieldErrors().forEach(fieldError -> errors
                .computeIfAbsent(fieldName(fieldError.getField()), key -> new ArrayList<>())
                .add(fieldError.getDefaultMessage()));
        return invalidInput(errors);
    }

    /** Gleiche Form wie ein Feldfehler, damit das Frontend alle Kategoriefehler am selben Feld zeigen kann. */
    @ExceptionHandler(UnknownCategoryException.class)
    public ProblemDetail handleUnknownCategory(UnknownCategoryException e) {
        List<String> messages = e.getCategoryIds().stream()
                .map(id -> "Kategorie existiert nicht: " + id)
                .toList();
        return invalidInput(Map.of("categoryIds", messages));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadableBody() {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problemDetail.setTitle("Ungültige Anfrage");
        problemDetail.setDetail("Der Inhalt der Anfrage ist kein gültiges JSON oder hat falsche Datentypen.");
        return problemDetail;
    }

    /** Fehler an einzelnen Kategorien ("categoryIds[]") gehören zum Feld "categoryIds". */
    private static String fieldName(String field) {
        int index = field.indexOf('[');
        return index < 0 ? field : field.substring(0, index);
    }

    private static ProblemDetail invalidInput(Map<String, List<String>> errors) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problemDetail.setTitle("Ungültige Eingabe");
        problemDetail.setDetail("Validierung fehlgeschlagen");
        problemDetail.setProperty("errors", errors);
        return problemDetail;
    }

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
