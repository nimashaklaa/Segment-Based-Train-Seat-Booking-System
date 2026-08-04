# Segment-Based Train Seat Booking System

A booking system for Sri Lanka's Colombo Fort–Badulla line that allows a single reserved seat to be independently booked by multiple passengers for non-overlapping legs of the same journey — each charged only for the distance they travel.

---

## Key Highlights

| # | What was built | Why it matters |
|---|---|---|
| **1** | **Segment-based occupancy** — half-open integer intervals `[board, alight)` per seat per journey | One physical seat can be sold to multiple passengers on non-overlapping legs; no seat sits empty unnecessarily |
| **2** | **PostgreSQL EXCLUSION constraint** for double-booking prevention | Concurrent INSERT attempts are serialized at the database level — no application locks, no race conditions, guaranteed correct |
| **3** | **Seat map visualization** with real-time 5-second refresh | Passengers see live availability colour-coded per seat; stale data from concurrent users is reflected without a page reload |
| **4** | **Waitlisting** with automatic email notification | If a booking conflict occurs at checkout, the passenger can join a waitlist and is notified automatically on cancellation |
| **5** | **Admin panel** (JWT-protected) with live occupancy & revenue dashboard | Gives the department visibility into seat utilization and earnings across all active journeys |
| **6** | **Fully configurable** — stations, coaches, seats per coach, fare rate, class multipliers | No hardcoded magic numbers; the department can extend the route or add coaches without code changes |
| **7** | **One-command setup** via Docker Compose | Runs from a clean machine with `docker compose up --build`; migrations, seeding, backend, frontend, and MailHog all start automatically |
| **8** | **Distance-based fare with coach-class multiplier** | Passengers pay only for the km they travel; First Class / Second Class multipliers are stored per coach type and configurable |

---

## Entity-Relationship Diagram

![ER Diagram](images/schedule.drawio.png)

---

## The Problem

Sri Lanka Railways' reserved coaches are frequently under-occupied. A seat booked Colombo Fort → Kandy sits empty Kandy → Badulla, because the current system can't resell it once the train departs. To compensate, the department prices reserved seats at a premium — passengers pay for dead legs they don't use. This system removes that constraint.

> **Core insight:** The pricing premium exists solely because seats can't be resold mid-journey. By making segments independently bookable, the department can reduce fares to reflect actual distance travelled and recover lost revenue from seats that previously went empty.

---

## Running the Project

**Prerequisites:** Docker and Docker Compose installed.

```bash
git clone https://github.com/nimashaklaa/Segment-Based-Train-Seat-Booking-System
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

## Booking Flow

This is the end-to-end journey a passenger takes from the home page to a confirmed ticket.

### Step 1 — Search

On the home page the passenger selects:
- **From** station (e.g. Colombo Fort)
- **To** station (e.g. Kandy)
- **Date** of travel
- **Number of passengers**

Clicking **Search** navigates to the availability page.

### Step 2 — Select a Train

The availability page shows all journeys running on that date that call at both stations in the correct order. Each row shows the train name, number, departure time, and whether seats are available. The passenger clicks **Select** on their preferred train.

### Step 3 — Select a Class

Below the train list, the system shows coach classes available on that train (e.g. First Class, Second Class, Observation Saloon). For each class it displays the number of available seats and the fare per seat for the chosen segment. The passenger clicks **Book** on their preferred class.

### Step 4 — Pick a Seat

The passenger is taken to the seat selection page. The seat map shows every seat in the chosen coach colour-coded:

| Colour | Meaning |
|---|---|
| White | Available for this segment |
| Blue | Selected by you |
| Gray | Already booked for an overlapping segment |

The passenger clicks one or more seats (up to the number of passengers searched) and sees the total fare update in real time. The seat map refreshes automatically every 5 seconds so stale availability from other concurrent users is reflected without a page reload.

### Step 5 — Enter Details and Confirm

The passenger fills in their name and email address and clicks **Confirm Booking**. The backend attempts to INSERT the booking inside a PostgreSQL EXCLUSION constraint — if two people click at the same moment, exactly one succeeds and the other receives a `409 Conflict` response.

On success:
- The booking is confirmed and a **confirmation email** is sent to the passenger's address (visible in MailHog at `http://localhost:8025`).
- The passenger receives a booking reference ID.

On conflict (seat taken at the last moment):
- An amber warning is shown.
- The passenger can click **Join Waitlist** — their email is saved and they will be notified automatically if the seat becomes free through a cancellation.

> **No double-booking is possible.** The EXCLUSION constraint is enforced at the database level — even under the highest concurrency, exactly one booking wins per seat per segment.

### Step 6 — View or Cancel a Booking

From **My Ticket** in the header, the passenger enters their booking reference ID and email to retrieve their booking details. They can also cancel from this page, which frees the seat and triggers an automatic waitlist notification to the next person in the queue.

---

## Admin Panel

The admin panel is not linked from the public site. Navigate directly to:

```
http://localhost:5173/admin
```

Log in with the credentials set in your `.env` file:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin      ← change this to something strong
```

> The admin panel issues a signed JWT on login. The token is valid for 8 hours. All `/admin/*` API routes require this token — they return `401 Unauthorized` without it.

Once logged in, the admin panel provides:

| Tab | What you can do |
|---|---|
| **Dashboard** | Live seat occupancy and revenue across all active journeys |
| **Stations** | Add or rename stations on the Colombo Fort–Badulla line |
| **Routes** | Define or edit route segments between station pairs |
| **Schedules** | Create recurring train schedules (train name, number, departure time) |
| **Journeys** | Instantiate a schedule into a specific date's run; update journey status (scheduled / departed / cancelled) |
| **Coaches** | Add coaches to a train, set coach type (class), manage seating capacity |

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

> **This is the hardest correctness problem in the system.** Two passengers booking the same seat for the same segment at the exact same millisecond must not both succeed.

The solution is a **database-level EXCLUSION constraint** using PostgreSQL's native range types:

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