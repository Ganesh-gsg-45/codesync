# CodeSync – Real-Time Collaborative Coding Platform

> **Final Year B.Tech Capstone Project · Computer Science & Artificial Intelligence / Machine Learning**

[![Java](https://img.shields.io/badge/Java-21-007396?logo=java)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![Spring Security](https://img.shields.io/badge/Spring%20Security-6.x-6DB33F?logo=springsecurity)](https://spring.io/projects/spring-security)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![Monaco Editor](https://img.shields.io/badge/Monaco%20Editor-0.46-1E1E1E?logo=visualstudiocode)](https://microsoft.github.io/monaco-editor/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📖 Overview

**CodeSync** is a production-grade, real-time collaborative coding platform designed for distributed software development and peer programming. Built on **Spring Boot 3 (Java 21)** and **React 18 (Vite)**, it provides instant sub-15ms code synchronization, multi-cursor presence, role-based room governance, and an IDE-grade user experience directly in the web browser.

CodeSync decouples real-time communication from concurrency control: WebSockets over STOMP handle live message distribution and presence tracking, while an authoritative document revision model prevents state divergence.

---

## ✨ Core Capabilities

| Capability | Technical Details |
|---|---|
| ⚡ **Real-Time Collaboration** | High-throughput STOMP over WebSockets with SockJS fallback and automatic heartbeat reconnection. |
| 🖥️ **Monaco Code Editor** | VS Code editing engine with syntax highlighting for 13+ languages, configurable themes, font sizing, and bracket colorization. |
| 📍 **Live Multi-Cursor Presence** | Monaco `deltaDecorations` display colored remote cursors and developer nametags in real time. |
| 🛡️ **JWT Security & Passwords** | Stateless HMAC-SHA256 JWT authorization filter chain with BCrypt salted password hashing. |
| 👥 **Granular Room RBAC** | Role governance: `OWNER` (full room control), `EDITOR` (read/write access), and `VIEWER` (enforced client & server read-only). |
| 🚪 **Workspace Room Management** | Create public or private workspaces with 6-character access codes and member limits. |
| 📊 **Telemetry & Activity Feed** | Real-time workspace statistics, language distribution analytics, and chronological event logging. |
| 🚀 **Runnable Starter Templates** | Clean, runnable code templates initialized automatically based on selected language (Python, JS, TS, Java, C++, Go, Rust, HTML). |

---

## 🛠 Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                   React 18 + Vite Web Application                      │
│   Monaco Editor · Tailwind CSS · STOMP.js · SockJS · Axios             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / WebSocket (:5173 / :8080)
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Spring Boot 3.2 Backend Service                       │
│                                                                        │
│  ┌───────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ Security & Auth Layer │  │     Workspace & Room Management      │  │
│  │ JWT Provider + BCrypt │  │   RoomController / RoomService       │  │
│  └───────────────────────┘  └──────────────────────────────────────┘  │
│  ┌───────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  WebSocket Controller │  │    Document Revision & Sync Engine   │  │
│  │  STOMP Message Broker │  │   CodeDocument / Revision Control    │  │
│  └───────────────────────┘  └──────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ JPA / Hibernate
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Persistence Data Store                              │
│   H2 File Storage (Dev: ./data/codesync) · MySQL 8.0+ (Production)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Matrix

- **Backend:** Java 21, Spring Boot 3.2.5, Spring Security 6, Spring WebSocket (STOMP), Spring Data JPA, JJWT 0.12.5, Lombok.
- **Frontend:** React 18.2, Vite 5.4, Monaco Editor (`@monaco-editor/react`), `@stomp/stompjs`, `sockjs-client`, Tailwind CSS 3.4, React Router 6, React Hot Toast, React Icons.
- **Database:** Persistent file-based H2 (default for zero-configuration instant local development) / MySQL 8.0+.

---

## 📁 Repository Structure

```
codesync/
├── backend/
│   ├── pom.xml                               # Maven project configuration
│   ├── data/                                 # Persistent file database store
│   └── src/
│       ├── main/java/com/codesync/
│       │   ├── CodeSyncApplication.java      # Application entrypoint
│       │   ├── auth/                         # JWT authentication, filters & DTOs
│       │   ├── config/                       # SecurityConfig, WebSocketConfig
│       │   ├── document/                     # Document entity & revision repository
│       │   ├── room/                         # Room entity, RoomMember, RoomController
│       │   ├── user/                         # User entity & UserRepository
│       │   └── websocket/                    # WebSocketController, SessionManager
│       └── main/resources/
│           ├── application.yml               # Base application configuration
│           └── application-dev.yml           # Dev profile (persistent file-based H2)
└── frontend/
    ├── package.json                          # Node dependencies and scripts
    ├── vite.config.js                        # Vite bundler & reverse proxy configuration
    ├── index.html                            # Root HTML template
    └── src/
        ├── App.jsx                           # Application router & protected routes
        ├── components/
        │   ├── common/                       # Modal, Button, Input, Badge, EmptyState
        │   ├── dashboard/                    # Sidebar, StatCard, LanguageDistribution
        │   ├── editor/                       # MonacoEditor, CursorMarker, ParticipantList
        │   └── room/                         # RoomCard, CreateRoomModal, JoinRoomModal
        ├── context/                          # AuthContext, EditorContext
        ├── hooks/                            # useWebSocket, useOT
        ├── pages/                            # LandingPage, LoginPage, RegisterPage, DashboardPage, EditorPage
        └── services/                         # api (Axios client), websocket (STOMP service)
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Java Development Kit (JDK):** Version 21 or later.
- **Node.js:** Version 18 or later.
- **Build Tools:** Maven 3.9+ (or included Maven binary) and `npm`.

### 1. Start the Backend Server

```bash
cd backend

# Build and package backend JAR (skipping test suite during initial package)
mvn clean package -DskipTests

# Run Spring Boot with the dev profile
java -jar target/codesync-backend-1.0.0-SNAPSHOT.jar --spring.profiles.active=dev
```
> The Spring Boot backend starts on **`http://localhost:8080`**.
> Data is saved persistently to `./backend/data/codesync.mv.db`.

### 2. Start the Frontend Application

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
> The React frontend is accessible at **`http://localhost:5173`**.

---

## 📡 REST API Reference

### Authentication Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account; returns JWT + user profile |
| `POST` | `/api/auth/login` | Public | Authenticate with email/password; returns JWT access/refresh tokens |
| `POST` | `/api/auth/refresh` | Public | Refresh expired access token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve profile of the currently logged-in developer |

### Workspace & Room Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/rooms` | Authenticated | Create a collaborative room with starter code |
| `GET` | `/api/rooms` | Authenticated | List all active public workspaces |
| `GET` | `/api/rooms/my` | Authenticated | List workspaces owned or joined by the current user |
| `GET` | `/api/rooms/stats` | Authenticated | Get workspace statistics, member counts & language distribution |
| `GET` | `/api/rooms/{id}` | Authenticated | Retrieve room metadata and participant roster |
| `POST` | `/api/rooms/join` | Authenticated | Join a private/public workspace by 6-character access code |
| `POST` | `/api/rooms/{id}/leave` | Authenticated | Leave a collaborative workspace |
| `PUT` | `/api/rooms/{id}` | Owner | Update room name, description, or programming language |
| `DELETE` | `/api/rooms/{id}` | Owner | Permanently archive/delete a workspace |
| `GET` | `/api/rooms/{id}/members` | Authenticated | List members of a workspace |
| `PUT` | `/api/rooms/{id}/members/{userId}/role` | Owner | Promote or demote member (`OWNER`, `EDITOR`, `VIEWER`) |
| `DELETE` | `/api/rooms/{id}/members/{userId}` | Owner | Kick a member from the workspace |

### Document Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/editor/{roomId}/content` | Member | Fetch authoritative document text and revision number |
| `POST` | `/api/editor/{roomId}/content` | Editor/Owner | Persist latest editor buffer to storage |
| `GET` | `/api/editor/{roomId}/history` | Member | Retrieve operation history logs |
| `POST` | `/api/editor/{roomId}/revert` | Owner | Revert document to a previous revision number |
| `GET` | `/api/health` | Public | Health and uptime telemetry |

---

## 🔌 WebSocket STOMP Protocol

Clients connect via SockJS to `ws://localhost:8080/ws` with `Authorization: Bearer <token>`.

### Client Destinations (Send)
- `/app/editor.join`: Announce entry into a collaborative room (`roomId`, `userId`).
- `/app/editor.operation`: Broadcast a document edit (`roomId`, `content`, `revision`).
- `/app/editor.cursor`: Transmit live cursor coordinates (`roomId`, `line`, `column`).
- `/app/editor.leave`: Explicitly announce departure from a workspace.
- `/app/editor.sync`: Request the latest authoritative document state.

### Topic Subscriptions (Receive)
- `/topic/room/{roomId}`: Receives document synchronization messages and live edit broadcasts.
- `/topic/room/{roomId}/presence`: Receives `JOIN`, `LEAVE`, and active collaborator roster updates.
- `/topic/room/{roomId}/cursors`: Receives peer cursor position updates for remote visual markers.
- `/user/queue/reply`: Receives private direct responses and state snapshots.

---

## 🧪 Testing Suite

### Run Backend Unit & Integration Tests
```bash
cd backend
mvn test
```
*Executes test coverage across `AuthServiceTest`, `RoomServiceTest`, `UserServiceTest`, `HealthControllerTest`, and `CollaborationServiceTest`.*

### Verify Frontend Production Build
```bash
cd frontend
npm run build
```
*Validates module bundling, asset optimization, and TypeScript/ESLint compliance.*

---

## 💻 Recommended Testing Workflow

1. Open **`http://localhost:5173/login`** in Google Chrome.
2. Sign in with the default developer account:
   - **Email:** `ganesh630926@gmail.com`
   - **Password:** `Password123!`
3. Navigate to the **Dashboard** to view platform metrics, language distributions, and workspace cards.
4. Click **New Room**, choose a language (e.g., Python), and click **Create Room**.
5. Observe the IDE:
   - Left panel: Project explorer and live collaborators.
   - Center: Monaco Editor initialized with language starter code.
   - Right panel: Workspace details and real-time activity stream.
   - Bottom status bar: WebSocket connection indicator, revision counter, and cursor coordinates.
6. Open an incognito window, log in with another account, join using the 6-character access code, and observe simultaneous typing and live multi-cursor updates.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
CodeSync – Final Year B.Tech Capstone Project.
