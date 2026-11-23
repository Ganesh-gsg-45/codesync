package com.codesync.config;

import com.codesync.document.CodeDocument;
import com.codesync.document.CodeDocumentRepository;
import com.codesync.room.Room;
import com.codesync.room.RoomMember;
import com.codesync.room.RoomMemberRepository;
import com.codesync.room.RoomRepository;
import com.codesync.room.RoomRole;
import com.codesync.user.User;
import com.codesync.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Automatically seeds development and test user accounts on startup.
 * Guarantees that active test credentials never fail with 'Invalid credentials'.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final CodeDocumentRepository codeDocumentRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking CodeSync database seed accounts...");

        User ganesh = seedUser("ganesh", "ganesh630926@gmail.com", "Password123!", "Ganesh User");
        User alex = seedUser("alex_dev", "alex@codesync.dev", "Password123!", "Alex Developer");
        seedUser("sam_coder", "sam@codesync.dev", "Password123!", "Sam Coder");

        seedDemoRoom(ganesh != null ? ganesh : alex);
    }

    private User seedUser(String username, String email, String rawPassword, String fullName) {
        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> existingUserOpt = userRepository.findByEmail(normalizedEmail);

        if (existingUserOpt.isEmpty()) {
            User newUser = User.builder()
                    .username(username)
                    .email(normalizedEmail)
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .fullName(fullName)
                    .active(true)
                    .build();
            User saved = userRepository.save(newUser);
            log.info("Initialized default seed user: {} ({}) with valid BCrypt password", username, normalizedEmail);
            return saved;
        } else {
            User existing = existingUserOpt.get();
            // Ensure password hash is valid BCrypt and matches the standard test password
            if (!passwordEncoder.matches(rawPassword, existing.getPasswordHash())) {
                existing.setPasswordHash(passwordEncoder.encode(rawPassword));
                existing.setActive(true);
                userRepository.save(existing);
                log.info("Updated password hash for user {} to match seed password", normalizedEmail);
            }
            return existing;
        }
    }

    private void seedDemoRoom(User owner) {
        if (owner == null) return;

        if (roomRepository.count() == 0) {
            Room demoRoom = Room.builder()
                    .name("General Collaboration Room")
                    .description("Real-time collaborative coding workspace")
                    .accessCode("CS1001")
                    .language("JAVASCRIPT")
                    .isPrivate(false)
                    .maxMembers(10)
                    .active(true)
                    .build();

            Room savedRoom = roomRepository.save(demoRoom);

            RoomMember member = RoomMember.builder()
                    .room(savedRoom)
                    .user(owner)
                    .role(RoomRole.OWNER)
                    .build();
            roomMemberRepository.save(member);
            savedRoom.addMember(member);

            CodeDocument document = CodeDocument.builder()
                    .room(savedRoom)
                    .content("// Welcome to CodeSync!\n// Start typing to collaborate in real-time.\n\nfunction helloCodeSync() {\n  console.log('Real-time operational collaboration active!');\n}\n\nhelloCodeSync();\n")
                    .language("JAVASCRIPT")
                    .version(1L)
                    .lastModifiedBy(owner.getId())
                    .build();
            codeDocumentRepository.save(document);
            savedRoom.setDocument(document);

            log.info("Initialized demo room '{}' with accessCode CS1001", savedRoom.getName());
        }
    }
}
