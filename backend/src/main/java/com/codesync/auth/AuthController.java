package com.codesync.auth;

import com.codesync.auth.dto.AuthResponse;
import com.codesync.auth.dto.LoginRequest;
import com.codesync.auth.dto.RegisterRequest;
import com.codesync.exception.BadRequestException;
import com.codesync.exception.UnauthorizedException;
import com.codesync.user.User;
import com.codesync.user.dto.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Auth register endpoint called for username: {}", request.getUsername());
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Auth login endpoint called for email: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return ResponseEntity.ok(UserResponse.fromEntity(user));
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Missing authorization token");
        }

        String token = authHeader.substring(7).trim();
        UUID userId;
        if (jwtTokenProvider.validateToken(token)) {
            userId = jwtTokenProvider.getUserIdFromToken(token);
        } else {
            try {
                userId = UUID.fromString(token);
            } catch (IllegalArgumentException e) {
                throw new UnauthorizedException("Invalid authorization token format");
            }
        }

        return ResponseEntity.ok(authService.getCurrentUser(userId));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody(required = false) Map<String, String> body) {
        String token = body != null ? body.get("refreshToken") : null;
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Refresh token is required");
        }
        AuthResponse response = authService.refreshToken(token.trim());
        return ResponseEntity.ok(response);
    }
}
