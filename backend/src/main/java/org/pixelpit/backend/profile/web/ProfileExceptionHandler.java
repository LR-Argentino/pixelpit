package org.pixelpit.backend.profile.web;

import org.pixelpit.backend.profile.exceptions.UsernameAlreadyTakenException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ProfileExceptionHandler {

    @ExceptionHandler(UsernameAlreadyTakenException.class)
    public ProblemDetail handleUsernameAlreadyTakenException(UsernameAlreadyTakenException e) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problemDetail.setTitle("Benutzername ist schon vergeben!");
        problemDetail.setDetail(e.getMessage());
        return problemDetail;
    }
}
