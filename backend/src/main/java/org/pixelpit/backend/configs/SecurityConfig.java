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
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
            http
                .cors(Customizer.withDefaults())
                    .csrf((csrf) -> csrf.ignoringRequestMatchers("/auth/login", "/auth/register"))
                    .authorizeHttpRequests((authorize) -> authorize
                            .requestMatchers("/auth/login", "/auth/register","/error").permitAll()
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
    public PasswordEncoder passwordEncoder() {
        return new Argon2PasswordEncoder(
                16,      // saltLength  – 16 Bytes (128 Bit)
                32,      // hashLength  – 32 Bytes (256 Bit)
                1,       // parallelism – p = 1
                19456,   // memory      – in KiB → 19 MiB
                2        // iterations  – t = 2
        );
    }
}
