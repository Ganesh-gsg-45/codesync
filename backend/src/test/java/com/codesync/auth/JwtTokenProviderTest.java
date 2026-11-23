package com.codesync.auth;

import com.codesync.user.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenProviderTest {

    private static final String STRONG_SECRET = "super-secret-jwt-key-that-is-at-least-256-bits-long-for-hmac-sha256!";

    @Test
    @DisplayName("init() succeeds with 256-bit strong secret")
    void testInit_WithStrongSecret_Success() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", STRONG_SECRET);
        ReflectionTestUtils.setField(provider, "accessTokenExpirationMs", 3600000L);
        ReflectionTestUtils.setField(provider, "refreshTokenExpirationMs", 7200000L);

        provider.init();

        User user = User.builder()
                .id(UUID.randomUUID())
                .username("testcoder")
                .email("testcoder@codesync.dev")
                .build();

        String token = provider.generateAccessToken(user);
        assertThat(token).isNotBlank();
        assertThat(provider.validateToken(token)).isTrue();
        assertThat(provider.getUserIdFromToken(token)).isEqualTo(user.getId());
        assertThat(provider.getUsernameFromToken(token)).isEqualTo("testcoder");
    }

    @Test
    @DisplayName("init() throws IllegalStateException if JWT secret is null or empty")
    void testInit_WithMissingSecret_ThrowsException() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "");

        assertThatThrownBy(provider::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT Secret must be configured");
    }

    @Test
    @DisplayName("init() throws IllegalStateException if JWT secret is shorter than 32 characters")
    void testInit_WithShortSecret_ThrowsException() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "too-short-secret");

        assertThatThrownBy(provider::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 256 bits (32 characters) long");
    }

    @Test
    @DisplayName("validateToken() returns false for malformed token")
    void testValidateToken_Malformed_ReturnsFalse() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", STRONG_SECRET);
        ReflectionTestUtils.setField(provider, "accessTokenExpirationMs", 3600000L);
        ReflectionTestUtils.setField(provider, "refreshTokenExpirationMs", 7200000L);
        provider.init();

        assertThat(provider.validateToken("invalid.token.structure")).isFalse();
    }
}
