# Segment-Based Train Seat Booking System

A booking system for Sri Lanka's Colombo Fort–Badulla line that allows a single reserved seat to be independently booked by multiple passengers for non-overlapping legs of the same journey — each charged only for the distance they travel.

---

## Entity-Relationship Diagram

![ER Diagram](images/schedule.drawio.png)

---

## The Problem

Sri Lanka Railways' reserved coaches are frequently under-occupied. A seat booked Colombo Fort → Kandy sits empty Kandy → Badulla, because the current system can't resell it once the train departs. To compensate, the department prices reserved seats at a premium — passengers pay for dead legs they don't use. This system removes that constraint.

---

## Running the Project

**Prerequisites:** Docker and Docker Compose installed.

```bash
git clone <repo-url>
cd segment-based-train-seat

cp .env.example .env

docker compose up --build
```

That's it. Docker Compose will:
1. Start PostgreSQL and wait until it is healthy
2. Run all 11 database migrations automatically
3. Seed stations, coach types, coaches, seats, and a sample schedule
4. Start the Go backend on port 3000
5. Start the React frontend served via Nginx on port 5173

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| MailHog (email preview) | http://localhost:8025 |

> Booking confirmation emails and waitlist notifications are delivered to MailHog locally — no real SMTP credentials required.

---

## Core Design Decisions

### 1. Segment Occupancy Model

Every booking holds a **half-open integer interval** `[board_sequence, alight_sequence)` on a specific seat within a specific journey. Stations have a `sequence_order` (Colombo Fort = 1, …, Badulla = 16). Two bookings conflict if their intervals overlap:

```
A conflicts with B if: A.board_sequence < B.alight_sequence
                   AND A.alight_sequence > B.board_sequence
```

Half-open ranges make adjacent segments work correctly by design: `[1, 7)` and `[7, 16)` do not overlap — Passenger A disembarks at Kandy (7) exactly as Passenger B boards. No special edge-case handling needed.

### 2. Concurrency — PostgreSQL EXCLUSION Constraint

The hardest problem is guaranteeing no double-bookings when two requests arrive simultaneously. The solution is a **database-level EXCLUSION constraint** using PostgreSQL's native range types:

```sql
CONSTRAINT no_overlapping_seat_bookings EXCLUDE USING gist (
    journey_id    WITH =,
    seat_id       WITH =,
    station_range WITH &&
) WHERE (status = 'CONFIRMED')
```

`station_range` is a generated stored column (`int4range(board_sequence, alight_sequence, '[)')`). The database computes and maintains it automatically.

When two concurrent requests try to book overlapping segments on the same seat, the database serializes them atomically — one INSERT succeeds, the other receives a constraint violation (PostgreSQL error code `23505`). The application catches this and returns `409 Conflict`. No application-level locks, no retry loops, no race conditions.

**Why not application-level locking?** It requires a lock table, careful transaction management, and still has failure modes under network partitions. The EXCLUSION constraint is simpler, faster, and guaranteed correct.

**Why not MySQL?** MySQL has no native EXCLUSION constraint. The overlap check would have to live entirely in application code with explicit locks — more complex and less safe. This is the primary reason PostgreSQL was chosen.

### 3. Schedule vs Journey Separation

`TRAIN_SCHEDULE` holds the recurring pattern (train number, name, departure time). `TRAIN_JOURNEY` is one specific date's run. A single schedule row generates a journey per operating day without data duplication, and the EXCLUSION constraint is correctly scoped per journey — the same physical seat can be booked independently across different dates.

### 4. Fare Calculation

```
fare = (distance_km[alight] − distance_km[board]) × rate_per_km × coach_type_multiplier
```

- `rate_per_km` is a configurable environment variable (default LKR 2.50)
- `coach_type_multiplier` is stored per coach type (e.g. First Class = 1.8, Second Class = 1.2, Unreserved = 1.0)

