package org.pixelpit.backend.configs;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@EnableWebSecurity
@Configuration
class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
            http
                .cors(Customizer.withDefaults())
                    .csrf((csrf) -> csrf.ignoringRequestMatchers("/auth/login", "/api/accounts"))
                    .authorizeHttpRequests((authorize) -> authorize
                            .requestMatchers("/api/auth/login", "/api/accounts","/error").permitAll()
                            .anyRequest().authenticated()
                    );
            return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(CorsProperties props) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(props.allowedOrigins());
        config.setAllowedMethods(props.allowedMethods());
        config.setAllowedHeaders(props.allowedHeaders());
        config.setAllowCredentials(props.allowCredentials());
        config.setMaxAge(props.maxAge());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder(PasswordEncoderProperties props) {
        return new Argon2PasswordEncoder(
                props.saltLength(),
                props.hashLength(),
                props.parallelism(),
                props.memory(),
                props.iterations()
        );
    }
}
