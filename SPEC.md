# Specification: Segment-Based Train Seat Booking System

## 1. Problem Statement

Sri Lanka Railways' Colombo Fort–Badulla line has 3 reserved coaches where seats are frequently
under-occupied for long stretches because a seat booked for a partial journey (e.g. Colombo → Kandy)
cannot be resold once the train departs. This forces the department to charge a premium to cover the
"dead" leg, and leaves revenue on the table.

**Goal:** Allow a single reserved seat to be independently booked by multiple passengers for
non-overlapping legs of the same journey, each paying only for the distance they travel.

---

## 2. Scope

### In Scope
- Segment-based booking for reserved coaches only
- Concurrent booking safety
- Fare calculation per leg
- Seat availability query for a given origin–destination pair
- Booking creation and cancellation
- Frontend: route selection → seat map → booking confirmation
- Admin view: occupancy and revenue
- Waitlisting for fully booked segments

### Out of Scope
- Unreserved coach management (first-come-first-served, no seat assignment)
- Payment processing
- Authentication / user accounts (passenger name + email only)
- Mobile app
- Return journey scheduling (one direction only for now)

---

## 3. Route & Configuration

**Line:** Colombo Fort → Badulla (one direction; return journey is a separate future concern)

**Stations (ordered):**

| Order | Station | Distance from Colombo Fort (km) |
|---|---|---|
| 1 | Colombo Fort | 0 |
| 2 | Maradana | 2 |
| 3 | Rambukkana | 96 |
| 4 | Peradeniya Junction | 121 |
| 5 | Kandy | 125 |
| 6 | Gampola | 137 |
| 7 | Nawalapitiya | 154 |
| 8 | Hatton | 193 |
| 9 | Nanu Oya | 218 |
| 10 | Haputale | 261 |
| 11 | Ohiya | 272 |
| 12 | Ella | 293 |
| 13 | Badulla | 314 |

**Configurable** — stations, coaches, and seats per coach are seeded from config, not hardcoded.
The department can add coaches or extend the route without code changes.

**Coaches:**
- 3 reserved (segment-based booking applies)
- 5 unreserved (out of scope for booking logic; shown as informational)
- Seats per coach: configurable (default: 48)

---

## 4. Data Model

### Station
```
id            UUID
name          string
order         int       ← determines segment ordering
distance_km   float     ← from Colombo Fort; used for fare calculation
```

### Coach
```
id            UUID
number        int       ← coach number on the train
type          enum      RESERVED | UNRESERVED
rows          int
seats_per_row int
```

### Seat
```
id            UUID
coach_id      UUID
seat_number   string    ← e.g. "1A", "1B"
```

### Booking
```
id                UUID
seat_id           UUID
passenger_name    string
passenger_email   string
from_station_id   UUID
to_station_id     UUID
from_order        int    ← denormalized from station.order (for fast range queries)
to_order          int    ← denormalized from station.order (for fast range queries)
fare              decimal
status            enum   CONFIRMED | CANCELLED | WAITLISTED
created_at        timestamp
```

`from_order` and `to_order` are denormalized onto the booking row to make overlap queries fast
and index-friendly — no join needed at query time.

### Waitlist
```
id                UUID
seat_id           UUID
passenger_name    string
passenger_email   string
from_station_id   UUID
to_station_id     UUID
from_order        int
to_order          int
created_at        timestamp
status            enum   PENDING | NOTIFIED | EXPIRED
```

---

## 5. Core Logic

### Segment Overlap

A booking occupies the interval `[from_order, to_order)` on a specific seat.
Two bookings conflict if their intervals overlap:

```
existing.from_order < new.to_order
AND
existing.to_order > new.from_order
```

A seat is available for `[A, B)` if no confirmed booking on that seat satisfies the above.

### Concurrency

**Approach: PostgreSQL EXCLUSION constraint**

```sql
EXCLUDE USING GIST (
  seat_id   WITH =,
  int4range(from_order, to_order) WITH &&
) WHERE (status = 'confirmed')
```

