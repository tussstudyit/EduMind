# EduMind AI

EduMind AI is a learning platform organized as a separate Next.js frontend and NestJS backend, with PostgreSQL as the backend database.

## Repository structure

```text
frontend/       Next.js web application
backend/        NestJS REST API, CRUD modules, TypeORM entities and migrations
compose.yaml    PostgreSQL, backend, and frontend services
```

## Current implementation

- Frontend screens for students, teachers, and administrators.
- PostgreSQL-backed CRUD APIs for users, subjects, courses, lessons, and enrollments.
- Learning progress API that records lesson completion idempotently.
- AI Tutor conversation and message history APIs powered by `AiEngineService` (supports Google Gemini `@google/genai` Interactions API, OpenAI, Anthropic, Ollama, and EduMind fine-tuned models with course/corpus RAG context).
- Real AI Configuration API (`/api/admin/ai-config`), Multimodal OCR extraction (`/api/ocr/*`), AI Quiz generation & rewriting (`/api/quizzes/ai-generate`, `/api/questions/ai-rewrite`), Adaptive personalized learning recommendations (`/api/recommendations/generate`), and AI Training/Fine-tuning & Knowledge Corpus pipeline (`/api/ai-training/*`).
- PostgreSQL schema is managed with TypeORM migrations.

## Run locally for several devices on the same network

This mode runs the frontend, API, PostgreSQL, and video files on one Windows computer. It does not require a VPS or public deployment.

Install and start Docker Desktop, then run from this repository root:

```bash
docker compose up --build -d
```

On the host computer, open <http://localhost:3000>. To find its local address, run `ipconfig` and use the IPv4 address of the Wi-Fi or Ethernet adapter. On other devices connected to the same Wi-Fi/LAN, open `http://<IPv4-address>:3000` (for example, `http://192.168.1.20:3000`). Do not use `localhost` on another device; that points back to the device itself. If Windows Firewall asks, allow the frontend on the Private network. Guest Wi-Fi with client isolation may block device-to-device access.

The frontend proxies `/api` to the backend inside Docker, so clients use one host and only need the frontend port. The health endpoint is available at `http://<IPv4-address>:3000/api/health`. Keep the host computer and Docker running while other devices use the app. A DHCP reservation in the router can keep the host address stable.

Course videos are stored in the persistent `edumind-course-uploads` Docker volume on the host computer. Playback uses short-lived, access-checked stream links and HTTP byte ranges, so a player can seek without loading the whole video into browser memory. The video still uses host disk and local-network bandwidth. For broad browser support, prepare videos as MP4 with H.264 video and AAC audio; `-movflags +faststart` moves MP4 indexing to the beginning for earlier playback.

To stop the services while preserving PostgreSQL data and uploaded videos:

```bash
docker compose down
```

To reset the local database and remove PostgreSQL data, n8n data, and uploaded videos:

```bash
docker compose down -v
```

## Run services separately

Start PostgreSQL first, using Docker or a local PostgreSQL server. Then:

```bash
cd backend
npm ci
Copy-Item .env.example .env
npm run start:dev
```

In another terminal:

```bash
cd frontend
npm ci
$env:NEXT_PUBLIC_API_URL = "http://localhost:3001/api"
npm run dev
```

The frontend still uses its local mock service for modules that have not yet been connected to backend APIs.

## CRUD API overview

| Resource | Routes |
|---|---|
| Users | `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/:id` |
| Subjects | `GET/POST /api/subjects`, `GET/PATCH/DELETE /api/subjects/:id` |
| Courses | `GET/POST /api/courses`, `GET/PATCH/DELETE /api/courses/:id` |
| Lessons | `GET/POST /api/lessons`, `GET/PATCH/DELETE /api/lessons/:id` |
| Enrollments | `GET/POST /api/enrollments`, `GET/PATCH/DELETE /api/enrollments/:id` |
| Progress | `GET /api/progress?studentId=...&courseId=...`, `POST /api/progress/complete-lesson` |
| AI Tutor history | `GET/POST /api/ai/conversations`, `GET/POST /api/ai/conversations/:id/messages`, rename/archive/delete conversation routes |

See [backend/README.md](backend/README.md) and [backend/docs/BACKEND_HANDOFF.md](backend/docs/BACKEND_HANDOFF.md) for setup and the full domain contract.
