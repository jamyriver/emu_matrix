<div align="center">

# EMU_Matrix

**Cloud Retro Game Platform — Play Classic Games in Your Browser**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.3-green.svg)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)

English | [中文](README.md)

</div>

---

## Overview

EMU_Matrix is a cloud-based retro game platform built with a microservices architecture. It supports running ROM games from classic platforms including FC/NES, Sega Genesis/MD, Super Nintendo/SFC, Game Boy/GBC, and Game Boy Advance directly in the browser. The project is developed with a full-stack TypeScript approach, integrates EmulatorJS emulator cores, and provides features such as cloud saves, screenshots, recordings, and multiplayer connectivity — making classic games accessible anywhere.

## Key Features

### 🎮 Multi-Platform Game Support

| Platform | Emulator Core | ROM Formats | Native Resolution |
|----------|--------------|-------------|-------------------|
| FC / NES | fceumm | .nes | 256×240 |
| Sega Genesis / MD | genesis_plus_gx | .md, .gen, .smd, .bin | 320×224 |
| Super Nintendo / SFC | snes9x | .sfc, .smc | 256×224 |
| Game Boy / GBC | gambatte | .gb, .gbc | 160×144 |
| Game Boy Advance | mgba | .gba | 240×160 |

### 💾 Cloud Save System
- Up to 5 manual save slots + 1 auto-save slot
- Auto-save every 60 seconds to prevent progress loss
- Cross-device sync — continue your game anywhere

### 📸 Screenshots & Recordings
- One-click screenshot capture with cloud upload
- Game recording support (up to 30 minutes)
- Public/private sharing settings

### 🌐 Multiplayer
- Real-time signaling via WebSocket
- WebRTC peer-to-peer connections for low-latency gameplay
- Room code invitation system for quick matchmaking

### 📱 Mobile Support
- Automatic touch device detection with virtual button overlay
- Platform-specific button mappings (D-Pad, A/B, L/R, Start/Select)
- Responsive layout adapting to various screen sizes

### 🔐 Authentication
- JWT dual-token authentication (Access Token + Refresh Token)
- Password hashing with bcrypt
- Login rate limiting to prevent brute-force attacks

## System Architecture

```
┌─────────────┐     ┌──────────────┐
│   Frontend  │────▶│ API Gateway  │ :3000
│  (Vue 3)    │     │  (Express)   │
│  :80        │     └──────┬───────┘
└──────┬──────┘            │
       │                   ├──────────────┬──────────────┬──────────────┐
       │                   ▼              ▼              ▼              ▼
       │            ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
       │            │  Auth    │   │  Game    │   │  Save    │   │  Media   │
       │            │ Service  │   │ Service  │   │ Service  │   │ Service  │
       │            │  :3001   │   │  :3002   │   │  :3003   │   │  :3004   │
       │            └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
       │                 │              │              │              │
       │                 ▼              ▼              ▼              ▼
       │            ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
       │            │PostgreSQL│   │  Redis   │   │  MinIO   │   │  Redis   │
       │            │   :5432  │   │  :6379   │   │  :9000   │   │  :6379   │
       │            └──────────┘   └──────────┘   └──────────┘   └──────────┘
       │
       ├─────────────┐
       │  WebSocket  │
       │  Service    │ :3005
       │ (Socket.IO) │
       └─────────────┘
```

### Microservices

| Service | Port | Responsibility |
|---------|------|----------------|
| **Frontend** | 80 | Vue 3 SPA, served by Nginx |
| **API Gateway** | 3000 | Unified entry point, routing, rate limiting |
| **Auth Service** | 3001 | User registration/login, JWT token management |
| **Game Service** | 3002 | Game listing, ROM management, platform validation |
| **Save Service** | 3003 | Cloud save CRUD, save slot management |
| **Media Service** | 3004 | Screenshot/recording upload, MinIO object storage |
| **WS Service** | 3005 | WebSocket signaling, room management, WebRTC relay |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Vue 3 + TypeScript + Vite |
| State Management | Pinia |
| Routing | Vue Router 4 |
| UI Styling | Tailwind CSS |
| HTTP Client | Axios |
| Real-time Communication | Socket.IO Client |
| Backend Framework | Express + TypeScript |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Object Storage | MinIO |
| Emulator | EmulatorJS |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Containerization | Docker + Docker Compose |
| Package Management | npm workspaces |

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** >= 20.10 (deployment mode)
- **Docker Compose** >= 2.0 (deployment mode)
- **PostgreSQL** >= 15 (local development)
- **Redis** >= 7 (local development)

## Installation & Setup

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**

```bash
git clone https://github.com/jamyriver/emu_matrix.git
cd emu_matrix
```

2. **Configure environment variables**

```bash
cp .env.example .env
```

Edit the `.env` file and update the following critical settings:

```env
JWT_ACCESS_SECRET=your-secure-access-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret
```

3. **Start all services**

```bash
docker-compose up -d
```

4. **Access the application**

- Frontend: http://localhost
- API Gateway: http://localhost:3000/health
- MinIO Console: http://localhost:9001

### Option 2: Local Development

1. **Clone and install dependencies**

```bash
git clone https://github.com/jamyriver/emu_matrix.git
cd emu_matrix
npm install
```

2. **Start infrastructure**

Ensure PostgreSQL and Redis are running, then create the database:

```bash
createdb -U postgres retro_cloudgame
psql -U postgres -d retro_cloudgame -f database/migrations/001_init.sql
psql -U postgres -d retro_cloudgame -f database/migrations/002_seed_games.sql
psql -U postgres -d retro_cloudgame -f database/migrations/003_add_gb_gba_games.sql
```

3. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your local database and Redis connection details
```

4. **Build the shared package**

```bash
npm run build:shared
```

5. **Start services (in separate terminals)**

```bash
# Terminal 1 - Auth Service
npm run dev:auth

# Terminal 2 - Game Service
npm run dev:game

# Terminal 3 - Save Service
npm run dev:save

# Terminal 4 - Media Service
npm run dev:media

# Terminal 5 - API Gateway
npm run dev:gateway

# Terminal 6 - WebSocket Service
npm run dev:ws

# Terminal 7 - Frontend
npm run dev:frontend
```

6. **Access the development server**

- Frontend: http://localhost:5173
- API Gateway: http://localhost:3000

## Project Structure

```
EMU_Matrix/
├── database/
│   └── migrations/           # Database migration scripts
│       ├── 001_init.sql      # Base table schema
│       ├── 002_seed_games.sql # NES/MD/SNES seed games
│       └── 003_add_gb_gba_games.sql # GB/GBA seed games
├── packages/
│   ├── shared/               # Shared types, constants, utilities
│   │   └── src/
│   │       ├── types.ts      # TypeScript type definitions
│   │       ├── constants.ts  # Platform configs, core mappings
│   │       └── utils.ts      # ROM validation, format detection
│   ├── frontend/             # Vue 3 frontend application
│   │   └── src/
│   │       ├── api/          # API request wrappers
│   │       ├── views/        # Page components
│   │       │   ├── auth/     # Login/Register
│   │       │   ├── game/     # Lobby/Game Room
│   │       │   └── user/     # Profile/Saves/Screenshots/Recordings
│   │       ├── stores/       # Pinia state management
│   │       └── router/       # Route configuration
│   ├── auth-service/         # Authentication microservice
│   ├── game-service/         # Game microservice
│   ├── save-service/         # Save microservice
│   ├── media-service/        # Media microservice
│   ├── gateway/              # API Gateway
│   └── ws-service/           # WebSocket signaling service
├── docker-compose.yml        # Docker Compose configuration
├── .env.example              # Environment variable template
└── package.json              # Workspace root configuration
```

## API Overview

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |

### Games

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/games` | Game list (pagination, platform filter, search) |
| GET | `/api/games/:id` | Game details |
| GET | `/api/games/:id/rom` | Get ROM download URL |
| POST | `/api/games/:id/favorite` | Toggle favorite |

### Saves

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/saves` | User save list |
| GET | `/api/saves/:id` | Save details |
| POST | `/api/saves` | Create save |
| DELETE | `/api/saves/:id` | Delete save |

### Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/screenshots` | Upload screenshot |
| GET | `/api/screenshots` | Screenshot list |
| POST | `/api/recordings` | Upload recording |
| GET | `/api/recordings` | Recording list |

## Common Commands

```bash
# Build all packages
npm run build

# Build a specific package
npm run build:shared
npm run build:frontend
npm run build:auth

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## FAQ

### Q: Database connection fails when starting Docker?

Ensure the PostgreSQL container is fully started. The `docker-compose.yml` includes `healthcheck` configurations, and services will wait for the database to be ready. If issues persist, check the logs:

```bash
docker-compose logs postgres
docker-compose logs auth-service
```

### Q: Frontend cannot connect to the backend API?

Verify the API Gateway is running by visiting http://localhost:3000/health. In local development mode, ensure all backend services are started and the port configurations in `.env` match the actual running ports.

### Q: How do I upload ROM files?

ROM files must be placed in the `emu-matrix` bucket in MinIO object storage. You can upload them via the MinIO Console (http://localhost:9001, default credentials: `minioadmin` / `minioadmin`), then configure the corresponding `rom_url` in the `games` database table.

### Q: Which gamepads are supported?

EMU_Matrix supports any gamepad compatible with the standard HTML5 Gamepad API. EmulatorJS will automatically recognize connected gamepads in the browser. Xbox or PlayStation compatible controllers are recommended.

### Q: How does multiplayer work?

1. One player creates a room and receives a 6-character room code
2. Another player joins by entering the room code
3. The system establishes a WebRTC peer-to-peer connection via WebSocket signaling
4. Game inputs are synchronized in real-time through WebRTC

### Q: How do I add support for a new platform?

1. Extend the `Platform` type in `packages/shared/src/types.ts`
2. Add platform configuration in `packages/shared/src/constants.ts` (core mapping, ROM extensions, magic byte signatures, etc.)
3. Update ROM validation logic in `packages/shared/src/utils.ts`
4. Add a corresponding database migration script
5. Add platform badge styles in the frontend `GameRoomView.vue`

## Contributing

Contributions to EMU_Matrix are welcome! Please follow this workflow:

1. **Fork** this repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push the branch: `git push origin feature/your-feature-name`
5. Submit a **Pull Request**

### Development Guidelines

- Use TypeScript throughout to ensure type safety
- Follow existing code style and naming conventions
- Write unit tests for new features
- Run `npm run typecheck` and `npm run lint` before committing to ensure code quality
- Use clear and concise English descriptions for commit messages

### Bug Reports

If you find a bug, please submit it via [GitHub Issues](https://github.com/jamyriver/emu_matrix/issues) and include:

- Problem description and steps to reproduce
- Expected behavior vs. actual behavior
- Environment details (OS, browser, Node.js version)
- Relevant logs or screenshots

## License

This project is licensed under the [MIT License](LICENSE).

Copyright (c) 2026 jamyriver