This makes the database the authority on correctness. Concurrent inserts for overlapping segments
are serialized by the DB — one succeeds, the other receives a constraint violation, which the
application catches and returns as a `409 Conflict`. No application-level locking needed.

### Fare Calculation

```
fare = (distance_km[to_station] - distance_km[from_station]) × rate_per_km
```

`rate_per_km` is a configurable constant (environment variable). Can be extended to a fare
matrix or time-of-day pricing later without changing the booking logic.

### Cancellation

Setting `status = CANCELLED` removes the booking from the exclusion constraint's scope
(`WHERE status = 'confirmed'`), immediately freeing that segment for new bookings.
If a waitlist entry exists for an overlapping or identical segment, the passenger is notified
(email, or flagged in the admin view for now).

### Waitlisting

If a booking attempt returns `409 Conflict`, the passenger is offered the option to join a
waitlist for that seat+segment. On cancellation, the system checks for matching waitlist entries
(oldest first) and marks them as `NOTIFIED`. The notified passenger has a time window to complete
their booking before the next waitlisted passenger is notified.

---

## 6. API Design

All endpoints return JSON. Errors follow `{ "error": "message", "code": "ERROR_CODE" }`.

### Public

| Method | Path | Description |
|---|---|---|
| `GET` | `/stations` | Ordered list of all stations |
| `GET` | `/coaches` | All coaches with seat counts |
| `GET` | `/seats/available?from_id=&to_id=` | Seats available for a leg, grouped by coach |
| `POST` | `/bookings` | Create a booking |
| `GET` | `/bookings/:id` | Booking details |
| `DELETE` | `/bookings/:id` | Cancel a booking |
| `POST` | `/waitlist` | Join waitlist for a seat+segment |
| `GET` | `/health` | Health check (for load balancer readiness) |

