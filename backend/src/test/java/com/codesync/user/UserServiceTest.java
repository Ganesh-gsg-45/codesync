package com.codesync.user;

import com.codesync.exception.ConflictException;
import com.codesync.exception.ResourceNotFoundException;
import com.codesync.user.dto.CreateUserRequest;
import com.codesync.user.dto.UpdateUserRequest;
import com.codesync.user.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User sampleUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sampleUser = User.builder()
                .id(userId)
                .username("testuser")
                .email("test@codesync.dev")
                .passwordHash("secret123")
                .fullName("Test User")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Create user successfully")
    void testCreateUser_Success() {
        CreateUserRequest request = CreateUserRequest.builder()
                .username("newuser")
                .email("new@codesync.dev")
                .password("password123")
                .fullName("New User")
                .build();

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("new@codesync.dev")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed_secret");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        UserResponse response = userService.createUser(request);

        assertThat(response).isNotNull();
        assertThat(response.getUsername()).isEqualTo("newuser");
        assertThat(response.getEmail()).isEqualTo("new@codesync.dev");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Create user throws ConflictException when username exists")
    void testCreateUser_DuplicateUsername() {
        CreateUserRequest request = CreateUserRequest.builder()
                .username("testuser")
                .email("another@codesync.dev")
                .password("password123")
                .build();

        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Username is already taken");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Get user by ID returns response when found")
    void testGetUserById_Success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));

        UserResponse response = userService.getUserById(userId);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(userId);
        assertThat(response.getUsername()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("Get user by ID throws ResourceNotFoundException when not found")
    void testGetUserById_NotFound() {
        UUID randomId = UUID.randomUUID();
        when(userRepository.findById(randomId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(randomId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Update user modifies properties and saves")
    void testUpdateUser_Success() {
        UpdateUserRequest updateReq = UpdateUserRequest.builder()
                .fullName("Updated Name")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        UserResponse response = userService.updateUser(userId, updateReq);

        assertThat(response).isNotNull();
        assertThat(sampleUser.getFullName()).isEqualTo("Updated Name");
    }
}
