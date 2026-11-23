-- ====================================================================
-- CodeSync: Real-Time Collaborative Coding Platform
-- Database Schema for MySQL 8+
-- Foundation Entities: User, Room, RoomMember, CodeDocument
-- ====================================================================

CREATE DATABASE IF NOT EXISTS codesync
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE codesync;

-- Disable foreign key checks for clean teardown/setup
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS code_documents;
DROP TABLE IF EXISTS room_members;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------------------
-- 1. Table: users
-- Represents platform registered users
-- --------------------------------------------------------------------
CREATE TABLE users (
    id CHAR(36) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Table: rooms
-- Represents collaborative coding rooms
-- --------------------------------------------------------------------
CREATE TABLE rooms (
    id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    access_code VARCHAR(6) NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'JAVASCRIPT',
    is_private TINYINT(1) NOT NULL DEFAULT 0,
    max_members INT NOT NULL DEFAULT 10,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_rooms PRIMARY KEY (id),
    CONSTRAINT uk_rooms_access_code UNIQUE (access_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_room_access_code ON rooms (access_code);
CREATE INDEX idx_room_active ON rooms (is_active);

-- --------------------------------------------------------------------
-- 3. Table: room_members
-- Represents room membership and permission role (OWNER, EDITOR, VIEWER)
-- --------------------------------------------------------------------
CREATE TABLE room_members (
    id CHAR(36) NOT NULL,
    room_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'EDITOR',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_room_members PRIMARY KEY (id),
    CONSTRAINT fk_room_members_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_room_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_room_user UNIQUE (room_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_room_members_room ON room_members (room_id);
CREATE INDEX idx_room_members_user ON room_members (user_id);

-- --------------------------------------------------------------------
-- 4. Table: code_documents
-- Represents the shared code editor buffer attached to a room
-- --------------------------------------------------------------------
CREATE TABLE code_documents (
    id CHAR(36) NOT NULL,
    room_id CHAR(36) NOT NULL,
    content LONGTEXT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'JAVASCRIPT',
    version BIGINT NOT NULL DEFAULT 0,
    last_modified_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_modified_by CHAR(36) NULL,
    CONSTRAINT pk_code_documents PRIMARY KEY (id),
    CONSTRAINT uk_code_documents_room UNIQUE (room_id),
    CONSTRAINT fk_code_documents_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
    CONSTRAINT fk_code_documents_user FOREIGN KEY (last_modified_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_document_room_id ON code_documents (room_id);

-- --------------------------------------------------------------------
-- Initial Development Seed Data
-- Note: Passwords must always be hashed with BCrypt ($2a$10$...). Plaintext passwords will be rejected by Spring Security.
-- Below is a BCrypt hash for development/demo testing purposes only.
-- In production, register users via /api/auth/register with unique strong credentials.
-- --------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, full_name, is_active, created_at)
VALUES 
('11111111-1111-1111-1111-111111111111', 'alex_dev', 'alex@codesync.dev', '$2a$10$e0MYzXyjpJS7Pd0RVvHwHeFjKN.UtE8A7ea3Z1CNO8JyQ2b.EPe42', 'Alex Developer', 1, NOW()),
('22222222-2222-2222-2222-222222222222', 'sam_coder', 'sam@codesync.dev', '$2a$10$e0MYzXyjpJS7Pd0RVvHwHeFjKN.UtE8A7ea3Z1CNO8JyQ2b.EPe42', 'Sam Coder', 1, NOW());

INSERT INTO rooms (id, name, description, access_code, language, is_private, max_members, is_active, created_at)
VALUES 
('33333333-3333-3333-3333-333333333333', 'Java Algorithms Workshop', 'Collaborative coding algorithms room', 'ALGO01', 'JAVA', 0, 10, 1, NOW());

INSERT INTO room_members (id, room_id, user_id, role, joined_at)
VALUES 
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'OWNER', NOW()),
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'EDITOR', NOW());

INSERT INTO code_documents (id, room_id, content, language, version, last_modified_at, last_modified_by)
VALUES 
('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 
'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Welcome to CodeSync!");\n    }\n}\n', 
'JAVA', 1, NOW(), '11111111-1111-1111-1111-111111111111');