### Admin

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/occupancy` | Seat occupancy by segment |
| `GET` | `/admin/revenue` | Revenue totals (by date, by segment) |
| `GET` | `/admin/bookings` | All bookings, filterable |

---

## 7. Frontend

### Pages

**Home / Search**
- Select origin station
- Select destination (only stations with `order > origin.order` shown)
- "Find Seats" button

**Seat Map**
- One panel per reserved coach
- Grid of seats colored: Available (green) / Booked (red) / Selected (blue)
- Real-time availability: seat map polls for updates so stale data is minimized
- Click available seat to select

**Booking Form** (drawer or modal)
- Passenger name, email
- Displays: route, seat number, fare breakdown
- Loading state on confirm to prevent double-submit
- On `409 Conflict`: shows "Seat just taken" message + option to join waitlist

**Confirmation Page**
- Booking ID, seat, route, fare, passenger details
- Option to cancel booking

**Admin Dashboard** (`/admin`)
- Occupancy heatmap by segment (which legs are full vs empty)
- Revenue summary (total, by segment, by date)
- Bookings table with filters (status, date, route)

---

## 8. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Backend | NestJS + TypeScript | Opinionated structure, fast to build, shared language with frontend |
| ORM | Prisma | Type-safe, clean migration story, good PostgreSQL support |
| Database | PostgreSQL | EXCLUDE constraints, GIST indexes, strong transaction support |
| Frontend | React + TypeScript + Vite | Component model suits seat map; good DX |
| Styling | Tailwind CSS | Utility-first, fast to build with |
| Data fetching | TanStack Query | Server state management, loading/error states, polling |
| Infra | Docker Compose | Single-command setup from a clean machine |

---

## 9. Stack Decision Records

Why each technology was chosen over its main alternatives.

### Backend Framework: NestJS vs alternatives

| Alternative | Why not chosen |
|---|---|
| **Go (Chi + sqlc)** | Excellent for high-throughput production services, but slower to build with. The concurrency advantage doesn't apply here — correctness is handled by PostgreSQL's EXCLUSION constraint, not the language runtime. NestJS reaches the same correctness with less code for this use case. |
| **Express / Fastify** | Unopinionated — you get a router and nothing else. Fine for small services, but you end up rebuilding the structure NestJS gives you for free (DI, modules, validation, interceptors). For a codebase meant to look production-ready, NestJS's conventions are an asset. |
| **Django (Python)** | Strong ORM and admin out of the box, but Python is a third language on the stack (TypeScript frontend + Python backend). NestJS keeps the stack TypeScript end-to-end. |
| **Spring Boot (Java)** | Mature and production-proven, but significantly more boilerplate and a heavier deployment footprint. Overkill for this scope. |

**Chosen: NestJS** — opinionated structure, TypeScript end-to-end, fast to build, widely used in production.

---

### ORM: Prisma vs alternatives

| Alternative | Why not chosen |
|---|---|
| **TypeORM** | The most common NestJS ORM, but has a history of bugs with complex queries and its decorator-heavy API can obscure what SQL is actually being run. Prisma's generated client is more predictable. |
| **Drizzle** | Newer, closer to raw SQL, excellent type safety. A strong contender — but Prisma's migration tooling (`prisma migrate`) is more mature and the ecosystem is larger for onboarding. |
| **Sequelize** | Older, less type-safe, not idiomatic with TypeScript. Ruled out early. |
| **Raw SQL (pg / pgx)** | Maximum control, but we lose migrations, schema management, and type safety. The overlap query is the only truly custom SQL we need — Prisma handles everything else cleanly, and raw queries can still be run via `prisma.$queryRaw` when needed. |

**Chosen: Prisma** — best migration story, strong TypeScript integration, readable schema definition.

---

### Database: PostgreSQL vs alternatives

| Alternative | Why not chosen |
|---|---|
| **MySQL** | No native EXCLUSION constraint support. We'd have to implement overlap checking entirely in application code with explicit locks — more complex and less safe. PostgreSQL's GIST-based exclusion constraint is the cleanest solution to the core concurrency problem. |
| **MongoDB** | Document model is a poor fit for relational data (seats, stations, bookings with foreign keys). Atomic overlap checking across documents is significantly harder without transactions. |
| **SQLite** | No EXCLUDE constraints, no concurrent write support. Fine for prototypes, not for a system that must handle concurrent booking attempts correctly. |

**Chosen: PostgreSQL** — EXCLUDE constraints solve our hardest problem at the database level, atomically and without application-level lock management.

---

### Frontend: React vs alternatives

| Alternative | Why not chosen |
|---|---|
| **Next.js** | SSR/SSG adds complexity we don't need. This is a booking app — all pages are user-specific and dynamic. Client-side rendering is appropriate and simpler. |
| **Vue** | Solid choice, but the team (and the TypeScript ecosystem) is more mature around React. Seat map visualization is component-heavy — React's model suits it well. |
| **Svelte** | Excellent DX and small bundle, but smaller ecosystem and fewer component libraries for things like seat grids and modals. |
| **Plain HTML + HTMX** | Would work for simple CRUD, but a seat map with real-time availability and interactive state is a genuinely component-driven UI. A reactive framework is the right tool. |

**Chosen: React + TypeScript + Vite** — component model suits the seat map, large ecosystem, same language as the backend.

---

### Data Fetching: TanStack Query vs alternatives

| Alternative | Why not chosen |
|---|---|
| **Plain fetch / useEffect** | Works, but you manually re-implement loading states, error handling, caching, and polling — exactly what TanStack Query provides. |
| **SWR** | Similar to TanStack Query, slightly simpler API. TanStack Query has better devtools, more granular cache control, and more flexibility for the polling we need on seat availability. |
| **Redux Toolkit Query** | Good if you already have Redux for global state. We don't — adding Redux for fetching alone is unnecessary overhead. |

**Chosen: TanStack Query** — handles loading/error states, caching, and polling out of the box; critical for real-time seat map updates and booking conflict UX.

---

### Styling: Tailwind CSS vs alternatives

| Alternative | Why not chosen |
|---|---|
| **Material UI / Chakra UI** | Component libraries are fast to start but the seat map is a custom visual — you end up fighting the library's opinions for anything non-standard. |
| **CSS Modules** | Clean isolation, but more files and more context-switching for a fast build. |
| **styled-components** | Runtime CSS-in-JS adds unnecessary overhead and complexity for what is essentially a styling question. |

**Chosen: Tailwind** — utility-first makes custom components (seat grids, status colors) fast to build without fighting framework opinions.

---

### Infrastructure: Docker Compose vs alternatives

| Alternative | Why not chosen |
|---|---|
| **Kubernetes** | Right tool for production orchestration at scale, but massively over-engineered for a one-command local setup. Adds YAML complexity that obscures the application. |
| **Bare metal / manual setup** | Violates the "runs in one shot from a clean machine" requirement. |
| **Heroku / Railway / Render** | Platform-as-a-service is fast to deploy but introduces a third-party dependency and doesn't demonstrate infrastructure knowledge. Docker Compose is self-contained and reproducible. |

**Chosen: Docker Compose** — single command, no external dependencies, reproducible on any machine with Docker installed.

---

## 10. Scalability

### Realistic Load for This System

The train has 3 reserved coaches × 48 seats = **144 bookable seats per journey**.
Peak concurrent booking attempts on the same seat are inherently rare — the physical seat
count is the real constraint, not the software.

A single NestJS + PostgreSQL instance can handle:
- ~5,000–10,000 req/sec for read queries (seat availability checks)
- ~500–2,000 writes/sec for bookings (limited by PostgreSQL write throughput + GIST index)

This exceeds any realistic load for this route.

### Bottlenecks at True Scale

| Bottleneck | Problem | Mitigation |
|---|---|---|
| Single DB instance | Write throughput ceiling | Read replicas + PgBouncer connection pooling |
| Single NestJS instance | CPU/memory ceiling | Horizontal scaling behind a load balancer |
| Server-side session state | Breaks horizontal scaling | Stateless design — no server-side sessions |
| Repeated availability reads | Every check hits DB | Redis cache on availability endpoint, invalidated on booking/cancel |
| GIST index under write storm | Contention on same seat | Advisory locks per seat as fallback if needed (unlikely in practice) |

### What We Build Now for Scale-Readiness

These cost little to do now and make future scaling straightforward:

- **Stateless backend** — no in-memory state; JWT-ready design
- **`/health` endpoint** — load balancer readiness probe
- **PgBouncer in Docker Compose** — connection pooling from day one
- **Availability endpoint designed for caching** — clean cache key (`from_id`, `to_id`), so Redis can sit in front of it later with no API changes

### What Is Left for Future Infrastructure Work

These are not built now but are non-breaking additions later:

- Horizontal NestJS instances (Kubernetes / ECS)
- PostgreSQL read replicas
- Redis availability cache
- CDN for frontend static assets

---

## 10. Non-Functional Requirements

- **Correctness over performance** — double-booking must be impossible under any concurrency
- **Configurable** — stations, coaches, seats, and fare rate seeded from config/env; no magic numbers in code
- **No secrets in version control** — `.env.example` provided, `.env` gitignored
- **One-command setup** — `docker compose up` starts everything (DB, migrations, seed data, backend, frontend)

---

## 11. Extra Credit (prioritized)

1. **Seat map visualization** — visual grid per coach with color-coded availability
2. **Waitlisting** — queue per segment; promotion on cancellation
3. **Admin dashboard** — occupancy by segment, revenue by date/route
4. **Real-time seat availability** — polling so seat map updates without manual refresh
5. **Booking conflict UX** — clear loading states, "seat just taken" messaging, one-click waitlist join

---

## 12. Out of Scope / Future Considerations

- Return journey / multi-trip scheduling
- Seat preference (window/aisle)
- Group bookings
- Payment gateway integration
- Authentication and user accounts
- Mobile app
- Horizontal scaling infrastructure (designed for it, not built)