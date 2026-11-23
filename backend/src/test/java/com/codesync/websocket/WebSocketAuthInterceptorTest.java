package com.codesync.websocket;

import com.codesync.auth.JwtTokenProvider;
import com.codesync.exception.BadRequestException;
import com.codesync.room.RoomRole;
import com.codesync.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebSocketAuthInterceptorTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CollaborationService collaborationService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private MessageChannel messageChannel;

    @InjectMocks
    private WebSocketAuthInterceptor interceptor;

    private UUID userId;
    private UUID roomId;
    private StompPrincipal principal;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        roomId = UUID.randomUUID();
        principal = new StompPrincipal(userId, "testuser");
    }

    @Test
    @DisplayName("SUBSCRIBE to room topic without authentication throws AccessDeniedException")
    void testSubscribe_Unauthenticated_ThrowsAccessDenied() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/room/" + roomId);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Authentication required");
    }

    @Test
    @DisplayName("SUBSCRIBE to presence topic without authentication throws AccessDeniedException")
    void testSubscribe_Presence_Unauthenticated_ThrowsAccessDenied() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/room/" + roomId + "/presence");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Authentication required");
    }

    @Test
    @DisplayName("SUBSCRIBE to cursor topic without authentication throws AccessDeniedException")
    void testSubscribe_Cursors_Unauthenticated_ThrowsAccessDenied() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/room/" + roomId + "/cursors");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Authentication required");
    }

    @Test
    @DisplayName("SEND to /app/editor.operation without authentication throws AccessDeniedException")
    void testSend_Operation_Unauthenticated_ThrowsAccessDenied() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        accessor.setDestination("/app/editor.operation");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Authentication required");
    }

    @Test
    @DisplayName("SUBSCRIBE by authenticated user to authorized room succeeds")
    void testSubscribe_Authenticated_Authorized_Success() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setUser(principal);
        accessor.setDestination("/topic/room/" + roomId);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(collaborationService.validateUserRoomAccess(roomId, userId)).thenReturn(RoomRole.EDITOR);

        Message<?> result = interceptor.preSend(message, messageChannel);
        assertThat(result).isNotNull();
        verify(collaborationService, times(1)).validateUserRoomAccess(roomId, userId);
    }

    @Test
    @DisplayName("SUBSCRIBE by authenticated user to private room without membership throws AccessDeniedException")
    void testSubscribe_Authenticated_Unauthorized_ThrowsAccessDenied() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setUser(principal);
        accessor.setDestination("/topic/room/" + roomId);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(collaborationService.validateUserRoomAccess(roomId, userId))
                .thenThrow(new BadRequestException("Access denied: User is not an authorized member of private room: " + roomId));

        assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied for room");
    }

    @Test
    @DisplayName("SUBSCRIBE with malformed room UUID throws IllegalArgumentException")
    void testSubscribe_InvalidUUID_ThrowsIllegalArgument() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setUser(principal);
        accessor.setDestination("/topic/room/invalid-not-a-uuid");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
