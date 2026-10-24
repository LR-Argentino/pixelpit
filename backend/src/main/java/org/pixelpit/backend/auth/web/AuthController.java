package org.pixelpit.backend.auth.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.pixelpit.backend.account.AccountDetails;
import org.pixelpit.backend.profile.ProfileLookUp;
import org.pixelpit.backend.threads.ForumActivity;
import org.pixelpit.backend.threads.ForumThreadManagement;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final ProfileLookUp profileLookUp;
    private final ForumThreadManagement forumThreadManagement;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void login(@Valid @RequestBody LoginRequest loginRequest,
                      HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(loginRequest.identifier(), loginRequest.password()));

        // Schutz vor Session Fixation
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        securityContextRepository.saveContext(context, request, response);
    }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal AccountDetails me) {
        String username = profileLookUp.findUsernameByAccountId(me.getAccountId()).orElse(null);
        ForumActivity activity = forumThreadManagement.countActivity(me.getAccountId());
        return new MeResponse(me.getAccountId(), me.getEmail(), username, me.getRole(),
                activity.threadCount(), activity.postCount());
    }
}
