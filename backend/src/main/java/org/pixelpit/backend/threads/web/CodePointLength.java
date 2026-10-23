package org.pixelpit.backend.threads.web;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Länge in Unicode-Zeichen (Code Points) wie Postgres' {@code length()}. {@code @Size} zählt UTF-16-Einheiten,
 * ein Emoji also doppelt – ein zu kurzer Titel käme dann erst am CHECK der Datenbank als 500 an.
 * {@code null} gilt als gültig, dafür ist {@code @NotBlank} zuständig.
 */
@Documented
@Constraint(validatedBy = CodePointLength.Validator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface CodePointLength {
    int min() default 0;

    int max() default Integer.MAX_VALUE;

    String message() default "Länge muss zwischen {min} und {max} Zeichen liegen";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<CodePointLength, String> {
        private int min;
        private int max;

        @Override
        public void initialize(CodePointLength annotation) {
            min = annotation.min();
            max = annotation.max();
        }

        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            if (value == null) {
                return true;
            }
            int length = value.codePointCount(0, value.length());
            return length >= min && length <= max;
        }
    }
}
