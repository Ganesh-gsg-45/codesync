package com.codesync.health;

import com.codesync.health.dto.HealthResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check controller providing system status and database connectivity details.
 */
@Slf4j
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    @GetMapping
    public ResponseEntity<HealthResponse> getHealth() {
        log.debug("GET /api/health requested");

        Map<String, Object> details = new HashMap<>();
        String dbStatus = "UNKNOWN";

        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                dbStatus = "UP";
            } else {
                dbStatus = "DOWN";
            }
        } catch (Exception e) {
            log.warn("Database health check failed: {}", e.getMessage());
            dbStatus = "DOWN: " + e.getMessage();
        }

        details.put("database", dbStatus);
        details.put("jvm_free_memory_mb", Runtime.getRuntime().freeMemory() / (1024 * 1024));
        details.put("jvm_total_memory_mb", Runtime.getRuntime().totalMemory() / (1024 * 1024));

        HealthResponse response = HealthResponse.builder()
                .status("UP")
                .service("codesync-backend")
                .version("1.0.0")
                .timestamp(Instant.now())
                .details(details)
                .build();

        return ResponseEntity.ok(response);
    }
}
