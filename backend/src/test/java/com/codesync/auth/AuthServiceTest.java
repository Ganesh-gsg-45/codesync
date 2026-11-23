package com.codesync.auth;

import com.codesync.auth.dto.AuthResponse;
import com.codesync.auth.dto.LoginRequest;
import com.codesync.auth.dto.RegisterRequest;
import com.codesync.exception.ConflictException;
import com.codesync.exception.UnauthorizedException;
import com.codesync.user.User;
import com.codesync.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private UUID sampleUserId;

    @BeforeEach
    void setUp() {
        sampleUserId = UUID.randomUUID();
        sampleUser = User.builder()
                .id(sampleUserId)
                .username("testcoder")
                .email("coder@codesync.dev")
                .passwordHash("$2a$10$hashedPasswordSample")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Register: hashes password with BCrypt, saves user, returns signed tokens")
    void testRegister_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .username("newcoder")
                .email("new@codesync.dev")
                .password("plainSecret123")
                .build();

        when(userRepository.existsByUsername("newcoder")).thenReturn(false);
        when(userRepository.existsByEmail("new@codesync.dev")).thenReturn(false);
        when(passwordEncoder.encode("plainSecret123")).thenReturn("$2a$10$encodedBCrypt");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        when(jwtTokenProvider.generateAccessToken(any(User.class))).thenReturn("mock.jwt.token");
        when(jwtTokenProvider.generateRefreshToken(any(User.class))).thenReturn("mock.refresh.token");
        when(jwtTokenProvider.getExpirationSeconds()).thenReturn(86400L);

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mock.jwt.token");
        assertThat(response.getUser().getUsername()).isEqualTo("newcoder");
        verify(passwordEncoder, times(1)).encode("plainSecret123");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Register: throws ConflictException when email is taken")
    void testRegister_DuplicateEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .username("newcoder")
                .email("coder@codesync.dev")
                .password("plainSecret123")
                .build();

        when(userRepository.existsByUsername("newcoder")).thenReturn(false);
        when(userRepository.existsByEmail("coder@codesync.dev")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Email is already registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Login: verifies password with matches() and returns valid JWT")
    void testLogin_Success() {
        LoginRequest request = LoginRequest.builder()
                .email("coder@codesync.dev")
                .password("plainSecret123")
                .build();

        when(userRepository.findByEmail("coder@codesync.dev")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("plainSecret123", sampleUser.getPasswordHash())).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(sampleUser)).thenReturn("valid.jwt.access");
        when(jwtTokenProvider.generateRefreshToken(sampleUser)).thenReturn("valid.jwt.refresh");
        when(jwtTokenProvider.getExpirationSeconds()).thenReturn(86400L);

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("valid.jwt.access");
        assertThat(response.getUser().getEmail()).isEqualTo("coder@codesync.dev");
        verify(passwordEncoder, times(1)).matches(eq("plainSecret123"), eq(sampleUser.getPasswordHash()));
    }

    @Test
    @DisplayName("Login: throws UnauthorizedException on incorrect password")
    void testLogin_WrongPassword() {
        LoginRequest request = LoginRequest.builder()
                .email("coder@codesync.dev")
                .password("wrongPassword")
                .build();

        when(userRepository.findByEmail("coder@codesync.dev")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongPassword", sampleUser.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid credentials");

        verify(jwtTokenProvider, never()).generateAccessToken(any());
    }

    @Test
    @DisplayName("Login: throws UnauthorizedException on nonexistent email")
    void testLogin_UnknownEmail() {
        LoginRequest request = LoginRequest.builder()
                .email("nonexistent@codesync.dev")
                .password("anyPassword")
                .build();

        when(userRepository.findByEmail("nonexistent@codesync.dev")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid credentials");
    }

    @Test
    @DisplayName("Login: throws UnauthorizedException if account is inactive")
    void testLogin_InactiveAccount() {
        sampleUser.setActive(false);
        LoginRequest request = LoginRequest.builder()
                .email("coder@codesync.dev")
                .password("plainSecret123")
                .build();

        when(userRepository.findByEmail("coder@codesync.dev")).thenReturn(Optional.of(sampleUser));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("User account is inactive");
    }
}
