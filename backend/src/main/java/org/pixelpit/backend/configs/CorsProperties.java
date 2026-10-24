package org.pixelpit.backend.configs;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.List;

@ConfigurationProperties(prefix = "app.cors")
record CorsProperties(
        List<String> allowedOrigins,
        @DefaultValue({"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}) List<String> allowedMethods,
        @DefaultValue({"Authorization", "Content-Type"}) List<String> allowedHeaders,
        @DefaultValue("true") boolean allowCredentials,
        @DefaultValue("3600") long maxAge)
{ }
