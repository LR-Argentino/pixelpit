package org.pixelpit.backend.threads.web;

import org.pixelpit.backend.threads.exceptions.NotContentOwnerException;
import org.pixelpit.backend.threads.exceptions.PostNotFoundException;
import org.pixelpit.backend.threads.exceptions.ThreadHasRepliesException;
import org.pixelpit.backend.threads.exceptions.ThreadNotFoundException;
import org.pixelpit.backend.threads.exceptions.UnknownCategoryException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
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
        return invalidInput(fieldErrors(e.getBindingResult().getFieldErrors()));
    }

    private static Map<String, List<String>> fieldErrors(List<FieldError> fieldErrors) {
        Map<String, List<String>> errors = new HashMap<>();
        fieldErrors.forEach(fieldError -> errors
                .computeIfAbsent(fieldName(fieldError.getField()), key -> new ArrayList<>())
                .add(fieldError.getDefaultMessage()));
        return errors;
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

    /** Müssen den Namen der Pfad-Parameter in {@link ForumThreadController} entsprechen. */
    private static final String THREAD_ID_PARAMETER = "id";
    private static final String POST_ID_PARAMETER = "postId";

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return switch (e.getName()) {
            case THREAD_ID_PARAMETER -> invalidThreadId();
            case POST_ID_PARAMETER -> invalidPostId();
            default -> invalidPaging();
        };
    }

    /**
     * Hat eine Methode Constraints an Pfad- oder Query-Parametern, prüft Spring auch den @Valid-Body
     * per Methodenvalidierung; seine Feldfehler kommen dann hier statt in {@link #handleInvalidBody} an.
     */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ProblemDetail handleValidation(HandlerMethodValidationException e) {
        boolean threadIdInvalid = e.getParameterValidationResults().stream()
                .anyMatch(result -> THREAD_ID_PARAMETER.equals(result.getMethodParameter().getParameterName()));
        if (threadIdInvalid) {
            return invalidThreadId();
        }
        boolean postIdInvalid = e.getParameterValidationResults().stream()
                .anyMatch(result -> POST_ID_PARAMETER.equals(result.getMethodParameter().getParameterName()));
        if (postIdInvalid) {
            return invalidPostId();
        }
        List<FieldError> bodyErrors = e.getBeanResults().stream()
                .flatMap(result -> result.getFieldErrors().stream())
                .toList();
        return bodyErrors.isEmpty() ? invalidPaging() : invalidInput(fieldErrors(bodyErrors));
    }

    /** Unbekannt und gelöscht ergeben dieselbe Antwort, damit sich nicht erkennen lässt, ob es einen Thread gab. */
    @ExceptionHandler(ThreadNotFoundException.class)
    public ProblemDetail handleThreadNotFound() {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problemDetail.setTitle("Thread nicht gefunden");
        problemDetail.setDetail("Diesen Thread gibt es nicht.");
        return problemDetail;
    }

    /** Unbekannt, gelöscht oder in einem anderen Thread ergeben dieselbe Antwort. */
    @ExceptionHandler(PostNotFoundException.class)
    public ProblemDetail handlePostNotFound() {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problemDetail.setTitle("Beitrag nicht gefunden");
        problemDetail.setDetail("Diesen Beitrag gibt es nicht.");
        return problemDetail;
    }

    @ExceptionHandler(NotContentOwnerException.class)
    public ProblemDetail handleNotContentOwner() {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        problemDetail.setTitle("Keine Berechtigung");
        problemDetail.setDetail("Nur der Ersteller darf diesen Inhalt bearbeiten oder löschen.");
        return problemDetail;
    }

    @ExceptionHandler(ThreadHasRepliesException.class)
    public ProblemDetail handleThreadHasReplies() {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problemDetail.setTitle("Thread hat bereits Antworten");
        problemDetail.setDetail("Nicht mehr änderbar, weil bereits jemand geantwortet hat.");
        return problemDetail;
    }

    private ProblemDetail invalidThreadId() {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problemDetail.setTitle("Ungültige Thread-ID");
        problemDetail.setDetail("Die Thread-ID muss eine positive ganze Zahl sein.");
        return problemDetail;
    }

    private ProblemDetail invalidPostId() {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problemDetail.setTitle("Ungültige Beitrags-ID");
        problemDetail.setDetail("Die Beitrags-ID muss eine positive ganze Zahl sein.");
        return problemDetail;
    }

    private ProblemDetail invalidPaging() {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problemDetail.setTitle("Ungültige Seitenangabe");
        problemDetail.setDetail("Seite muss 0 oder größer sein, Seitengröße mindestens 1.");
        return problemDetail;
    }
}