The fare logic is isolated in the service layer so it can be extended to a fare matrix or time-of-day rates without touching booking logic.

### 5. Configurability

Stations, coaches, seats per coach, fare rate, and coach type multipliers are all seeded from configuration — no magic numbers in code. The department can extend the route, add coaches, or adjust fares via admin CRUD endpoints or config changes without code changes.

---

## Alternatives Considered

| Decision | Chosen | Alternatives considered |
|---|---|---|
| Backend | Go + Chi | NestJS, ASP.NET Core, Django, Spring Boot |
| Query layer | sqlc | GORM, sqlx, raw database/sql |
| Migrations | golang-migrate | Atlas, manual SQL |
| Database | PostgreSQL | MySQL (no EXCLUSION constraints), MongoDB (poor fit) |
| Concurrency | DB EXCLUSION constraint | App-level locking, serializable transactions |
| Frontend | React + Vite + Zustand | Next.js, Vue, Svelte |
| Email (local) | MailHog | Mailtrap, real SMTP |
| Infra | Docker Compose | Kubernetes (overkill), bare metal (not reproducible) |

**Go over NestJS:** Compiled binary, lower memory footprint, simpler deployment. The correctness advantage of shared TypeScript types doesn't outweigh Go's runtime and toolchain benefits for a production-grade API.

**sqlc over GORM:** The overlap query is the heart of the system — sqlc lets you write the exact SQL you intend and generates type-safe Go functions from it. GORM hides the SQL behind an abstraction that makes critical queries harder to audit.

**PostgreSQL over MySQL:** The EXCLUSION constraint is the core correctness mechanism. MySQL doesn't support it.

---

## Project Structure

```
/
├── docker-compose.yml
├── .env.example
├── backend/                        # Go API
│   ├── cmd/
│   │   ├── server/main.go          # HTTP server, router, middleware
│   │   └── seed/main.go            # Standalone seed command
│   ├── internal/
│   │   ├── db/                     # sqlc-generated type-safe query functions
│   │   ├── handler/                # HTTP handlers (thin — delegate to service)
│   │   ├── mailer/                 # SMTP email (booking confirmation, waitlist)
│   │   ├── seed/                   # Seed logic (stations, coaches, seats)
│   │   └── service/                # Business logic (fare, concurrency, waitlist)
│   ├── migrations/                 # 11 SQL migration files (golang-migrate)
│   ├── queries/                    # Raw SQL queries (sqlc source)
│   └── Dockerfile
├── frontend/                       # React + Vite + Tailwind + Zustand
│   ├── src/
│   │   ├── components/
│   │   │   ├── availability/       # Train list, class list, step indicator
│   │   │   └── seat-selection/     # Seat map, booking panel, route timeline
│   │   ├── pages/                  # Home, Availability, SeatSelection, Admin, …
│   │   ├── services/               # API client (typed fetch wrappers)
│   │   ├── stores/                 # Zustand stores
│   │   ├── types/                  # Shared TypeScript interfaces
│   │   └── utils/                  # Fare calculation, time estimation
│   └── Dockerfile
└── README.md
```

---

## Environment Variables

Copy `.env.example` to `.env` before running. Never commit `.env`.

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `password` |
| `POSTGRES_DB` | Database name | `train_booking` |
| `DATABASE_URL` | Full connection string (set by Compose) | derived |
| `FARE_RATE_PER_KM` | Base fare in LKR per km | `2.50` |
| `PORT` | Backend HTTP port | `3000` |
| `SMTP_HOST` | SMTP host for emails | `mailhog` |
| `SMTP_PORT` | SMTP port | `1025` |
| `SMTP_FROM` | Sender address | `noreply@trainbooking.lk` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `changeme` |
| `JWT_SECRET` | Secret key used to sign admin JWT tokens | *(must be set)* |
| `SEED_ON_STARTUP` | Auto-seed on first run | `true` |