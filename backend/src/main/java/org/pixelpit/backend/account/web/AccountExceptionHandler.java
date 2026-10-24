package org.pixelpit.backend.account.web;

import org.pixelpit.backend.account.exceptions.AccountNotFoundException;
import org.pixelpit.backend.account.exceptions.EmailAlreadyTakenException;
import org.pixelpit.backend.account.exceptions.InvalidPasswordException;
import org.pixelpit.backend.account.exceptions.OwnRoleChangeException;
import org.pixelpit.backend.account.exceptions.PasswordMismatchException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class AccountExceptionHandler {


    @ExceptionHandler(EmailAlreadyTakenException.class)
    public ProblemDetail handleEmailAlreadyTakenException(EmailAlreadyTakenException e) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problemDetail.setTitle("Email existiert bereits!");
        problemDetail.setDetail(e.getMessage());
        return problemDetail;
    }

    @ExceptionHandler(PasswordMismatchException.class)
    public ProblemDetail handlePasswordMismatchException(PasswordMismatchException e) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problemDetail.setTitle("Passwörter stimmen nicht überein!");
        problemDetail.setDetail(e.getMessage());
        return problemDetail;
    }

    // 403 statt 401: der Nutzer ist angemeldet, ein 401 würde das Frontend als abgelaufene Session deuten
    @ExceptionHandler(InvalidPasswordException.class)
    public ProblemDetail handleInvalidPasswordException(InvalidPasswordException e) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        problemDetail.setTitle("Passwort ist falsch");
        problemDetail.setDetail(e.getMessage());
        return problemDetail;
    }

    @ExceptionHandler(AccountNotFoundException.class)
    public ProblemDetail handleAccountNotFoundException(AccountNotFoundException e) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problemDetail.setTitle("Konto nicht gefunden");
        problemDetail.setDetail(e.getMessage());
        return problemDetail;
    }

    @ExceptionHandler(OwnRoleChangeException.class)
    public ProblemDetail handleOwnRoleChangeException(OwnRoleChangeException e) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problemDetail.setTitle("Die eigene Rolle kann nicht geändert werden");
        problemDetail.setDetail(e.getMessage());
        return problemDetail;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail invalidArgumentsHandler(MethodArgumentNotValidException ex) {
        Map<String, List<String>> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fieldError -> {
            errors.computeIfAbsent(fieldError.getField(), key -> new ArrayList<>()).add(fieldError.getDefaultMessage());
        });
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problemDetail.setProperty("errors", errors);
        problemDetail.setDetail("Validierung fehlgeschlagen");
        return problemDetail;
    }
}
