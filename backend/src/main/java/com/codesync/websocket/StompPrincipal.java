package com.codesync.websocket;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.security.Principal;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class StompPrincipal implements Principal {
    private final String name; // userId as string
    private final UUID userId;
    private final String username;

    public StompPrincipal(UUID userId, String username) {
        this.name = userId.toString();
        this.userId = userId;
        this.username = username;
    }

    @Override
    public String getName() {
        return name;
    }
}
